"use client";

import { formatDate, statusBadge } from "@/lib/dashboard-data";
import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Conversation = {
  id: string;
  status: string;
  lead_score: number;
  page_url: string | null;
  updated_at: string;
  sites: { name: string } | null;
};

export default function ConversationsPage() {
  const { siteIds, loading: orgLoading } = useOrganization();
  const [rows, setRows] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter !== "all" ? `?status=${encodeURIComponent(filter)}` : "";
      const res = await fetch(`/api/dashboard/conversations${qs}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setRows((data.conversations as Conversation[]) ?? []);
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (orgLoading) return;
    load();
  }, [orgLoading, load]);

  useEffect(() => {
    if (orgLoading || !siteIds.length) return;
    const supabase = createClient();
    const channel = supabase
      .channel("conversations-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () =>
        load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteIds, orgLoading, load]);

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Conversations</h1>
      <p className="mt-0.5 text-sm text-slate-600">Toutes les conversations en temps réel.</p>

      <div className="mt-2 flex gap-1.5">
        {[
          { value: "all", label: "Toutes" },
          { value: "active", label: "Actives" },
          { value: "qualified", label: "Qualifiées" },
          { value: "closed", label: "Fermées" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === f.value
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {orgLoading || loading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucune conversation pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">Site</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Page</th>
                <th className="px-3 py-2">Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 text-slate-800 hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/dashboard/conversations/${row.id}`} className="font-medium hover:text-brand-600">
                      {row.sites?.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-medium">{row.lead_score}/100</td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-slate-500">
                    {row.page_url ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{formatDate(row.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
