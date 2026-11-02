import { getUserOrgSiteIds } from "@/lib/site-access";

export async function getOwnerSiteIds(userId: string): Promise<string[]> {
  return getUserOrgSiteIds(userId);
}
