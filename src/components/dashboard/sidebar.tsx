"use client";

import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
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

function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardHeader({ email }: { email?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-2 py-1.5 sm:px-3">
        <BrandLogo
          href="/dashboard"
          size={36}
          nameClassName="hidden text-sm font-bold text-brand-700 md:inline"
          className="shrink-0 gap-1.5"
        />

        <nav
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={t("nav.menu")}
        >
          {NAV.map((item) => {
            const active = isNavActive(pathname, item.href, "exact" in item ? item.exact : undefined);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {t(`dashboard.nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 border-l border-slate-100 pl-2">
          <LanguageSwitcher className="text-xs [&_select]:py-0.5 [&_select]:text-xs" />
          {email && (
            <span
              className="hidden max-w-[8rem] truncate text-[11px] text-slate-500 md:inline"
              title={email}
            >
              {email}
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            {t("nav.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
