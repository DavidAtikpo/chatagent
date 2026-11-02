import { getAccessibleSiteIds, userCanAccessConversation } from "@/lib/agent-access";
import { queryOne, queryRows } from "@/lib/db";

export type HandoffInboxRow = {
  id: string;
  site_id: string;
  site_name: string;
  handoff_status: string;
  handoff_reason: string | null;
  handoff_requested_at: string | null;
  lead_score: number;
  page_url: string | null;
  updated_at: string;
  assigned_agent_id: string | null;
};

function agentIntroMessage(displayName: string | null, siteName: string) {
  const name = (displayName ?? "").trim() || "votre conseiller";
  return (
    `Je suis **${name}**, conseiller·ère pour **${siteName}**. ` +
    `J'ai lu votre échange avec l'assistant. Comment puis-je vous aider ?`
  );
}

export async function fetchAgentInbox(userId: string) {
  const siteIds = await getAccessibleSiteIds(userId);
  if (!siteIds.length) {
    return { pending: [], active: [], pool_active: [] as HandoffInboxRow[] };
  }

  const siteNames = await queryRows<{ id: string; name: string }>(
    `SELECT id, name FROM sites WHERE id = ANY($1::uuid[])`,
    [siteIds]
  );
  const nameBySite = Object.fromEntries(siteNames.map((s) => [s.id, s.name]));

  const enrich = (rows: HandoffInboxRow[]) =>
    rows.map((r) => ({ ...r, site_name: nameBySite[r.site_id] ?? "Site" }));

  const pending = await queryRows<HandoffInboxRow>(
    `SELECT id, site_id, handoff_status, handoff_reason, handoff_requested_at,
            lead_score, page_url, updated_at, assigned_agent_id
     FROM conversations
     WHERE site_id = ANY($1::uuid[])
       AND handoff_status = 'requested'
     ORDER BY handoff_requested_at DESC NULLS LAST
     LIMIT 50`,
    [siteIds]
  );

  const activeAll = await queryRows<HandoffInboxRow>(
    `SELECT id, site_id, handoff_status, handoff_reason, handoff_requested_at,
            lead_score, page_url, updated_at, assigned_agent_id
     FROM conversations
     WHERE site_id = ANY($1::uuid[])
       AND handoff_status = 'active'
     ORDER BY updated_at DESC
     LIMIT 50`,
    [siteIds]
  );

  const myActive = activeAll.filter((r) => r.assigned_agent_id === userId);
  const poolActive = activeAll.filter((r) => r.assigned_agent_id && r.assigned_agent_id !== userId);

  return {
    pending: enrich(pending),
    active: enrich(myActive),
    pool_active: enrich(poolActive),
  };
}

export async function fetchAgentConversation(userId: string, conversationId: string) {
  const access = await userCanAccessConversation(userId, conversationId);
  if (!access.ok) return null;

  const conversation = await queryOne(
    `SELECT c.*, s.name AS site_name
     FROM conversations c
     LEFT JOIN sites s ON s.id = c.site_id
     WHERE c.id = $1`,
    [conversationId]
  );
  if (!conversation) return null;

  const messages = await queryRows<{ id: string; role: string; content: string; created_at: string }>(
    `SELECT id, role, content, created_at
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );

  return { conversation, messages };
}

export async function claimHandoff(userId: string, conversationId: string) {
  const access = await userCanAccessConversation(userId, conversationId);
  if (!access.ok) throw new Error("Conversation introuvable");

  const conv = await queryOne<{
    handoff_status: string | null;
    assigned_agent_id: string | null;
    site_id: string;
  }>(
    `SELECT handoff_status, assigned_agent_id, site_id FROM conversations WHERE id = $1`,
    [conversationId]
  );
  if (!conv) throw new Error("Conversation introuvable");

  const status = conv.handoff_status ?? "none";
  if (status !== "requested" && status !== "active") {
    throw new Error("Handoff non disponible");
  }
  if (conv.assigned_agent_id && conv.assigned_agent_id !== userId) {
    throw new Error("Déjà prise par un autre conseiller");
  }

  const siteRow = await queryOne<{ name: string; organization_id: string }>(
    `SELECT name, organization_id FROM sites WHERE id = $1`,
    [conv.site_id]
  );
  const siteName = siteRow?.name ?? "notre équipe";

  const member = siteRow?.organization_id
    ? await queryOne<{ display_name: string | null }>(
        `SELECT display_name FROM organization_members
         WHERE organization_id = $1 AND user_id = $2 LIMIT 1`,
        [siteRow.organization_id, userId]
      )
    : null;

  await queryOne(
    `UPDATE conversations SET
       handoff_status = 'active',
       assigned_agent_id = $2,
       handoff_reassured_at = NULL,
       status = 'handed_off',
       updated_at = NOW()
     WHERE id = $1`,
    [conversationId, userId]
  );

  await queryOne(
    `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, 'human', $2)`,
    [conversationId, agentIntroMessage(member?.display_name ?? null, siteName)]
  );

  return { handoff_status: "active", assigned_agent_id: userId };
}

export async function releaseHandoff(userId: string, conversationId: string) {
  const access = await userCanAccessConversation(userId, conversationId);
  if (!access.ok) throw new Error("Conversation introuvable");

  const conv = await queryOne<{ assigned_agent_id: string | null }>(
    `SELECT assigned_agent_id FROM conversations WHERE id = $1`,
    [conversationId]
  );
  if (conv?.assigned_agent_id && conv.assigned_agent_id !== userId) {
    throw new Error("Assignée à un autre conseiller");
  }

  await queryOne(
    `UPDATE conversations SET
       handoff_status = 'returned',
       assigned_agent_id = NULL,
       status = 'active',
       updated_at = NOW()
     WHERE id = $1`,
    [conversationId]
  );

  await queryOne(
    `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, 'assistant', $2)`,
    [
      conversationId,
      "Le conseiller a quitté la conversation. Je reprends — comment puis-je vous aider ?",
    ]
  );

  return { handoff_status: "returned" };
}

export async function sendHumanMessage(userId: string, conversationId: string, content: string) {
  const access = await userCanAccessConversation(userId, conversationId);
  if (!access.ok) throw new Error("Conversation introuvable");

  const conv = await queryOne<{ handoff_status: string | null; assigned_agent_id: string | null }>(
    `SELECT handoff_status, assigned_agent_id FROM conversations WHERE id = $1`,
    [conversationId]
  );
  if (conv?.handoff_status !== "active") {
    throw new Error("Prenez la conversation avant d'envoyer un message");
  }
  if (conv.assigned_agent_id !== userId) {
    throw new Error("Assignée à un autre conseiller");
  }

  const text = content.trim();
  if (!text) throw new Error("Message vide");

  const msg = await queryOne<{ id: string; role: string; content: string; created_at: string }>(
    `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, 'human', $2)
     RETURNING id, role, content, created_at`,
    [conversationId, text]
  );

  await queryOne(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [conversationId]);

  return msg ?? { id: "", role: "human", content: text, created_at: new Date().toISOString() };
}
