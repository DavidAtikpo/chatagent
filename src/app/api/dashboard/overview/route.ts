import { getDashboardStats } from "@/lib/dashboard-data";
import { queryOne, queryRows } from "@/lib/db";
import { getOwnerSiteIds } from "@/lib/org-server";
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

    const siteIds = await getOwnerSiteIds(user.id);
    const admin = createAdminClient();

    const organization = await queryOne<{
      id: string;
      name: string;
      subscription_plan: string;
      subscription_status: string;
    }>(
      `SELECT id, name, subscription_plan, subscription_status FROM organizations WHERE owner_id = $1`,
      [user.id]
    );

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
      recentConversations = await queryRows(
        `SELECT c.id, c.status, c.lead_score, c.updated_at, s.name AS site_name
         FROM conversations c
         INNER JOIN sites s ON s.id = c.site_id
         WHERE c.site_id = ANY($1::uuid[])
         ORDER BY c.updated_at DESC
         LIMIT 5`,
        [siteIds]
      );
      recentConversations = recentConversations.map((row) => {
        const r = row as Record<string, unknown>;
        return { ...r, sites: { name: r.site_name } };
      });
    }

    const leads = await queryRows(
      `SELECT id, score, name, email, created_at
       FROM leads
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [organization.id]
    );

    return NextResponse.json({
      stats,
      recentConversations,
      recentLeads: leads,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
