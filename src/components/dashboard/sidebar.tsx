"use client";

import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/context";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/dashboard", key: "overview", exact: true },
  { href: "/dashboard/conversations", key: "conversations" },
  { href: "/dashboard/leads", key: "leads" },
  { href: "/dashboard/advisors", key: "advisors" },
  { href: "/dashboard/sites", key: "sites" },
  { href: "/dashboard/links", key: "trackedLinks" },
  { href: "/dashboard/settings", key: "settings" },
] as const;

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

function NavLink({
  item,
  t,
  onNavigate,
  className,
}: {
  item: (typeof NAV)[number];
  t: ReturnType<typeof useT>;
  onNavigate?: () => void;
  className: string;
}) {
  return (
    <Link href={item.href} onClick={onNavigate} className={className}>
      {t(`dashboard.nav.${item.key}`)}
    </Link>
  );
}

export function DashboardHeader({ email }: { email?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
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

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const mobileLinkClass = (active: boolean) =>
    `block rounded-md px-3 py-2.5 text-sm font-medium ${
      active
        ? "bg-brand-50 text-brand-700"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  const desktopLinkClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-brand-50 text-brand-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="shrink-0 overflow-x-hidden border-b border-slate-200 bg-white">
      {/* Mobile / tablette */}
      <div className="lg:hidden">
        <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 px-3 py-2">
          <BrandLogo
            href="/dashboard"
            size={36}
            className="min-w-0 max-w-[calc(100%-3rem)] shrink gap-2"
            nameClassName="truncate text-sm font-bold text-brand-700"
          />
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700"
            aria-expanded={menuOpen}
            aria-controls="dashboard-mobile-nav"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>

        {menuOpen ? (
          <div
            id="dashboard-mobile-nav"
            className="border-t border-slate-100 bg-white px-3 py-3 shadow-sm"
          >
            <nav className="flex flex-col gap-0.5" aria-label={t("nav.menu")}>
              {NAV.map((item) => {
                const active = isNavActive(
                  pathname,
                  item.href,
                  "exact" in item ? item.exact : undefined
                );
                return (
                  <NavLink
                    key={item.href}
                    item={item}
                    t={t}
                    onNavigate={() => setMenuOpen(false)}
                    className={mobileLinkClass(active)}
                  />
                );
              })}
            </nav>

            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="text-xs font-medium text-slate-500">{t("languageSwitcher.label")}</span>
                <LanguageSwitcher />
              </div>
              {email ? (
                <p className="truncate px-1 text-xs text-slate-500" title={email}>
                  {email}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void logout();
                }}
                className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t("nav.logout")}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden max-w-6xl min-w-0 items-center gap-3 px-3 py-2 lg:flex">
        <BrandLogo
          href="/dashboard"
          size={36}
          nameClassName="text-sm font-bold text-brand-700"
          className="shrink-0 gap-2"
        />

        <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-1" aria-label={t("nav.menu")}>
          {NAV.map((item) => {
            const active = isNavActive(
              pathname,
              item.href,
              "exact" in item ? item.exact : undefined
            );
            return (
              <NavLink
                key={item.href}
                item={item}
                t={t}
                className={desktopLinkClass(active)}
              />
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 border-l border-slate-100 pl-3">
          <LanguageSwitcher className="text-sm" />
          {email ? (
            <span className="max-w-[10rem] truncate text-xs text-slate-500" title={email}>
              {email}
            </span>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            {t("nav.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
