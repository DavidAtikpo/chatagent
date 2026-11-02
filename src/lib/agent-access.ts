import { queryRows } from "@/lib/db";

type MemberRow = {
  organization_id: string;
  site_id: string | null;
  role: string;
};

/** Sites accessibles : propriétaire/admin (tous les sites org) ou conseiller (site assigné). */
export async function getAccessibleSiteIds(userId: string): Promise<string[]> {
  const siteIds = new Set<string>();

  const ownedOrgSites = await queryRows<{ id: string }>(
    `SELECT s.id
     FROM sites s
     INNER JOIN organizations o ON o.id = s.organization_id
     WHERE o.owner_id = $1`,
    [userId]
  );
  for (const row of ownedOrgSites) siteIds.add(row.id);

  let members: MemberRow[] = [];
  try {
    members = await queryRows<MemberRow>(
      `SELECT organization_id, site_id, role
       FROM organization_members
       WHERE user_id = $1`,
      [userId]
    );
  } catch {
    members = await queryRows<MemberRow>(
      `SELECT organization_id, role
       FROM organization_members
       WHERE user_id = $1`,
      [userId]
    ).then((rows) => rows.map((r) => ({ ...r, site_id: null as string | null })));
  }

  for (const member of members) {
    const orgId = member.organization_id;
    const role = member.role ?? "agent";
    const assignedSite = member.site_id;

    if (role === "owner" || role === "admin" || !assignedSite) {
      const orgSites = await queryRows<{ id: string }>(
        `SELECT id FROM sites WHERE organization_id = $1`,
        [orgId]
      );
      for (const s of orgSites) siteIds.add(s.id);
    } else {
      siteIds.add(assignedSite);
    }
  }

  return [...siteIds];
}

export async function userCanAccessConversation(
  userId: string,
  conversationId: string
): Promise<{ ok: boolean; siteId?: string }> {
  const conv = await queryRows<{ site_id: string }>(
    `SELECT site_id FROM conversations WHERE id = $1 LIMIT 1`,
    [conversationId]
  );
  if (!conv[0]?.site_id) return { ok: false };
  const allowed = await getAccessibleSiteIds(userId);
  return { ok: allowed.includes(conv[0].site_id), siteId: conv[0].site_id };
}
