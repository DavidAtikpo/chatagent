/** Client-safe types and helpers for platform admin UI. */

export type PlatformStats = {
  organizations: number;
  sites: number;
  activeSites: number;
  conversations: number;
  leads: number;
  plans: { plan: string; count: number }[];
};

export type PlatformOrganization = {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string | null;
  subscription_plan: string;
  subscription_status: string;
  sites_count: number;
  conversations_count: number;
  leads_count: number;
  created_at: string;
};

export function planLabel(plan: string): string {
  const p = plan.toLowerCase();
  if (p === "pro") return "Pro";
  if (p === "agency") return "Agency";
  if (p === "starter") return "Starter";
  return plan;
}

export function statusBadge(status: string): string {
  const s = status.toLowerCase();
  if (s === "active") return "bg-emerald-100 text-emerald-800";
  if (s === "trialing") return "bg-blue-100 text-blue-800";
  if (s === "past_due") return "bg-amber-100 text-amber-800";
  if (s === "canceled") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
}
