"use client";

import { HandoffInboxView } from "@/components/dashboard/handoff-inbox-view";
import { DashboardPanel, StatGrid } from "@/components/dashboard/dashboard-tabs";
import { ResponsiveTable } from "@/components/dashboard/responsive-table";
import { useOrganization } from "@/hooks/use-organization";
import { useT } from "@/i18n/context";
import { useDashboardLabels } from "@/i18n/use-dashboard-labels";
import { formatDate, statusBadge } from "@/lib/dashboard-data";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Conversation = {
  id: string;
  status: string;
  lead_score: number;
  page_url: string | null;
  updated_at: string;
  handoff_status?: string | null;
  sites: { name: string } | null;
};

function scoreClass(score: number) {
  if (score >= 60) return "font-bold text-brand-600";
  if (score >= 40) return "font-semibold text-slate-700";
  return "font-medium text-slate-500";
}

export default function ConversationsPage() {
  const router = useRouter();
  const { siteIds, loading: orgLoading } = useOrganization();
  const t = useT();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#handoff-inbox") {
      router.replace("/dashboard/inbox");
    }
  }, [router]);
  const { statusLabel } = useDashboardLabels();
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

  const filters = [
    { value: "all", label: t("dashboard.conversations.statusAll") },
    { value: "active", label: t("dashboard.conversations.statusActive") },
    { value: "qualified", label: t("dashboard.conversations.statusQualified") },
    { value: "closed", label: t("dashboard.conversations.statusClosed") },
  ];

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "active").length;
    const qualified = rows.filter((r) => r.status === "qualified").length;
    const avg =
      rows.length > 0
        ? Math.round(rows.reduce((sum, r) => sum + r.lead_score, 0) / rows.length)
        : 0;
    return { total: rows.length, active, qualified, avg };
  }, [rows]);

  const statItems = useMemo(
    () => [
      {
        label: t("dashboard.conversations.title"),
        value: stats.total,
        hint: t("dashboard.conversations.statusAll"),
        highlight: true,
      },
      {
        label: t("dashboard.conversations.statusActive"),
        value: stats.active,
      },
      {
        label: t("dashboard.conversations.statusQualified"),
        value: stats.qualified,
      },
      {
        label: t("dashboard.leads.score"),
        value: stats.total ? `${stats.avg}/100` : "—",
        hint: t("dashboard.overview.hintOutOf100"),
      },
    ],
    [stats, t]
  );

  const filterBar = (
    <div className="flex flex-wrap gap-1">
      {filters.map((f) => (
        <button
          key={f.value}
          type="button"
          onClick={() => setFilter(f.value)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filter === f.value
              ? "bg-brand-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
          {t("dashboard.conversations.title")}
        </h1>
        <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
          {t("dashboard.conversations.subtitleRealtime")}
        </p>
        <StatGrid items={statItems} equalCells className="mt-2 w-full" />
      </section>

      <div id="handoff-inbox">
        <HandoffInboxView embedded />
      </div>

      <DashboardPanel
        title={t("dashboard.conversations.title")}
        description={t("dashboard.conversations.subtitle")}
        action={filterBar}
      >
        {orgLoading || loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-md bg-slate-100" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">{t("dashboard.conversations.empty")}</p>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {rows.map((row) => (
                <Link
                  key={row.id}
                  href={`/dashboard/conversations/${row.id}`}
                  className="block rounded-lg border border-slate-100 bg-slate-50/80 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900">
                      {row.sites?.name ?? t("dashboard.overview.siteFallback")}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {row.handoff_status === "requested" || row.handoff_status === "active" ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900">
                          {t(`dashboard.inbox.status.${row.handoff_status}` as "dashboard.inbox.status.requested")}
                        </span>
                      ) : null}
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                    </div>
                  </div>
                  <p className={`mt-1 text-sm ${scoreClass(row.lead_score)}`}>
                    {t("dashboard.leads.score")} {row.lead_score}/100
                  </p>
                  {row.page_url ? (
                    <p className="mt-1 truncate text-xs text-slate-500">{row.page_url}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-400">
                    {t("dashboard.conversations.lastActivity")} · {formatDate(row.updated_at)}
                  </p>
                </Link>
              ))}
            </div>

            <div className="hidden md:block">
              <ResponsiveTable>
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">{t("dashboard.leads.site")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("dashboard.conversations.status")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("dashboard.leads.score")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("dashboard.conversations.page")}</th>
                      <th className="px-3 py-2.5 font-medium">
                        {t("dashboard.conversations.lastActivity")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-50 text-slate-800 transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/dashboard/conversations/${row.id}`}
                            className="font-medium text-slate-900 hover:text-brand-600"
                          >
                            {row.sites?.name ?? "—"}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(row.status)}`}
                          >
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td className={`px-3 py-2.5 ${scoreClass(row.lead_score)}`}>
                          {row.lead_score}/100
                        </td>
                        <td className="max-w-[220px] px-3 py-2.5">
                          {row.page_url ? (
                            <a
                              href={row.page_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-slate-500 hover:text-brand-600"
                              title={row.page_url}
                            >
                              {row.page_url.replace(/^https?:\/\//, "")}
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                          {formatDate(row.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ResponsiveTable>
            </div>
          </>
        )}
      </DashboardPanel>
    </div>
  );
}
