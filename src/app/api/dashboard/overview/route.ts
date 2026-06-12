import { createAdminClient } from "@/lib/setup-account-server";
import { getOwnerSiteIds } from "@/lib/org-server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/dashboard-data";
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

    const { data: organization } = await admin
      .from("organizations")
      .select("id, name, subscription_plan, subscription_status")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!organization) {
      return NextResponse.json({
        stats: { conversations: 0, leads: 0, avgScore: 0, conversionRate: 0 },
        recentConversations: [],
        recentLeads: [],
      });
    }

    const stats = await getDashboardStats(admin, organization.id, siteIds);

    let recentConversations: unknown[] = [];
    if (siteIds.length) {
      const { data: convs } = await admin
        .from("conversations")
        .select("id, status, lead_score, updated_at, sites(name)")
        .in("site_id", siteIds)
        .order("updated_at", { ascending: false })
        .limit(5);
      recentConversations = convs ?? [];
    }

    const { data: leads } = await admin
      .from("leads")
      .select("id, score, name, email, created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats,
      recentConversations,
      recentLeads: leads ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
