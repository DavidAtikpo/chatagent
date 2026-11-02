import { queryRows } from "@/lib/db";

export async function getUserOrgSiteIds(userId: string): Promise<string[]> {
  const sites = await queryRows<{ id: string }>(
    `SELECT s.id
     FROM sites s
     INNER JOIN organizations o ON o.id = s.organization_id
     WHERE o.owner_id = $1`,
    [userId]
  );
  return sites.map((s) => s.id);
}

export async function userOwnsSite(userId: string, siteId: string): Promise<boolean> {
  const siteIds = await getUserOrgSiteIds(userId);
  return siteIds.includes(siteId);
}
