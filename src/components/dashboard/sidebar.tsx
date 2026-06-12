"use client";

import { BrandLogo } from "@/components/brand-logo";
import { LOGO_SIZE } from "@/lib/branding";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Vue d'ensemble", exact: true },
  { href: "/dashboard/conversations", label: "Conversations" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/advisors", label: "Conseillers" },
  { href: "/dashboard/sites", label: "Sites" },
  { href: "/dashboard/links", label: "Liens trackés" },
  { href: "/dashboard/settings", label: "Paramètres" },
];

export function DashboardSidebar({ email }: { email?: string }) {
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
    <aside className="flex h-screen w-56 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-4">
      <BrandLogo
        href="/"
        size={LOGO_SIZE.sidebar}
        nameClassName="text-base font-bold text-brand-700"
      />

      <nav className="mt-4 flex-1 space-y-0.5">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-2.5 py-1.5 text-sm font-medium ${
              isActive(item.href, item.exact)
                ? "bg-brand-50 text-brand-700"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-100 pt-3">
        {email && <p className="truncate text-xs text-slate-500">{email}</p>}
        <button
          onClick={logout}
          className="mt-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
