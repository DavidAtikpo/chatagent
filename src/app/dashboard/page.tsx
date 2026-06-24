"use client";

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
import { EmbedStatsChart } from "@/components/dashboard/embed-stats-chart";
import { useT } from "@/i18n/context";
import { useDashboardLabels } from "@/i18n/use-dashboard-labels";
import { useOrganization } from "@/hooks/use-organization";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

export default function DashboardPage() {
  const { organization, sites, siteIds, loading: orgLoading } = useOrganization();
  const t = useT();
  const { widgetClickLabel, sourceLabel, statusLabel, embedMetricLabel } = useDashboardLabels();
  const [stats, setStats] = useState({ conversations: 0, leads: 0, avgScore: 0, conversionRate: 0 });
  const [embedStats, setEmbedStats] = useState<EmbedWidgetStats>({
    opens: 0,
    conversations: 0,
    visitor_messages: 0,
    clicks: [],
  });
  const [embedSites, setEmbedSites] = useState<EmbedWidgetSiteStats[]>([]);
  const [embedDaily, setEmbedDaily] = useState<EmbedTimeseriesPoint[]>([]);
  const [embedMonthly, setEmbedMonthly] = useState<EmbedTimeseriesPoint[]>([]);
  const [embedPeriod, setEmbedPeriod] = useState<"day" | "month">("day");
  const [embedMetric, setEmbedMetric] = useState<EmbedMetricKey>("conversations");
  const [trackedLinks, setTrackedLinks] = useState<TrackedLinkInteractionStat[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStat[]>([]);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orgLoading) return;
    if (!organization) {
      setLoading(false);
      return;
    }

    async function load() {
      setStats({ conversations: 0, leads: 0, avgScore: 0, conversionRate: 0 });
      setRecentConversations([]);
      setRecentLeads([]);

      try {
        const overviewRes = await fetch("/api/dashboard/overview", { cache: "no-store" });
        const overviewData = await overviewRes.json();
        if (overviewRes.ok) {
          setStats(overviewData.stats ?? { conversations: 0, leads: 0, avgScore: 0, conversionRate: 0 });
          setRecentConversations(overviewData.recentConversations ?? []);
          setRecentLeads(overviewData.recentLeads ?? []);
        }
      } catch {
        /* stats restent à 0 */
      }

      try {
        const embedRes = await fetch("/api/dashboard/embed-stats", { cache: "no-store" });
        const embedData = await embedRes.json();
        if (embedRes.ok) {
          setEmbedStats(
            embedData.totals ?? {
              opens: 0,
              conversations: 0,
              visitor_messages: 0,
              clicks: [],
            }
          );
          setEmbedSites((embedData.sites as EmbedWidgetSiteStats[]) ?? []);
          setEmbedDaily((embedData.daily as EmbedTimeseriesPoint[]) ?? []);
          setEmbedMonthly((embedData.monthly as EmbedTimeseriesPoint[]) ?? []);
        }
      } catch {
        setEmbedStats({ opens: 0, conversations: 0, visitor_messages: 0, clicks: [] });
        setEmbedSites([]);
        setEmbedDaily([]);
        setEmbedMonthly([]);
      }

      try {
        const linksRes = await fetch("/api/traffic-links", { cache: "no-store" });
        const linksData = await linksRes.json();
        if (linksRes.ok) {
          setTrackedLinks((linksData.links as TrackedLinkInteractionStat[]) ?? []);
        }
      } catch {
        setTrackedLinks([]);
      }

      try {
        const countryRes = await fetch("/api/dashboard/country-stats", { cache: "no-store" });
        const countryData = await countryRes.json();
        if (countryRes.ok) {
          setCountryStats((countryData.stats as CountryStat[]) ?? []);
        }
      } catch {
        setCountryStats([]);
      }

      setLoading(false);
    }

    setLoading(true);
    load();
  }, [organization, siteIds, orgLoading]);

  const embedChartPoints = embedPeriod === "day" ? embedDaily : embedMonthly;
  const embedChartTotal = useMemo(
    () => embedChartPoints.reduce((sum, p) => sum + p[embedMetric], 0),
    [embedChartPoints, embedMetric]
  );

  const firstSite = sites[0];

  async function copyEmbed() {
    if (!firstSite) return;
    await navigator.clipboard.writeText(widgetScript(firstSite.widget_key));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (orgLoading || loading) {
    return <p className="text-sm text-slate-500">{t("common.loading")}</p>;
  }

  if (!organization) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h1 className="text-base font-semibold text-amber-900">
          {t("dashboard.overview.notConfiguredTitle")}
        </h1>
        <p className="mt-1 text-sm text-amber-800">{t("dashboard.overview.notConfiguredBody")}</p>
      </div>
    );
  }

  const statCards = [
    {
      key: "conversations",
      label: t("dashboard.overview.kpiConversations"),
      value: stats.conversations,
      hint: t("common.total"),
    },
    {
      key: "leads",
      label: t("dashboard.overview.kpiLeads"),
      value: stats.leads,
      hint: t("dashboard.overview.hintAllScores"),
    },
    {
      key: "avgScore",
      label: t("dashboard.overview.kpiAvgScore"),
      value: `${stats.avgScore}`,
      hint: t("dashboard.overview.hintOutOf100"),
    },
    {
      key: "conversion",
      label: t("dashboard.overview.kpiConversion"),
      value: `${stats.conversionRate}%`,
      hint: t("dashboard.overview.hintLeadsPerConv"),
    },
  ];

  const embedClickMap = new Map(embedStats.clicks.map((s) => [s.event_type, s.count]));
  const embedClickCards = WIDGET_CLICK_ORDER.map((type) => ({
    type,
    label: widgetClickLabel(type),
    count: embedClickMap.get(type) ?? 0,
  }));
  const totalEmbedClicks = embedClickCards.reduce((sum, c) => sum + c.count, 0);
  const totalCountryVisitors = countryStats.reduce((sum, c) => sum + c.count, 0);
  const maxCountryCount = countryStats[0]?.count ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("dashboard.overview.title")}</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            {organization.name} ·{" "}
            {t("dashboard.overview.plan", { plan: organization.subscription_plan ?? "starter" })}
          </p>
        </div>
        <Link
          href="/dashboard/sites"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t("dashboard.overview.manageSites")}
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.key} className="rounded-lg bg-white p-3 shadow-sm">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("dashboard.overview.recentConversations")}</h2>
            <Link href="/dashboard/conversations" className="text-xs text-brand-600 hover:underline">
              {t("dashboard.overview.seeAll")}
            </Link>
          </div>
          {recentConversations.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{t("dashboard.overview.noConversations")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {recentConversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/conversations/${c.id}`}
                    className="flex items-center justify-between py-2 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {c.sites?.name ?? t("dashboard.overview.siteFallback")}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(c.updated_at)}</p>
                    </div>
                    <div className="text-right">
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
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("dashboard.overview.recentLeads")}</h2>
            <Link href="/dashboard/leads" className="text-xs text-brand-600 hover:underline">
              {t("dashboard.overview.seeAll")}
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{t("dashboard.overview.noLeads")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">
                      {l.name ?? t("common.anonymousVisitor")}
                    </p>
                    <p className="text-xs text-slate-500">{l.email ?? "—"}</p>
                  </div>
                  <span
                    className={`text-sm font-bold ${l.score >= 60 ? "text-brand-600" : "text-slate-600"}`}
                  >
                    {l.score}/100
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">{t("dashboard.overview.embed.title")}</h2>
          <p className="text-xs text-slate-500">{t("dashboard.overview.embed.hint")}</p>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{t("dashboard.overview.embed.desc")}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md bg-brand-50 p-3 ring-1 ring-brand-100">
            <p className="text-xs text-brand-800">{t("dashboard.overview.embed.opens")}</p>
            <p className="text-2xl font-bold text-brand-900">{embedStats.opens}</p>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{t("dashboard.overview.embed.conversationsStarted")}</p>
            <p className="text-2xl font-bold text-slate-900">{embedStats.conversations}</p>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{t("dashboard.overview.embed.visitorMessages")}</p>
            <p className="text-2xl font-bold text-slate-900">{embedStats.visitor_messages}</p>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{t("dashboard.overview.embed.clicks")}</p>
            <p className="text-2xl font-bold text-slate-900">{totalEmbedClicks}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap gap-1">
            {EMBED_METRIC_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setEmbedMetric(key)}
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
              onClick={() => setEmbedPeriod("day")}
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
              onClick={() => setEmbedPeriod("month")}
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
          points={embedChartPoints}
          metric={embedMetric}
          metricLabel={`${embedMetricLabel(embedMetric)} — ${embedPeriod === "day" ? t("dashboard.overview.embed.perDay") : t("dashboard.overview.embed.perMonth")}`}
        />
        {embedClickCards.some((c) => c.count > 0) && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {embedClickCards
              .filter((c) => c.count > 0)
              .map((c) => (
                <div key={c.type} className="rounded-md bg-slate-50 p-2.5">
                  <p className="text-xs text-slate-500">{c.label}</p>
                  <p className="text-xl font-bold text-slate-900">{c.count}</p>
                </div>
              ))}
          </div>
        )}
        {embedSites.length > 1 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-xs font-medium text-slate-600">{t("dashboard.overview.embed.bySite")}</p>
            <ul className="mt-2 space-y-2">
              {embedSites.map((site) => (
                <li
                  key={site.site_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">{site.site_name}</p>
                    <p className="text-xs text-slate-500">{site.site_url}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                    <span>
                      {site.opens === 1
                        ? t("dashboard.overview.embed.openCount", { count: site.opens })
                        : t("dashboard.overview.embed.openCountPlural", { count: site.opens })}
                    </span>
                    <span>
                      {site.conversations} {t("dashboard.overview.embed.convAbbr")}
                    </span>
                    <span>
                      {site.visitor_messages} {t("dashboard.overview.embed.msgAbbr")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {embedStats.opens === 0 &&
          embedStats.conversations === 0 &&
          totalEmbedClicks === 0 && (
            <p className="mt-3 text-sm text-slate-500">{t("dashboard.overview.embed.noActivity")}</p>
          )}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">{t("dashboard.overview.trackedLinks.title")}</h2>
          <Link href="/dashboard/links" className="text-xs text-brand-600 hover:underline">
            {t("dashboard.overview.trackedLinks.manage")}
          </Link>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{t("dashboard.overview.trackedLinks.desc")}</p>
        {trackedLinks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("dashboard.overview.trackedLinks.empty")}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {trackedLinks.map((link) => (
              <div key={link.id} className="rounded-md bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      {sourceLabel(link.source)} · {link.label ?? link.slug}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      /c/{link.slug}
                      {link.site_name ? ` · ${link.site_name}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-bold text-slate-900">
                      {link.click_count === 1
                        ? t("dashboard.overview.trackedLinks.visit", { count: link.click_count })
                        : t("dashboard.overview.trackedLinks.visitPlural", { count: link.click_count })}
                    </p>
                    <p className="text-brand-600">
                      {link.interaction_total === 1
                        ? t("dashboard.overview.trackedLinks.interaction", {
                            count: link.interaction_total,
                          })
                        : t("dashboard.overview.trackedLinks.interactionPlural", {
                            count: link.interaction_total,
                          })}
                    </p>
                  </div>
                </div>
                {link.interaction_events.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
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
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">{t("dashboard.overview.country.title")}</h2>
          {totalCountryVisitors > 0 && (
            <p className="text-xs text-slate-500">
              {totalCountryVisitors === 1
                ? t("dashboard.overview.country.visitor", { count: totalCountryVisitors })
                : t("dashboard.overview.country.visitorPlural", { count: totalCountryVisitors })}
            </p>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{t("dashboard.overview.country.desc")}</p>
        {countryStats.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("dashboard.overview.country.empty")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {countryStats.map((row) => (
              <li key={row.country}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{row.country}</span>
                  <span className="font-bold text-slate-900">{row.count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all"
                    style={{
                      width: `${maxCountryCount ? Math.round((row.count / maxCountryCount) * 100) : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {firstSite && (
        <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">
            {t("dashboard.overview.quickDeploy.title", { name: firstSite.name })}
          </h2>
          <p className="mt-1 text-xs text-slate-600">{t("dashboard.overview.quickDeploy.hint")}</p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-green-400">
            {widgetScript(firstSite.widget_key)}
          </pre>
          <button
            onClick={copyEmbed}
            className="mt-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {copied ? t("common.copied") : t("dashboard.overview.copyScript")}
          </button>
        </div>
      )}
    </div>
  );
}
