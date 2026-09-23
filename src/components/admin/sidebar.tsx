"use client";

import { BrandLogo } from "@/components/brand-logo";
import { LOGO_SIZE } from "@/lib/branding";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble", exact: true },
  { href: "/admin/organizations", label: "Clients" },
];

export function AdminMobileHeader({ email }: { email?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="shrink-0 border-b border-slate-800 bg-slate-900 lg:hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <BrandLogo
          href="/admin"
          size={32}
          className="min-w-0 gap-2"
          nameClassName="truncate text-sm font-bold text-brand-300"
        />
        <button
          type="button"
          onClick={logout}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          Déconnexion
        </button>
      </div>
      <nav
        className="flex gap-1 overflow-x-auto px-3 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Navigation admin"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium ${
              isActive(item.href, item.exact)
                ? "bg-brand-600 text-white"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/dashboard"
          className="shrink-0 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-400"
        >
          Dashboard client
        </Link>
      </nav>
      {email ? (
        <p className="truncate border-t border-slate-800 px-3 py-1.5 text-[11px] text-slate-500">
          {email}
        </p>
      ) : null}
    </header>
  );
}

export function AdminSidebar({ email }: { email?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 p-4 text-slate-100 lg:flex">
      <div>
        <BrandLogo
          href="/admin"
          size={LOGO_SIZE.sidebar}
          nameClassName="text-base font-bold text-brand-300"
        />
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400">
          Admin plateforme
        </p>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-2.5 py-1.5 text-sm font-medium ${
              isActive(item.href, item.exact)
                ? "bg-brand-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-2 border-t border-slate-800 pt-3">
        <Link
          href="/dashboard"
          className="block text-xs text-slate-400 hover:text-slate-200"
        >
          ← Mon dashboard client
        </Link>
        {email && <p className="truncate text-xs text-slate-500">{email}</p>}
        <button
          onClick={logout}
          className="text-sm font-medium text-slate-400 hover:text-white"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
