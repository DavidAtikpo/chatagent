import { createAdminClient } from "@/lib/setup-account-server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function userOwnsLink(userId: string, linkId: string) {
  const admin = createAdminClient();
  const { data: link } = await admin.from("traffic_links").select("site_id").eq("id", linkId).maybeSingle();
  if (!link) return false;

  const { data: site } = await admin
    .from("sites")
    .select("organization_id")
    .eq("id", link.site_id)
    .maybeSingle();
  if (!site) return false;

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("id", site.organization_id)
    .eq("owner_id", userId)
    .maybeSingle();

  return !!org;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!(await userOwnsLink(user.id, params.id))) {
      return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, string | null> = {};

    if ("label" in body) {
      updates.label = body.label ? String(body.label) : null;
    }
    if ("imageUrl" in body) {
      updates.image_url = body.imageUrl ? String(body.imageUrl).trim() : null;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("traffic_links")
      .update(updates)
      .eq("id", params.id)
      .select("id, slug, source, label, image_url, click_count, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ link: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!(await userOwnsLink(user.id, params.id))) {
      return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("traffic_links").delete().eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
