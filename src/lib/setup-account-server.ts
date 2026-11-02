import { queryOne, queryRows } from "@/lib/db";

export { createAdminClient } from "@/lib/postgres-admin";

function newWidgetKey() {
  return `wk_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

export type SetupAccountInput = {
  companyName: string;
  siteUrl?: string | null;
  businessDescription?: string | null;
};

export async function setupAccountForUser(userId: string, input: SetupAccountInput) {
  const companyName = input.companyName.trim();
  const siteUrl = input.siteUrl?.trim() || null;
  const businessDescription = input.businessDescription?.trim() || null;

  if (!companyName) {
    throw new Error("Nom d'entreprise requis");
  }

  const existingOrg = await queryOne<{ id: string }>(
    `SELECT id FROM organizations WHERE owner_id = $1 LIMIT 1`,
    [userId]
  );

  let organizationId = existingOrg?.id;

  if (!organizationId) {
    const org = await queryOne<{ id: string }>(
      `INSERT INTO organizations (name, owner_id)
       VALUES ($1, $2)
       RETURNING id`,
      [companyName, userId]
    );
    if (!org) throw new Error("Impossible de créer l'organisation");
    organizationId = org.id;

    await queryRows(
      `INSERT INTO organization_members (organization_id, user_id, role, display_name, is_available)
       VALUES ($1, $2, 'owner', $3, true)
       ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [organizationId, userId, companyName]
    );
  }

  const existingSites = await queryRows<{ id: string }>(
    `SELECT id FROM sites WHERE organization_id = $1 LIMIT 1`,
    [organizationId]
  );

  if (existingSites[0]) {
    return { organizationId, siteId: existingSites[0].id };
  }

  if (!siteUrl && !businessDescription) {
    return { organizationId, siteId: null };
  }

  const crawlStatus = siteUrl ? "pending" : "skipped";

  const site = await queryOne<{ id: string }>(
    `INSERT INTO sites (
       organization_id, name, url, widget_key, crawl_status, business_description, agent_config
     )
     VALUES ($1, $2, $3, $4, $5, $6, '{}'::jsonb)
     RETURNING id`,
    [organizationId, companyName, siteUrl, newWidgetKey(), crawlStatus, businessDescription]
  );

  if (!site) throw new Error("Impossible de créer le site");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  if (siteUrl) {
    await fetch(`${apiUrl}/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_id: site.id }),
    }).catch(() => {});
  } else if (businessDescription) {
    await fetch(`${apiUrl}/ingest/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_id: site.id, text: businessDescription }),
    }).catch(() => {});
  }

  return { organizationId, siteId: site.id };
}
