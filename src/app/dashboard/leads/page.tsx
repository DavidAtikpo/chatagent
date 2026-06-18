"use client";

import { formatDate } from "@/lib/dashboard-data";
import { ResponsiveTable } from "@/components/dashboard/responsive-table";
import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Lead = {
  id: string;
  score: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  conversation_id: string | null;
  created_at: string;
  sites: { name: string } | null;
};

export default function LeadsPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0);

  const load = useCallback(async () => {
    if (!organization) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const qs = minScore > 0 ? `?minScore=${minScore}` : "";
      const res = await fetch(`/api/dashboard/leads${qs}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setRows((data.leads as Lead[]) ?? []);
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [organization, minScore]);

  useEffect(() => {
    if (orgLoading) return;
    load();
  }, [orgLoading, load]);

  useEffect(() => {
    if (orgLoading || !organization) return;
    const supabase = createClient();
    const channel = supabase
      .channel("leads-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization, orgLoading, load]);

  const qualifiedCount = rows.filter((r) => r.score >= 60).length;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Leads</h1>
      <p className="mt-0.5 text-sm text-slate-600">
        Visiteurs qualifiés par le chatbot (score, contact, pays) · {qualifiedCount} qualifié
        {qualifiedCount > 1 ? "s" : ""} (≥ 60)
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {[
          { value: 0, label: "Tous" },
          { value: 40, label: "≥ 40" },
          { value: 60, label: "≥ 60" },
          { value: 80, label: "≥ 80" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setMinScore(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              minScore === f.value
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
          <p className="p-4 text-sm text-slate-500">
            Aucun lead pour le moment. Un lead est créé quand un visiteur est bien qualifié par
            l&apos;assistant (score ≥ 60).
          </p>
        ) : (
          <ResponsiveTable>
            <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Pays</th>
                <th className="px-3 py-2">Site</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 text-slate-800 hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <span className={`font-bold ${row.score >= 60 ? "text-brand-600" : "text-slate-600"}`}>
                      {row.score}/100
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div>{row.name ?? "Visiteur anonyme"}</div>
                    <div className="text-xs text-slate-500">
                      {[row.email, row.phone].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2">{row.country ?? "—"}</td>
                  <td className="px-3 py-2">{row.sites?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-500">{formatDate(row.created_at)}</td>
                  <td className="px-3 py-2">
                    {row.conversation_id && (
                      <Link
                        href={`/dashboard/conversations/${row.conversation_id}`}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Voir conv.
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </ResponsiveTable>
        )}
      </div>
    </div>
  );
}
