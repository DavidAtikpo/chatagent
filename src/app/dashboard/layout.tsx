"use client";

import { HandoffAlertProvider } from "@/components/dashboard/handoff-alert-provider";
import { DashboardNavigationProvider } from "@/components/dashboard/navigation-progress";
import {
  DASHBOARD_SIDEBAR_STORAGE_KEY,
  DashboardDesktopHeader,
  DashboardMobileHeader,
  DashboardSidebar,
} from "@/components/dashboard/sidebar";
import { SetupOrganizationForm } from "@/components/dashboard/setup-organization";
import { useT } from "@/i18n/context";
import { OrganizationProvider, useOrganization } from "@/hooks/use-organization";
import { useEffect, useState } from "react";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { loading, organization, refresh } = useOrganization();
  const organizationName = organization?.name?.trim() || "";
  const t = useT();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarReady, setSidebarReady] = useState(false);

  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem(DASHBOARD_SIDEBAR_STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setSidebarReady(true);
  }, []);

  useEffect(() => {
    if (!sidebarReady) return;
    try {
      localStorage.setItem(DASHBOARD_SIDEBAR_STORAGE_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed, sidebarReady]);

  function toggleSidebar() {
    setSidebarCollapsed((c) => !c);
  }

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
    <HandoffAlertProvider>
      <DashboardNavigationProvider>
      <div className="flex h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden bg-slate-50 lg:flex-row">
        <DashboardMobileHeader organizationName={organizationName} />
        <DashboardSidebar
          organizationName={organizationName}
          collapsed={sidebarCollapsed}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <DashboardDesktopHeader
            organizationName={organizationName}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
          />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 text-slate-900 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 lg:px-6 lg:py-5">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
      </DashboardNavigationProvider>
    </HandoffAlertProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      <DashboardShell>{children}</DashboardShell>
    </OrganizationProvider>
  );
}
