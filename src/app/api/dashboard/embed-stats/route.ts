import { createAdminClient } from "@/lib/setup-account-server";
import { fetchEmbedWidgetStats, fetchEmbedWidgetTimeseries } from "@/lib/dashboard-data";
import { getOwnerSiteIds } from "@/lib/org-server";
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

    const siteIds = await getOwnerSiteIds(user.id);
    const admin = createAdminClient();
    const [stats, timeseries] = await Promise.all([
      fetchEmbedWidgetStats(admin, siteIds),
      fetchEmbedWidgetTimeseries(admin, siteIds),
    ]);

    return NextResponse.json({ ...stats, ...timeseries });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
