import { requireSession, isSessionUser } from "@/lib/auth/require-session";
import { queryOne, queryRows } from "@/lib/db";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/setup-account-server";

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

export async function GET() {
  try {
    const session = await requireSession();
    if (!isSessionUser(session)) return session;

    const org = await queryOne<{ id: string; owner_id: string }>(
      `SELECT id, owner_id FROM organizations WHERE owner_id = $1 LIMIT 1`,
      [session.id]
    );
    if (!org) {
      return NextResponse.json({ members: [] });
    }

    const rows = await queryRows<{
      id: string;
      organization_id: string;
      user_id: string;
      role: string;
      display_name: string | null;
      is_available: boolean;
      site_id: string | null;
      created_at: string;
      site_name: string | null;
      email: string | null;
    }>(
      `SELECT om.id, om.organization_id, om.user_id, om.role, om.display_name,
              om.is_available, om.site_id, om.created_at,
              s.name AS site_name, u.email
       FROM organization_members om
       LEFT JOIN sites s ON s.id = om.site_id
       LEFT JOIN app_users u ON u.id = om.user_id
       WHERE om.organization_id = $1
       ORDER BY om.created_at ASC`,
      [org.id]
    );

    const members: OrgMemberRow[] = rows.map((m) => ({
      id: m.id,
      organization_id: m.organization_id,
      user_id: m.user_id,
      role: m.role,
      display_name: m.display_name,
      is_available: m.is_available,
      site_id: m.site_id,
      created_at: m.created_at,
      site_name: m.site_name,
      email: m.email,
    }));

    return NextResponse.json({ members });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!isSessionUser(session)) return session;

    const org = await queryOne<{ id: string }>(
      `SELECT id FROM organizations WHERE owner_id = $1 LIMIT 1`,
      [session.id]
    );
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

    const orgSites = await queryRows<{ id: string }>(
      `SELECT id FROM sites WHERE organization_id = $1`,
      [org.id]
    );
    const validSiteIds = new Set(orgSites.map((s) => s.id));

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

    const admin = createAdminClient();

    const { data: listData } = await admin.auth.admin.listUsers();
    const existing = listData.users.find((u: { email?: string }) => u.email?.toLowerCase() === email);
    let targetUserId: string | null = existing?.id ?? null;

    if (!targetUserId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
        email,
        { redirectTo: `${appUrl}/login` }
      );
      if (inviteError || !inviteData.user) {
        return NextResponse.json(
          { error: inviteError?.message ?? "Invitation impossible" },
          { status: 400 }
        );
      }
      targetUserId = inviteData.user.id;
    }

    const existingMember = await queryOne<{ id: string; role: string }>(
      `SELECT id, role FROM organization_members
       WHERE organization_id = $1 AND user_id = $2 LIMIT 1`,
      [org.id, targetUserId]
    );

    if (existingMember) {
      if (existingMember.role === "owner") {
        return NextResponse.json(
          { error: "Ce compte est le propriétaire de l'organisation, vous ne pouvez pas modifier son rôle." },
          { status: 409 }
        );
      }
      const updated = await queryOne<OrgMemberRow>(
        `UPDATE organization_members
         SET site_id = $1, display_name = $2, role = $3
         WHERE id = $4
         RETURNING id, organization_id, user_id, role, display_name, is_available, site_id, created_at`,
        [role === "agent" ? siteId : null, displayName, role, existingMember.id]
      );

      return NextResponse.json({
        member: { ...updated, email },
        invited: false,
        updated: true,
      });
    }

    const member = await queryOne<OrgMemberRow>(
      `INSERT INTO organization_members
         (organization_id, user_id, role, display_name, is_available, site_id)
       VALUES ($1, $2, $3, $4, true, $5)
       RETURNING id, organization_id, user_id, role, display_name, is_available, site_id, created_at`,
      [org.id, targetUserId, role, displayName, role === "agent" ? siteId : null]
    );

    return NextResponse.json({
      member: { ...member, email },
      invited: !existing,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
