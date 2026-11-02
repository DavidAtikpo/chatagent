"use client";

import { ProfileSitesPage } from "@/components/dashboard/profile-sites-page";

export default function AutresPage() {
  return (
    <ProfileSitesPage
      profileType="other"
      titleKey="dashboard.profiles.autres.title"
      subtitleKey="dashboard.profiles.autres.subtitle"
      emptyKey="dashboard.profiles.autres.empty"
    />
  );
}
