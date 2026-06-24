"use client";

import { EmbedStatsChart } from "@/components/dashboard/embed-stats-chart";
import { DashboardPanel, StatGrid } from "@/components/dashboard/dashboard-tabs";
import {
  formatDate,
  statusBadge,
  WIDGET_CLICK_ORDER,
  widgetScript,
  type TrackedLinkInteractionStat,
  type CountryStat,
  type EmbedWidgetStats,
  type EmbedWidgetSiteStats,
  type EmbedTimeseriesPoint,
  type EmbedMetricKey,
} from "@/lib/dashboard-data";
import { useT } from "@/i18n/context";
import { useDashboardLabels } from "@/i18n/use-dashboard-labels";
import Link from "next/link";

const EMBED_METRIC_KEYS: EmbedMetricKey[] = ["conversations", "visitor_messages", "opens", "clicks"];

type RecentConversation = {
  id: string;
  status: string;
  lead_score: number;
  updated_at: string;
  sites: { name: string } | null;
};

type RecentLead = {
  id: string;
  score: number;
  name: string | null;
  email: string | null;
  created_at: string;
};

export function OverviewSummaryPanel({
  stats,
  recentConversations,
  recentLeads,
}: {
  stats: { conversations: number; leads: number; avgScore: number; conversionRate: number };
  recentConversations: RecentConversation[];
  recentLeads: RecentLead[];
}) {
  const t = useT();
  const { statusLabel } = useDashboardLabels();

  const statItems = [
    {
      label: t("dashboard.overview.kpiConversations"),
      value: stats.conversations,
      hint: t("common.total"),
      highlight: true,
    },
    {
      label: t("dashboard.overview.kpiLeads"),
      value: stats.leads,
      hint: t("dashboard.overview.hintAllScores"),
    },
    {
      label: t("dashboard.overview.kpiAvgScore"),
      value: `${stats.avgScore}`,
      hint: t("dashboard.overview.hintOutOf100"),
    },
    {
      label: t("dashboard.overview.kpiConversion"),
      value: `${stats.conversionRate}%`,
      hint: t("dashboard.overview.hintLeadsPerConv"),
    },
  ];

  return (
    <div className="space-y-2">
      <StatGrid items={statItems} />

      <div className="grid gap-2 lg:grid-cols-2">
        <DashboardPanel
          title={t("dashboard.overview.recentConversations")}
          action={
            <Link href="/dashboard/conversations" className="text-xs font-medium text-brand-600 hover:underline">
              {t("dashboard.overview.seeAll")}
            </Link>
          }
        >
          {recentConversations.length === 0 ? (
            <p className="text-sm text-slate-500">{t("dashboard.overview.noConversations")}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentConversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/conversations/${c.id}`}
                    className="flex items-center justify-between gap-2 py-2 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {c.sites?.name ?? t("dashboard.overview.siteFallback")}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(c.updated_at)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(c.status)}`}>
                        {statusLabel(c.status)}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">{c.lead_score}/100</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          title={t("dashboard.overview.recentLeads")}
          action={
            <Link href="/dashboard/leads" className="text-xs font-medium text-brand-600 hover:underline">
              {t("dashboard.overview.seeAll")}
            </Link>
          }
        >
          {recentLeads.length === 0 ? (
            <p className="text-sm text-slate-500">{t("dashboard.overview.noLeads")}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {l.name ?? t("common.anonymousVisitor")}
                    </p>
                    <p className="truncate text-xs text-slate-500">{l.email ?? "—"}</p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold ${l.score >= 60 ? "text-brand-600" : "text-slate-600"}`}
                  >
                    {l.score}/100
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}

export function OverviewWidgetPanel({
  embedStats,
  embedSites,
  embedDaily,
  embedMonthly,
  embedPeriod,
  embedMetric,
  embedChartTotal,
  onPeriodChange,
  onMetricChange,
}: {
  embedStats: EmbedWidgetStats;
  embedSites: EmbedWidgetSiteStats[];
  embedDaily: EmbedTimeseriesPoint[];
  embedMonthly: EmbedTimeseriesPoint[];
  embedPeriod: "day" | "month";
  embedMetric: EmbedMetricKey;
  embedChartTotal: number;
  onPeriodChange: (p: "day" | "month") => void;
  onMetricChange: (m: EmbedMetricKey) => void;
}) {
  const t = useT();
  const { widgetClickLabel, embedMetricLabel } = useDashboardLabels();

  const embedClickMap = new Map(embedStats.clicks.map((s) => [s.event_type, s.count]));
  const embedClickCards = WIDGET_CLICK_ORDER.map((type) => ({
    type,
    label: widgetClickLabel(type),
    count: embedClickMap.get(type) ?? 0,
  })).filter((c) => c.count > 0);
  const totalEmbedClicks = embedClickCards.reduce((sum, c) => sum + c.count, 0);
  const chartPoints = embedPeriod === "day" ? embedDaily : embedMonthly;

  const metricItems = [
    {
      label: t("dashboard.overview.embed.opens"),
      value: embedStats.opens,
      highlight: true,
    },
    {
      label: t("dashboard.overview.embed.conversationsStarted"),
      value: embedStats.conversations,
    },
    {
      label: t("dashboard.overview.embed.visitorMessages"),
      value: embedStats.visitor_messages,
    },
    {
      label: t("dashboard.overview.embed.clicks"),
      value: totalEmbedClicks,
    },
  ];

  const noActivity =
    embedStats.opens === 0 && embedStats.conversations === 0 && totalEmbedClicks === 0;

  return (
    <DashboardPanel
      title={t("dashboard.overview.embed.title")}
      description={t("dashboard.overview.embed.desc")}
    >
      <StatGrid items={metricItems} />

      {noActivity ? (
        <p className="mt-2 text-sm text-slate-500">{t("dashboard.overview.embed.noActivityTab")}</p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
            <div className="flex flex-wrap gap-1">
              {EMBED_METRIC_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onMetricChange(key)}
                  className={
                    embedMetric === key
                      ? "rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white"
                      : "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  }
                >
                  {embedMetricLabel(key)}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => onPeriodChange("day")}
                className={
                  embedPeriod === "day"
                    ? "rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-900 shadow-sm"
                    : "px-3 py-1 text-xs font-medium text-slate-600"
                }
              >
                {t("dashboard.overview.embed.period30Days")}
              </button>
              <button
                type="button"
                onClick={() => onPeriodChange("month")}
                className={
                  embedPeriod === "month"
                    ? "rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-900 shadow-sm"
                    : "px-3 py-1 text-xs font-medium text-slate-600"
                }
              >
                {t("dashboard.overview.embed.period12Months")}
              </button>
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {t("dashboard.overview.embed.totalPeriod")}{" "}
            <span className="font-semibold text-slate-800">{embedChartTotal}</span>{" "}
            {embedMetricLabel(embedMetric).toLowerCase()}
          </p>

          <EmbedStatsChart
            points={chartPoints}
            metric={embedMetric}
            metricLabel={`${embedMetricLabel(embedMetric)} — ${embedPeriod === "day" ? t("dashboard.overview.embed.perDay") : t("dashboard.overview.embed.perMonth")}`}
          />

          {embedClickCards.length > 0 && (
            <div className="mt-2 overflow-x-auto border-t border-slate-100 pt-2">
              <p className="mb-2 text-xs font-medium text-slate-600">
                {t("dashboard.overview.embed.clickBreakdown")}
              </p>
              <table className="w-full min-w-[280px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="pb-2 font-medium">{t("dashboard.overview.embed.clickType")}</th>
                    <th className="pb-2 text-right font-medium">{t("common.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {embedClickCards.map((c) => (
                    <tr key={c.type} className="border-b border-slate-50">
                      <td className="py-2 text-slate-800">{c.label}</td>
                      <td className="py-2 text-right font-semibold text-slate-900">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {embedSites.length > 1 && (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <p className="text-xs font-medium text-slate-600">{t("dashboard.overview.embed.bySite")}</p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                      <th className="pb-2 font-medium">{t("dashboard.overview.siteFallback")}</th>
                      <th className="pb-2 text-right font-medium">{t("dashboard.overview.embed.opens")}</th>
                      <th className="pb-2 text-right font-medium">{t("dashboard.overview.embed.convAbbr")}</th>
                      <th className="pb-2 text-right font-medium">{t("dashboard.overview.embed.msgAbbr")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {embedSites.map((site) => (
                      <tr key={site.site_id} className="border-b border-slate-50">
                        <td className="py-2">
                          <p className="font-medium text-slate-900">{site.site_name}</p>
                          <p className="text-xs text-slate-500">{site.site_url}</p>
                        </td>
                        <td className="py-2 text-right text-slate-800">{site.opens}</td>
                        <td className="py-2 text-right text-slate-800">{site.conversations}</td>
                        <td className="py-2 text-right text-slate-800">{site.visitor_messages}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardPanel>
  );
}

export function OverviewLinksPanel({ trackedLinks }: { trackedLinks: TrackedLinkInteractionStat[] }) {
  const t = useT();
  const { widgetClickLabel, sourceLabel } = useDashboardLabels();

  return (
    <DashboardPanel
      title={t("dashboard.overview.trackedLinks.title")}
      description={t("dashboard.overview.trackedLinks.desc")}
      action={
        <Link href="/dashboard/links" className="text-xs font-medium text-brand-600 hover:underline">
          {t("dashboard.overview.trackedLinks.manage")}
        </Link>
      }
    >
      {trackedLinks.length === 0 ? (
        <p className="text-sm text-slate-500">{t("dashboard.overview.trackedLinks.empty")}</p>
      ) : (
        <div className="space-y-2">
          {trackedLinks.map((link) => (
            <article key={link.id} className="rounded-md border border-slate-100 bg-slate-50/80 p-2.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {sourceLabel(link.source)} · {link.label ?? link.slug}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    /c/{link.slug}
                    {link.site_name ? ` · ${link.site_name}` : ""}
                  </p>
                </div>
                <dl className="flex shrink-0 gap-4 text-right text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">{t("dashboard.overview.trackedLinks.visitsLabel")}</dt>
                    <dd className="font-bold text-slate-900">{link.click_count}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      {t("dashboard.overview.trackedLinks.interactionsLabel")}
                    </dt>
                    <dd className="font-bold text-brand-600">{link.interaction_total}</dd>
                  </div>
                </dl>
              </div>

              {link.interaction_events.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {link.interaction_events.map((ev) => (
                    <span
                      key={ev.event_type}
                      className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
                    >
                      {widgetClickLabel(ev.event_type)} · {ev.count}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  {t("dashboard.overview.trackedLinks.noInteraction")}
                </p>
              )}

              {link.countries.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {link.countries.map((row) => (
                    <span
                      key={row.country}
                      className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-800 ring-1 ring-blue-100"
                    >
                      {row.country} · {row.count}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}

export function OverviewAudiencePanel({ countryStats }: { countryStats: CountryStat[] }) {
  const t = useT();
  const totalCountryVisitors = countryStats.reduce((sum, c) => sum + c.count, 0);
  const maxCountryCount = countryStats[0]?.count ?? 0;

  return (
    <DashboardPanel
      title={t("dashboard.overview.country.title")}
      description={t("dashboard.overview.country.desc")}
      action={
        totalCountryVisitors > 0 ? (
          <span className="text-xs text-slate-500">
            {totalCountryVisitors === 1
              ? t("dashboard.overview.country.visitor", { count: totalCountryVisitors })
              : t("dashboard.overview.country.visitorPlural", { count: totalCountryVisitors })}
          </span>
        ) : undefined
      }
    >
      {countryStats.length === 0 ? (
        <p className="text-sm text-slate-500">{t("dashboard.overview.country.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {countryStats.map((row) => {
            const pct = maxCountryCount ? Math.round((row.count / maxCountryCount) * 100) : 0;
            const share =
              totalCountryVisitors > 0
                ? Math.round((row.count / totalCountryVisitors) * 100)
                : 0;
            return (
              <li key={row.country}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{row.country}</span>
                  <span className="text-slate-600">
                    <span className="font-bold text-slate-900">{row.count}</span>
                    <span className="ml-1 text-xs text-slate-400">({share}%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}

export function OverviewDeployPanel({
  siteName,
  widgetKey,
  copied,
  onCopy,
}: {
  siteName: string;
  widgetKey: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const t = useT();

  return (
    <DashboardPanel
      title={t("dashboard.overview.quickDeploy.title", { name: siteName })}
      description={t("dashboard.overview.quickDeploy.hint")}
    >
      <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-xs leading-relaxed text-green-400">
        {widgetScript(widgetKey)}
      </pre>
      <button
        type="button"
        onClick={onCopy}
        className="mt-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        {copied ? t("common.copied") : t("dashboard.overview.copyScript")}
      </button>
    </DashboardPanel>
  );
}
