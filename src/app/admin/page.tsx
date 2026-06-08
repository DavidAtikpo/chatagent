"use client";

import { planLabel, type PlatformOrganization, type PlatformStats } from "@/lib/platform-admin";
import { formatDate } from "@/lib/dashboard-data";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentOrgs, setRecentOrgs] = useState<PlatformOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, orgsRes] = await Promise.all([
          fetch("/api/admin/stats", { cache: "no-store" }),
          fetch("/api/admin/organizations", { cache: "no-store" }),
        ]);
        const statsData = await statsRes.json();
        const orgsData = await orgsRes.json();
        if (!statsRes.ok) throw new Error(statsData.error ?? "Erreur stats");
        if (!orgsRes.ok) throw new Error(orgsData.error ?? "Erreur clients");
        setStats(statsData.stats);
        setRecentOrgs((orgsData.organizations as PlatformOrganization[]).slice(0, 8));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  if (error || !stats) {
    return <p className="text-sm text-red-600">{error ?? "Données indisponibles"}</p>;
  }

  const kpis = [
    { label: "Clients", value: stats.organizations, hint: "Organisations" },
    { label: "Sites", value: stats.sites, hint: `${stats.activeSites} actifs` },
    { label: "Conversations", value: stats.conversations, hint: "Total plateforme" },
    { label: "Leads", value: stats.leads, hint: "Total plateforme" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Administration SaaS</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Vue d&apos;ensemble de tous les clients ChatAgent
          </p>
        </div>
        <Link
          href="/admin/organizations"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Gérer les clients
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{k.value}</p>
            <p className="text-xs text-slate-400">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Répartition des plans</h2>
          {stats.plans.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucun client.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.plans.map((row) => (
                <li key={row.plan} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{planLabel(row.plan)}</span>
                  <span className="font-bold text-slate-900">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Derniers clients</h2>
            <Link href="/admin/organizations" className="text-xs text-brand-600 hover:underline">
              Voir tout
            </Link>
          </div>
          {recentOrgs.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucun client inscrit.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {recentOrgs.map((org) => (
                <li key={org.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-xs text-slate-500">{org.owner_email ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-brand-600">{planLabel(org.subscription_plan)}</p>
                    <p className="text-xs text-slate-400">{formatDate(org.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
