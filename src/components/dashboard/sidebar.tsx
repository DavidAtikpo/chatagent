"use client";

import { BrandLogo } from "@/components/brand-logo";
import { LOGO_SIZE } from "@/lib/branding";
import { useT } from "@/i18n/context";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", key: "overview", exact: true },
  { href: "/dashboard/conversations", key: "conversations" },
  { href: "/dashboard/leads", key: "leads" },
  { href: "/dashboard/advisors", key: "advisors" },
  { href: "/dashboard/sites", key: "sites" },
  { href: "/dashboard/links", key: "trackedLinks" },
  { href: "/dashboard/settings", key: "settings" },
] as const;

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const t = useT();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="flex-1 space-y-0.5">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={`block rounded-md px-2.5 py-2 text-sm font-medium ${
            isActive(item.href, "exact" in item ? item.exact : undefined)
              ? "bg-brand-50 text-brand-700"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {t(`dashboard.nav.${item.key}`)}
        </Link>
      ))}
    </nav>
  );
}

function SidebarFooter({
  email,
  onLogout,
}: {
  email?: string;
  onLogout: () => void;
}) {
  const t = useT();

  return (
    <div className="border-t border-slate-100 pt-3">
      {email && <p className="truncate text-xs text-slate-500">{email}</p>}
      <button
        onClick={onLogout}
        className="mt-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        {t("nav.logout")}
      </button>
    </div>
  );
}

export function DashboardSidebar({
  email,
  mobileOpen,
  onMobileClose,
}: {
  email?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex min-h-0 flex-1 flex-col">
      <BrandLogo
        href="/"
        size={LOGO_SIZE.sidebar}
        nameClassName="text-base font-bold text-brand-700"
      />
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        <NavLinks pathname={pathname} onNavigate={onMobileClose} />
      </div>
      <SidebarFooter email={email} onLogout={logout} />
    </div>
  );

  return (
    <>
      <aside className="hidden h-screen w-56 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white p-4 lg:flex">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("nav.closeMenu")}
            className="absolute inset-0 bg-slate-900/40"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-full w-[min(18rem,85vw)] flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">{t("nav.menu")}</span>
              <button
                type="button"
                onClick={onMobileClose}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label={t("nav.closeMenu")}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

export function DashboardMobileHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  const t = useT();

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      <button
        type="button"
        onClick={onMenuOpen}
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
        aria-label={t("nav.openMenu")}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <BrandLogo href="/dashboard" size={LOGO_SIZE.sidebar} showName={false} />
      <div className="w-9" aria-hidden />
    </header>
  );
}
