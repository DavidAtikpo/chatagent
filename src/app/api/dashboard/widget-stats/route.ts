import { createAdminClient } from "@/lib/setup-account-server";
import { createClient } from "@/lib/supabase/server";
import { aggregateWidgetClickStats } from "@/lib/dashboard-data";
import { NextResponse } from "next/server";

async function getUserOrgSiteIds(userId: string) {
  const admin = createAdminClient();
  const { data: orgs } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_id", userId);

  if (!orgs?.length) return [];

  const orgIds = orgs.map((o) => o.id);
  const { data: sites } = await admin
    .from("sites")
    .select("id")
    .in("organization_id", orgIds);

  return sites?.map((s) => s.id) ?? [];
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

    const siteIds = await getUserOrgSiteIds(user.id);
    if (!siteIds.length) {
      return NextResponse.json({ stats: aggregateWidgetClickStats([]) });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("sites")
      .select("agent_config")
      .in("id", siteIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stats: aggregateWidgetClickStats(data ?? []) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
