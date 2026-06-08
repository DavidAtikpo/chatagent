import type { Organization } from "@/lib/dashboard-data";

const PRO_PLANS = new Set(["pro", "agency"]);
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

/** WhatsApp / Appel / Email / CTA icons — Plan Pro (ou Agency) actif uniquement. */
export function hasProFeatures(org: Organization | null | undefined): boolean {
  if (!org) return false;
  const plan = (org.subscription_plan ?? "starter").toLowerCase();
  const status = (org.subscription_status ?? "").toLowerCase();
  return PRO_PLANS.has(plan) && ACTIVE_STATUSES.has(status);
}
