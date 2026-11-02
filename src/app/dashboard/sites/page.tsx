"use client";

import { ProfileSitesPage } from "@/components/dashboard/profile-sites-page";

export default function SitesPage() {
  return (
    <ProfileSitesPage
      profileType="website"
      titleKey="dashboard.profiles.websites.title"
      subtitleKey="dashboard.profiles.websites.subtitle"
      emptyKey="dashboard.profiles.websites.empty"
      showSessionImport
    />
  );
}
