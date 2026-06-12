import { createAdminClient } from "@/lib/setup-account-server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function assertOwner(userId: string, memberId: string) {
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (!org) return null;

  const { data: member } = await admin
    .from("organization_members")
    .select("id, organization_id, user_id, role")
    .eq("id", memberId)
    .eq("organization_id", org.id)
    .maybeSingle();

  return member;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const member = await assertOwner(user.id, id);
    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    let body: { display_name?: string; is_available?: boolean; role?: string; site_id?: string | null };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.display_name !== undefined) {
      updates.display_name = String(body.display_name).trim().slice(0, 80) || null;
    }
    if (body.is_available !== undefined) {
      updates.is_available = Boolean(body.is_available);
    }
    if (body.role !== undefined && member.role !== "owner") {
      updates.role = body.role === "admin" ? "admin" : "agent";
    }
    if (body.site_id !== undefined && member.role !== "owner") {
      updates.site_id = body.site_id || null;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("organization_members")
      .update(updates)
      .eq("id", id)
      .select("id, organization_id, user_id, role, display_name, is_available, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const member = await assertOwner(user.id, id);
    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    if (member.role === "owner") {
      return NextResponse.json(
        { error: "Impossible de retirer le propriétaire" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.from("organization_members").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
