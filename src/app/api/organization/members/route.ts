import { createAdminClient } from "@/lib/setup-account-server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type OrgMemberRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  display_name: string | null;
  is_available: boolean;
  site_id: string | null;
  site_name?: string | null;
  created_at: string;
  email?: string | null;
};

async function getOwnerOrganization(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select("id, owner_id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const org = await getOwnerOrganization(user.id);
    if (!org) {
      return NextResponse.json({ members: [] });
    }

    const admin = createAdminClient();
    const { data: members, error } = await admin
      .from("organization_members")
      .select("id, organization_id, user_id, role, display_name, is_available, site_id, created_at, sites(name)")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: true });

    if (error) {
      const msg = error.message.includes("organization_members")
        ? "Table organization_members absente — exécutez la migration 009_human_handoff.sql dans Supabase (SQL Editor)."
        : error.message;
      return NextResponse.json({ error: msg, code: "migration_required" }, { status: 500 });
    }

    const enriched: OrgMemberRow[] = [];
    for (const m of members ?? []) {
      const { data: authUser } = await admin.auth.admin.getUserById(m.user_id);
      const sites = m.sites as { name: string } | { name: string }[] | null;
      const siteName = Array.isArray(sites) ? sites[0]?.name : sites?.name;
      enriched.push({
        ...m,
        site_name: siteName ?? null,
        email: authUser.user?.email ?? null,
      });
    }

    return NextResponse.json({ members: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const org = await getOwnerOrganization(user.id);
    if (!org) {
      return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
    }

    let body: { email?: string; display_name?: string; role?: string; site_id?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
    }

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const role = body.role === "admin" ? "admin" : "agent";
    const displayName = String(body.display_name ?? "").trim() || email.split("@")[0];
    const siteId = body.site_id ? String(body.site_id).trim() : null;

    const admin = createAdminClient();

    const { data: orgSites } = await admin
      .from("sites")
      .select("id")
      .eq("organization_id", org.id);
    const validSiteIds = new Set((orgSites ?? []).map((s) => s.id));

    if (role === "agent") {
      if (!siteId || !validSiteIds.has(siteId)) {
        return NextResponse.json(
          { error: "Choisissez un site pour ce conseiller" },
          { status: 400 }
        );
      }
    } else if (siteId && !validSiteIds.has(siteId)) {
      return NextResponse.json({ error: "Site invalide" }, { status: 400 });
    }

    let targetUserId: string | null = null;

    const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = listData.users.find((u) => u.email?.toLowerCase() === email);
    if (existing) {
      targetUserId = existing.id;
    } else {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const { data: inviteData, error: inviteError } =
        await admin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${appUrl}/login`,
        });
      if (inviteError || !inviteData.user) {
        return NextResponse.json(
          { error: inviteError?.message ?? "Invitation impossible" },
          { status: 400 }
        );
      }
      targetUserId = inviteData.user.id;
    }

    const { data: existingMember } = await admin
      .from("organization_members")
      .select("id, role")
      .eq("organization_id", org.id)
      .eq("user_id", targetUserId)
      .maybeSingle();

    // Membre déjà présent → mise à jour du site et du nom affiché
    if (existingMember) {
      if (existingMember.role === "owner") {
        return NextResponse.json(
          { error: "Ce compte est le propriétaire de l'organisation, vous ne pouvez pas modifier son rôle." },
          { status: 409 }
        );
      }
      const { data: updated, error: updateError } = await admin
        .from("organization_members")
        .update({
          site_id: role === "agent" ? siteId : null,
          display_name: displayName,
          role,
        })
        .eq("id", existingMember.id)
        .select("id, organization_id, user_id, role, display_name, is_available, site_id, created_at")
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        member: { ...updated, email },
        invited: false,
        updated: true,
      });
    }

    const { data: member, error: insertError } = await admin
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: targetUserId,
        role,
        display_name: displayName,
        is_available: true,
        site_id: role === "agent" ? siteId : null,
      })
      .select("id, organization_id, user_id, role, display_name, is_available, site_id, created_at")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      member: { ...member, email },
      invited: !existing,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
