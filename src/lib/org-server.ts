import { createAdminClient } from "@/lib/setup-account-server";

export async function getOwnerSiteIds(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data: organization } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!organization) return [];

  const { data: sites } = await admin
    .from("sites")
    .select("id")
    .eq("organization_id", organization.id);

  return sites?.map((s) => s.id) ?? [];
}
