import { createAdminClient } from "@/lib/setup-account-server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function newWidgetKey() {
  return `wk_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
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

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const url = String(body.url ?? "").trim();
    const organizationId = String(body.organizationId ?? "").trim();

    if (!name || !url || !organizationId) {
      return NextResponse.json({ error: "Nom, URL et organisation requis" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: organization, error: orgError } = await admin
      .from("organizations")
      .select("id")
      .eq("id", organizationId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }

    if (!organization) {
      return NextResponse.json({ error: "Organisation non autorisée" }, { status: 403 });
    }

    const { data: site, error: siteError } = await admin
      .from("sites")
      .insert({
        organization_id: organizationId,
        name,
        url,
        crawl_status: "pending",
        widget_key: newWidgetKey(),
      })
      .select("id, name, url, widget_key, crawl_status, is_active, organization_id")
      .single();

    if (siteError) {
      return NextResponse.json({ error: siteError.message }, { status: 500 });
    }

    return NextResponse.json({ site });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
