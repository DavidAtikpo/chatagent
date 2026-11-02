import { createAdminClient } from "@/lib/setup-account-server";
import { queryOne } from "@/lib/db";
import { userOwnsSite } from "@/lib/site-access";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!(await userOwnsSite(user.id, siteId))) {
      return NextResponse.json({ error: "Site introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if ("crawl_status" in body) {
      updates.push(`crawl_status = $${i++}`);
      values.push(String(body.crawl_status));
    }
    if ("is_active" in body) {
      updates.push(`is_active = $${i++}`);
      values.push(Boolean(body.is_active));
    }
    if ("business_description" in body) {
      updates.push(`business_description = $${i++}`);
      values.push(body.business_description ? String(body.business_description) : null);
    }

    if (!updates.length) {
      return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
    }

    values.push(siteId);
    await queryOne(
      `UPDATE sites SET ${updates.join(", ")} WHERE id = $${i} RETURNING id`,
      values
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!(await userOwnsSite(user.id, siteId))) {
      return NextResponse.json({ error: "Site introuvable" }, { status: 404 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("sites").delete().eq("id", siteId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
