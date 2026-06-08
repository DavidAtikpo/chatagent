import { createAdminClient } from "@/lib/setup-account-server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: organization, error: orgError } = await admin
      .from("organizations")
      .select("id, name, subscription_plan, subscription_status")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }

    if (!organization) {
      return NextResponse.json({ organization: null, sites: [] });
    }

    const { data: sites, error: sitesError } = await admin
      .from("sites")
      .select(
        "id, name, url, widget_key, crawl_status, is_active, organization_id, whatsapp_number, agent_config"
      )
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false });

    if (sitesError) {
      return NextResponse.json({ error: sitesError.message }, { status: 500 });
    }

    return NextResponse.json({ organization, sites: sites ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
