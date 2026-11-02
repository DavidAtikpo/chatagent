import { getAccessibleSiteIds } from "@/lib/agent-access";
import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { queryRows } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    if (!isSessionUser(session)) return session;

    const siteIds = await getAccessibleSiteIds(session.id);
    if (!siteIds.length) {
      return NextResponse.json({ conversations: [] });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const params: unknown[] = [siteIds];
    let statusFilter = "";
    if (status && status !== "all") {
      params.push(status);
      statusFilter = ` AND c.status = $2`;
    }

    const rows = await queryRows<{
      id: string;
      status: string;
      lead_score: number;
      page_url: string | null;
      updated_at: string;
      handoff_status: string | null;
      handoff_reason: string | null;
      site_name: string | null;
    }>(
      `SELECT c.id, c.status, c.lead_score, c.page_url, c.updated_at,
              c.handoff_status, c.handoff_reason, s.name AS site_name
       FROM conversations c
       LEFT JOIN sites s ON s.id = c.site_id
       WHERE c.site_id = ANY($1::uuid[])${statusFilter}
       ORDER BY c.updated_at DESC
       LIMIT 100`,
      params
    );

    const conversations = rows.map((row) => ({
      id: row.id,
      status: row.status,
      lead_score: row.lead_score,
      page_url: row.page_url,
      updated_at: row.updated_at,
      handoff_status: row.handoff_status,
      handoff_reason: row.handoff_reason,
      sites: row.site_name != null ? { name: row.site_name } : null,
    }));

    return NextResponse.json({ conversations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
