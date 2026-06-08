import { SupabaseClient } from "@supabase/supabase-js";

import { getOrganization } from "@/lib/dashboard-data";
import { setupAccount } from "@/lib/setup-account";

export async function ensureOrganization(supabase: SupabaseClient) {
  const { user, organization } = await getOrganization(supabase);
  if (!user) return { user: null, organization: null };
  if (organization) return { user, organization };

  const meta = user.user_metadata ?? {};
  const companyName = meta.company_name as string | undefined;
  const siteUrl = meta.site_url as string | undefined;

  if (companyName && siteUrl) {
    try {
      if (typeof window === "undefined") {
        const { setupAccountForUser } = await import("@/lib/setup-account-server");
        await setupAccountForUser(user.id, companyName, siteUrl);
      } else {
        await setupAccount(supabase, user.id, companyName, siteUrl);
      }
      const result = await getOrganization(supabase);
      return { user: result.user, organization: result.organization };
    } catch (err) {
      console.error("[ensureOrganization]", err);
    }
  }

  return { user, organization: null };
}
