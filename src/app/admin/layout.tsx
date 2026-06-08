"use client";

import { AdminSidebar } from "@/components/admin/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [email, setEmail] = useState<string>();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? undefined);

      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (res.status === 403) {
        setAllowed(false);
        return;
      }
      setAllowed(res.ok);
    }
    check();
  }, [router]);

  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-sm text-slate-400">
        Vérification des droits admin…
      </div>
    );
  }

  if (allowed === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Accès refusé</h1>
          <p className="mt-2 text-sm text-slate-600">
            Cette zone est réservée aux administrateurs de la plateforme ChatAgent.
            Ajoutez votre email dans <code className="text-xs">PLATFORM_ADMIN_EMAILS</code>{" "}
            (fichier <code className="text-xs">web/.env.local</code>).
          </p>
          <a
            href="/dashboard"
            className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Retour au dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <AdminSidebar email={email} />
      <main className="flex-1 overflow-y-auto p-4 text-slate-900 lg:p-5">{children}</main>
    </div>
  );
}
