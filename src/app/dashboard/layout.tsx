"use client";

import { DashboardMobileHeader, DashboardSidebar } from "@/components/dashboard/sidebar";
import { SetupOrganizationForm } from "@/components/dashboard/setup-organization";
import { OrganizationProvider, useOrganization } from "@/hooks/use-organization";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { email, loading, organization, refresh } = useOrganization();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

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
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-50 lg:flex-row">
      <DashboardMobileHeader onMenuOpen={() => setMobileNavOpen(true)} />
      <DashboardSidebar
        email={email}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-3 text-slate-900 sm:p-4 lg:p-5">
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
