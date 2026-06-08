"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SetupOrganizationForm } from "@/components/dashboard/setup-organization";
import { OrganizationProvider, useOrganization } from "@/hooks/use-organization";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { email, loading, organization, refresh } = useOrganization();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Chargement du dashboard...
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <SetupOrganizationForm
          onComplete={async () => {
            await refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar email={email} />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 lg:p-5">
        {children}
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
