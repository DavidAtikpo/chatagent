"use client";

import {
  planLabel,
  statusBadge,
  type PlatformOrganization,
} from "@/lib/platform-admin";
import { formatDate } from "@/lib/dashboard-data";
import { useEffect, useState } from "react";

const PLANS = ["starter", "pro", "agency"];
const STATUSES = ["trialing", "active", "past_due", "canceled"];

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<PlatformOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/organizations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setOrgs(data.organizations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateOrg(
    id: string,
    patch: { subscription_plan?: string; subscription_status?: string }
  ) {
    setSaving(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Mise à jour échouée");
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                subscription_plan: data.organization.subscription_plan,
                subscription_status: data.organization.subscription_status,
              }
            : o
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Clients</h1>
      <p className="mt-0.5 text-sm text-slate-600">
        Toutes les organisations inscrites sur ChatAgent
      </p>

      {error && (
        <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Chargement…</p>
        ) : orgs.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucun client.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2">Entreprise</th>
                  <th className="px-3 py-2">Email propriétaire</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Sites</th>
                  <th className="px-3 py-2">Conv.</th>
                  <th className="px-3 py-2">Leads</th>
                  <th className="px-3 py-2">Inscrit</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">{org.name}</td>
                    <td className="px-3 py-2 text-slate-600">{org.owner_email ?? "—"}</td>
                    <td className="px-3 py-2">
                      <select
                        value={org.subscription_plan}
                        disabled={saving === org.id}
                        onChange={(e) => updateOrg(org.id, { subscription_plan: e.target.value })}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                      >
                        {PLANS.map((p) => (
                          <option key={p} value={p}>
                            {planLabel(p)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={org.subscription_status}
                        disabled={saving === org.id}
                        onChange={(e) => updateOrg(org.id, { subscription_status: e.target.value })}
                        className={`rounded border border-slate-200 px-2 py-1 text-xs ${statusBadge(org.subscription_status)}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">{org.sites_count}</td>
                    <td className="px-3 py-2 text-center">{org.conversations_count}</td>
                    <td className="px-3 py-2 text-center">{org.leads_count}</td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                      {formatDate(org.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
