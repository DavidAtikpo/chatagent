import { createAdminClient } from "@/lib/setup-account-server";
import { createClient } from "@/lib/supabase/server";
import {
  aggregateCountryStats,
  normalizeCountryLabel,
  type CountryStat,
} from "@/lib/dashboard-data";
import { NextResponse } from "next/server";

async function getUserOrgSiteIds(userId: string) {
  const admin = createAdminClient();
  const { data: orgs } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_id", userId);

  if (!orgs?.length) return [] as string[];

  const orgIds = orgs.map((o) => o.id);
  const { data: sites } = await admin
    .from("sites")
    .select("id")
    .in("organization_id", orgIds);

  return sites?.map((s) => s.id) ?? [];
}

function countryFromQualification(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const country = (data as Record<string, unknown>).country;
  if (typeof country !== "string" || !country.trim()) return null;
  return normalizeCountryLabel(country.trim());
}

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const siteIds = await getUserOrgSiteIds(user.id);
    if (!siteIds.length) {
      return NextResponse.json({ stats: [] satisfies CountryStat[] });
    }

    const admin = createAdminClient();
    const countries: string[] = [];

    // Read qualification_data.country saved directly during chat (no messages join needed)
    const { data: conversations, error: convError } = await admin
      .from("conversations")
      .select("qualification_data")
      .in("site_id", siteIds)
      .not("qualification_data", "is", null);

    if (convError) {
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    for (const row of conversations ?? []) {
      const country = countryFromQualification(row.qualification_data);
      if (country) countries.push(country);
    }

    // Also pull from leads table (country is always normalized at insert time)
    const { data: leads } = await admin
      .from("leads")
      .select("country")
      .in("site_id", siteIds)
      .not("country", "is", null);

    for (const lead of leads ?? []) {
      if (lead.country) {
        const normalized = normalizeCountryLabel(lead.country);
        if (normalized) countries.push(normalized);
      }
    }

    const { data: sites } = await admin
      .from("sites")
      .select("agent_config")
      .in("id", siteIds);

    for (const site of sites ?? []) {
      const byLink = (site.agent_config as Record<string, unknown> | null)?.tracked_link_countries;
      if (!byLink || typeof byLink !== "object") continue;
      for (const slugStats of Object.values(byLink as Record<string, unknown>)) {
        if (!slugStats || typeof slugStats !== "object") continue;
        for (const [country, count] of Object.entries(slugStats as Record<string, unknown>)) {
          const label = normalizeCountryLabel(country);
          const n = typeof count === "number" ? count : 0;
          if (label && n > 0) {
            for (let i = 0; i < n; i += 1) countries.push(label);
          }
        }
      }
    }

    return NextResponse.json({ stats: aggregateCountryStats(countries) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
