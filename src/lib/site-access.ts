import { createAdminClient } from "@/lib/setup-account-server";

export async function getUserOrgSiteIds(userId: string): Promise<string[]> {
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

export async function userOwnsSite(userId: string, siteId: string): Promise<boolean> {
  const siteIds = await getUserOrgSiteIds(userId);
  return siteIds.includes(siteId);
}
