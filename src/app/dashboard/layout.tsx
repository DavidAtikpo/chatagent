"use client";

import { DashboardHeader } from "@/components/dashboard/sidebar";
import { SetupOrganizationForm } from "@/components/dashboard/setup-organization";
import { useT } from "@/i18n/context";
import { OrganizationProvider, useOrganization } from "@/hooks/use-organization";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { email, loading, organization, refresh } = useOrganization();
  const t = useT();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        {t("dashboard.loading")}
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <SetupOrganizationForm
          onComplete={async () => {
            await refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-50">
      <DashboardHeader email={email} />
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 text-slate-900 sm:px-3">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      <DashboardShell>{children}</DashboardShell>
    </OrganizationProvider>
  );
}
