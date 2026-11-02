import type { Site } from "@/lib/dashboard-data";
import type { SiteProfileType } from "@/lib/site-profile";

export function siteProfileType(site: Site): SiteProfileType {
  const t = site.agent_config?.profile_type;
  if (t === "shop") return "other";
  if (t === "job_search" || t === "other") return t;
  return "website";
}

export function filterSitesByProfile(sites: Site[], profileType: SiteProfileType): Site[] {
  return sites.filter((s) => siteProfileType(s) === profileType);
}
