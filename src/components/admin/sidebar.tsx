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
    <aside className="flex h-screen w-56 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 p-4 text-slate-100">
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
