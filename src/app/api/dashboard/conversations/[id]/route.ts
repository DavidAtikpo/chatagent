import { getAccessibleSiteIds } from "@/lib/agent-access";
import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { queryOne, queryRows } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    if (!isSessionUser(session)) return session;

    const siteIds = await getAccessibleSiteIds(session.id);
    if (!siteIds.length) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    const allowed = new Set(siteIds.map(String));

    const row = await queryOne<{
      id: string;
      site_id: string;
      status: string;
      lead_score: number;
      page_url: string | null;
      qualification_data: Record<string, unknown> | null;
      created_at: string;
      updated_at: string;
      handoff_status: string | null;
      handoff_reason: string | null;
      assigned_agent_id: string | null;
      site_name: string | null;
      site_url: string | null;
    }>(
      `SELECT c.id, c.site_id, c.status, c.lead_score, c.page_url, c.qualification_data,
              c.created_at, c.updated_at, c.handoff_status, c.handoff_reason, c.assigned_agent_id,
              s.name AS site_name, s.url AS site_url
       FROM conversations c
       LEFT JOIN sites s ON s.id = c.site_id
       WHERE c.id = $1`,
      [params.id]
    );

    if (!row || !allowed.has(String(row.site_id))) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    const leads = await queryRows<{
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      score: number;
    }>(
      `SELECT id, name, email, phone, score
       FROM leads
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [params.id]
    );

    const messages = await queryRows<{
      id: string;
      role: string;
      content: string;
      created_at: string;
    }>(
      `SELECT id, role, content, created_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [params.id]
    );

    const conversation = {
      id: row.id,
      site_id: row.site_id,
      status: row.status,
      lead_score: row.lead_score,
      page_url: row.page_url,
      qualification_data: row.qualification_data,
      created_at: row.created_at,
      updated_at: row.updated_at,
      handoff_status: row.handoff_status,
      handoff_reason: row.handoff_reason,
      assigned_agent_id: row.assigned_agent_id,
      sites:
        row.site_name != null
          ? { name: row.site_name, url: row.site_url ?? "" }
          : null,
      leads: leads.length === 1 ? leads[0] : leads.length > 1 ? leads : null,
    };

    return NextResponse.json({
      conversation,
      messages,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
