"use client";

import { useT } from "@/i18n/context";
import type { JobProfileMode, SiteProfileType } from "@/lib/site-profile";

const TITLE_KEY: Record<SiteProfileType, string> = {
  website: "dashboard.sites.addTabs.helpWebsiteTitle",
  job_search: "dashboard.sites.addTabs.helpJobOverviewTitle",
  other: "dashboard.sites.addTabs.helpOtherTitle",
};

const BODY_KEY: Record<SiteProfileType, string> = {
  website: "dashboard.sites.addTabs.helpWebsiteBody",
  job_search: "dashboard.sites.addTabs.helpJobOverviewBody",
  other: "dashboard.sites.addTabs.helpOtherBody",
};

export function ProfileTabExplainer({
  profileType,
  jobMode,
}: {
  profileType: SiteProfileType;
  /** Défini sur le formulaire d'ajout ; absent sur la liste emploi (texte combiné). */
  jobMode?: JobProfileMode;
}) {
  const t = useT();

  let titleKey = TITLE_KEY[profileType];
  let bodyKey = BODY_KEY[profileType];
  if (profileType === "job_search") {
    if (jobMode === "recruitment") {
      titleKey = "dashboard.sites.addTabs.helpJobRecruitTitle";
      bodyKey = "dashboard.sites.addTabs.helpJobRecruitBody";
    } else if (jobMode === "candidate") {
      titleKey = "dashboard.sites.addTabs.helpJobCandidateTitle";
      bodyKey = "dashboard.sites.addTabs.helpJobCandidateBody";
    } else {
      titleKey = "dashboard.sites.addTabs.helpJobOverviewTitle";
      bodyKey = "dashboard.sites.addTabs.helpJobOverviewBody";
    }
  }

  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-3 sm:p-4">
      <p className="text-sm font-semibold text-brand-900">{t(titleKey)}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t(bodyKey)}</p>
    </div>
  );
}
