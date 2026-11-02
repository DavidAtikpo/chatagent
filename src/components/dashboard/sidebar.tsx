"use client";

import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/context";
import { LOGO_SIZE } from "@/lib/branding";
import { createClient } from "@/lib/supabase/client";
import { useHandoffAlerts } from "@/components/dashboard/handoff-alert-provider";
import { useDashboardNavigationProgress } from "@/components/dashboard/navigation-progress";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DASHBOARD_HOME = "/dashboard/add-profile";

const NAV = [
  { href: DASHBOARD_HOME, key: "addProfile", exact: true },
  { href: "/dashboard/overview", key: "overview" },
  { href: "/dashboard/sites", key: "sites" },
  { href: "/dashboard/emploi", key: "emploi" },
  { href: "/dashboard/autres", key: "autres" },
  { href: "/dashboard/inbox", key: "inbox", exact: true },
  { href: "/dashboard/conversations", key: "conversations" },
  { href: "/dashboard/leads", key: "leads" },
  { href: "/dashboard/advisors", key: "advisors" },
  { href: "/dashboard/integration", key: "integration" },
  { href: "/dashboard/links", key: "trackedLinks" },
  { href: "/dashboard/pricing", key: "pricing" },
  { href: "/dashboard/billing", key: "billing" },
  { href: "/dashboard/support", key: "support" },
  { href: "/dashboard/settings", key: "settings" },
] as const;

type NavKey = (typeof NAV)[number]["key"];

function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      {collapsed ? (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M9 4v16M13 10l2 2-2 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M9 4v16M11 10l-2 2 2 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

function NavIcon({ navKey, className = "h-5 w-5" }: { navKey: NavKey; className?: string }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true,
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (navKey) {
    case "addProfile":
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "emploi":
      return (
        <svg {...props}>
          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          <rect x="2" y="8" width="20" height="12" rx="2" />
        </svg>
      );
    case "autres":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="6" cy="12" r="1.5" />
          <circle cx="18" cy="12" r="1.5" />
        </svg>
      );
    case "overview":
      return (
        <svg {...props}>
          <path d="M4 19V5M4 19h16M8 17V9M12 17V7M16 17v-4" />
        </svg>
      );
    case "inbox":
      return (
        <svg {...props}>
          <path d="M4 4h16v12H4z" />
          <path d="M4 8l8 5 8-5" />
          <circle cx="18" cy="6" r="3" fill="currentColor" stroke="none" />
        </svg>
      );
    case "conversations":
      return (
        <svg {...props}>
          <path d="M7 8h10M7 12h6" />
          <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3V7a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case "leads":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
      );
    case "advisors":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "sites":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        </svg>
      );
    case "integration":
      return (
        <svg {...props}>
          <path d="M16 18 22 12 16 6" />
          <path d="M8 6 2 12l6 6" />
        </svg>
      );
    case "trackedLinks":
      return (
        <svg {...props}>
          <path d="M10 13a5 5 0 0 0 7.54.54l2.92-2.92a5 5 0 0 0-7.07-7.07l-1.3 1.3" />
          <path d="M14 11a5 5 0 0 0-7.54-.54L3.54 13.4a5 5 0 0 0 7.07 7.07l1.3-1.3" />
        </svg>
      );
    case "pricing":
      return (
        <svg {...props}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      );
    case "billing":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      );
    case "support":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 5 0c0 2-2.5 2-2.5 4" />
          <circle cx="12" cy="17" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
  }
}

function LogoutIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

function useDashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return { pathname, t, logout, router };
}

