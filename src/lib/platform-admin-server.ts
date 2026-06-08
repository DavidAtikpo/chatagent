import { createAdminClient } from "@/lib/setup-account-server";
import { createClient } from "@/lib/supabase/server";
import type { PlatformOrganization, PlatformStats } from "@/lib/platform-admin";

function adminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = adminEmails();
  if (!list.length) return false;
  return list.includes(email.toLowerCase());
}

/** Returns the authenticated user if they are a platform admin, else null. */
export async function requirePlatformAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformAdminEmail(user.email)) return null;
  return user;
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const admin = createAdminClient();

  const [
    { count: orgCount },
    { data: sites },
    { count: convCount },
    { count: leadCount },
    { data: orgs },
  ] = await Promise.all([
    admin.from("organizations").select("id", { count: "exact", head: true }),
    admin.from("sites").select("id, is_active"),
    admin.from("conversations").select("id", { count: "exact", head: true }),
    admin.from("leads").select("id", { count: "exact", head: true }),
    admin.from("organizations").select("subscription_plan"),
  ]);

  const planMap = new Map<string, number>();
  for (const row of orgs ?? []) {
    const plan = (row.subscription_plan || "starter").toLowerCase();
    planMap.set(plan, (planMap.get(plan) ?? 0) + 1);
  }

  const siteRows = sites ?? [];
  return {
    organizations: orgCount ?? 0,
    sites: siteRows.length,
    activeSites: siteRows.filter((s) => s.is_active).length,
    conversations: convCount ?? 0,
    leads: leadCount ?? 0,
    plans: Array.from(planMap.entries())
      .map(([plan, count]) => ({ plan, count }))
      .sort((a, b) => b.count - a.count),
  };
}

async function ownerEmailMap(ownerIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!ownerIds.length) return map;

  const admin = createAdminClient();
  const unique = Array.from(new Set(ownerIds));

  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data.users.length) break;
    for (const u of data.users) {
      if (unique.includes(u.id) && u.email) map.set(u.id, u.email);
    }
    if (data.users.length < perPage || map.size >= unique.length) break;
    page += 1;
  }

  return map;
}

export async function fetchPlatformOrganizations(): Promise<PlatformOrganization[]> {
  const admin = createAdminClient();

  const { data: orgs, error } = await admin
    .from("organizations")
    .select("id, name, owner_id, subscription_plan, subscription_status, created_at")
    .order("created_at", { ascending: false });

  if (error || !orgs?.length) return [];

  const orgIds = orgs.map((o) => o.id);
  const ownerIds = orgs.map((o) => o.owner_id);

  const [{ data: sites }, { data: leads }, emails] = await Promise.all([
    admin.from("sites").select("id, organization_id").in("organization_id", orgIds),
    admin.from("leads").select("id, organization_id").in("organization_id", orgIds),
    ownerEmailMap(ownerIds),
  ]);

  const sitesByOrg = new Map<string, number>();
  const siteToOrg = new Map<string, string>();
  for (const s of sites ?? []) {
    sitesByOrg.set(s.organization_id, (sitesByOrg.get(s.organization_id) ?? 0) + 1);
    siteToOrg.set(s.id, s.organization_id);
  }

  const siteIds = Array.from(siteToOrg.keys());
  const convsByOrg = new Map<string, number>();
  if (siteIds.length) {
    const { data: convs } = await admin.from("conversations").select("site_id").in("site_id", siteIds);
    for (const c of convs ?? []) {
      const orgId = siteToOrg.get(c.site_id);
      if (orgId) convsByOrg.set(orgId, (convsByOrg.get(orgId) ?? 0) + 1);
    }
  }

  const leadsByOrg = new Map<string, number>();
  for (const l of leads ?? []) {
    leadsByOrg.set(l.organization_id, (leadsByOrg.get(l.organization_id) ?? 0) + 1);
  }

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    owner_id: o.owner_id,
    owner_email: emails.get(o.owner_id) ?? null,
    subscription_plan: o.subscription_plan ?? "starter",
    subscription_status: o.subscription_status ?? "trialing",
    sites_count: sitesByOrg.get(o.id) ?? 0,
    conversations_count: convsByOrg.get(o.id) ?? 0,
    leads_count: leadsByOrg.get(o.id) ?? 0,
    created_at: o.created_at,
  }));
}
