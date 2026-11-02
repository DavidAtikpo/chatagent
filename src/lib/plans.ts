export type SubscriptionPlan = "free" | "starter" | "pro" | "agency";

/** Plan checks only need subscription fields (full Organization optional). */
export type PlanSubscription = {
  subscription_plan?: string | null;
  subscription_status?: string | null;
};

const STARTER_AND_UP = new Set<SubscriptionPlan>(["starter", "pro", "agency"]);
const PRO_AND_UP = new Set<SubscriptionPlan>(["pro", "agency"]);
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function normalizePlan(plan: string | null | undefined): SubscriptionPlan {
  const p = (plan ?? "free").toLowerCase();
  if (p === "starter" || p === "pro" || p === "agency") return p;
  if (p === "free") return "free";
  return "free";
}

export function isSubscriptionActive(status: string | null | undefined): boolean {
  return ACTIVE_STATUSES.has((status ?? "").toLowerCase());
}

function orgPlan(org: PlanSubscription | null | undefined): SubscriptionPlan {
  return normalizePlan(org?.subscription_plan ?? undefined);
}

function orgActive(org: PlanSubscription | null | undefined): boolean {
  return isSubscriptionActive(org?.subscription_status ?? undefined);
}

/** Widget embed + logo entreprise — Starter (ou supérieur) actif. */
export function hasStarterFeatures(org: PlanSubscription | null | undefined): boolean {
  if (!org || !orgActive(org)) return false;
  return STARTER_AND_UP.has(orgPlan(org));
}

/** Profils Emploi & Autre — Pro (or Agency) actif. */
export function hasProProfileFeatures(org: PlanSubscription | null | undefined): boolean {
  if (!org || !orgActive(org)) return false;
  return PRO_AND_UP.has(orgPlan(org));
}

/** WhatsApp / Appel / Email / CTA — Pro (or Agency) actif. */
export function hasProFeatures(org: PlanSubscription | null | undefined): boolean {
  return hasProProfileFeatures(org);
}

export function canCreateProfileType(
  org: PlanSubscription | null | undefined,
  profileType: "website" | "job_search" | "other"
): boolean {
  if (profileType === "website") return Boolean(org);
  return hasProProfileFeatures(org);
}

export function planDisplayLabel(plan: string | null | undefined): string {
  const p = normalizePlan(plan);
  if (p === "free") return "Free";
  if (p === "starter") return "Starter";
  if (p === "pro") return "Pro";
  return "Agency";
}