function InboxNavBadge({ count, collapsed }: { count: number; collapsed?: boolean }) {
  if (count <= 0) return null;
  if (collapsed) {
    return (
      <span
        className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
        aria-hidden
      >
        {count > 9 ? "9+" : count}
      </span>
    );
  }
  return (
    <span className="ml-auto shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function sidebarLinkClass(active: boolean, collapsed: boolean) {
  return `flex items-center rounded-lg text-sm font-medium transition-colors ${
    collapsed ? "relative justify-center px-2 py-2.5" : "gap-3 px-3 py-2"
  } ${
    active
      ? "bg-brand-50 text-brand-800 ring-1 ring-brand-100"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;
}

/** Nom d’organisation (header / sidebar) — pas d’e-mail compte. */
function AccountLabel({
  organizationName,
  className = "",
}: {
  organizationName?: string;
  className?: string;
}) {
  const name = organizationName?.trim();
  if (!name) return null;
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="truncate text-xs font-medium text-slate-700" title={name}>
        {name}
      </p>
    </div>
  );
}

export function DashboardMobileHeader({
  organizationName,
}: {
  organizationName?: string;
}) {
  const { pathname, t, logout, router } = useDashboardNav();
  const navProgress = useDashboardNavigationProgress();
  const handoffAlerts = useHandoffAlerts();
  const pendingInbox = handoffAlerts?.pendingCount ?? 0;

  useEffect(() => {
    for (const item of NAV) {
      router.prefetch(item.href);
    }
  }, [router]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onResize() {
      if (window.matchMedia("(min-width: 1024px)").matches) setMenuOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 shrink-0 overflow-x-hidden border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)] lg:hidden">
        <div className="flex h-14 min-w-0 items-center justify-between gap-2 px-3">
          <BrandLogo
            href={DASHBOARD_HOME}
            size={36}
            className="min-w-0 max-w-[55%] shrink gap-2"
            nameClassName="truncate text-sm font-bold text-brand-700"
          />
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher compact />
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700"
              aria-expanded={menuOpen}
              aria-controls="dashboard-mobile-nav"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label={t("nav.closeMenu")}
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="dashboard-mobile-nav"
            className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-50 overflow-y-auto overscroll-contain bg-white px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg lg:hidden"
          >
            <nav className="flex flex-col gap-0.5" aria-label={t("nav.menu")}>
              {NAV.map((item) => {
                const active = isNavActive(
                  pathname,
                  item.href,
                  "exact" in item ? item.exact : undefined
                );
                const label = t(`dashboard.nav.${item.key}`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    onClick={() => {
                      navProgress?.startNavigation();
                      setMenuOpen(false);
                    }}
                    className={`${sidebarLinkClass(active, false)} py-3`}
                  >
                    <NavIcon navKey={item.key} />
                    <span className="min-w-0 flex-1">{label}</span>
                    {item.key === "inbox" ? (
                      <InboxNavBadge count={pendingInbox} />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              {organizationName ? (
                <AccountLabel organizationName={organizationName} className="px-1" />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void logout();
                }}
                className="flex w-full items-center gap-3 rounded-md border border-slate-200 px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <LogoutIcon />
                {t("nav.logout")}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

/** En-tête desktop : réduction sidebar + langue. */
export function DashboardDesktopHeader({
  organizationName,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  organizationName?: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const { t } = useDashboardNav();

  return (
    <header className="hidden shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 lg:flex">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
        aria-label={
          sidebarCollapsed
            ? t("dashboard.shell.expandSidebar")
            : t("dashboard.shell.collapseSidebar")
        }
        aria-expanded={!sidebarCollapsed}
      >
        <SidebarToggleIcon collapsed={sidebarCollapsed} />
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <LanguageSwitcher />
        {organizationName ? (
          <AccountLabel
            organizationName={organizationName}
            className="max-w-[14rem] text-right"
          />
        ) : null}
      </div>
    </header>
  );
}

/** Navigation latérale (desktop). */
export function DashboardSidebar({
  organizationName,
  collapsed,
}: {
  organizationName?: string;
  collapsed: boolean;
}) {
  const { pathname, t, logout, router } = useDashboardNav();
  const navProgress = useDashboardNavigationProgress();
  const handoffAlerts = useHandoffAlerts();
  const pendingInbox = handoffAlerts?.pendingCount ?? 0;

  useEffect(() => {
    for (const item of NAV) {
      router.prefetch(item.href);
    }
  }, [router]);

  return (
    <aside
      className={`hidden h-full shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-slate-200 bg-white transition-[width] duration-200 ease-out lg:flex ${
        collapsed ? "w-[4.5rem]" : "w-60"
      }`}
    >
      <div
        className={`border-b border-slate-100 py-4 ${collapsed ? "flex justify-center px-2" : "px-4"}`}
      >
        <BrandLogo
          href={DASHBOARD_HOME}
          size={collapsed ? 36 : LOGO_SIZE.sidebar}
          showName={!collapsed}
          nameClassName="text-base font-bold text-brand-700"
          className={collapsed ? "justify-center" : undefined}
        />
      </div>

      <nav
        className={`flex-1 space-y-0.5 py-4 ${collapsed ? "px-2" : "px-3"}`}
        aria-label={t("nav.menu")}
      >
        {NAV.map((item) => {
          const active = isNavActive(
            pathname,
            item.href,
            "exact" in item ? item.exact : undefined
          );
          const label = t(`dashboard.nav.${item.key}`);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={sidebarLinkClass(active, collapsed)}
              title={collapsed ? label : undefined}
              onClick={() => navProgress?.startNavigation()}
            >
              <NavIcon navKey={item.key} />
              {!collapsed ? (
                <>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {item.key === "inbox" ? (
                    <InboxNavBadge count={pendingInbox} />
                  ) : null}
                </>
              ) : item.key === "inbox" ? (
                <InboxNavBadge count={pendingInbox} collapsed />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div
        className={`mt-auto space-y-3 border-t border-slate-100 py-4 ${collapsed ? "px-2" : "px-4"}`}
      >
        {!collapsed && organizationName ? (
          <AccountLabel organizationName={organizationName} />
        ) : null}
        <button
          type="button"
          onClick={() => void logout()}
          title={collapsed ? t("nav.logout") : undefined}
          className={`flex items-center rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 ${
            collapsed ? "mx-auto h-10 w-10 justify-center p-0" : "w-full gap-3 px-3 py-2 text-left"
          }`}
        >
          <LogoutIcon />
          {!collapsed ? t("nav.logout") : null}
        </button>
      </div>
    </aside>
  );
}

export const DASHBOARD_SIDEBAR_STORAGE_KEY = "dashboard-sidebar-collapsed";
