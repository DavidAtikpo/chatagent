"use client";

import { ProfileSitesPage } from "@/components/dashboard/profile-sites-page";

export default function EmploiPage() {
  return (
    <ProfileSitesPage
      profileType="job_search"
      titleKey="dashboard.profiles.emploi.title"
      subtitleKey="dashboard.profiles.emploi.subtitle"
      emptyKey="dashboard.profiles.emploi.empty"
    />
  );
}
