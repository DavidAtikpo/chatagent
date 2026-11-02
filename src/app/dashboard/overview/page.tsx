"use client";

import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import {
  OverviewAudiencePanel,
  OverviewLinksPanel,
  OverviewSummaryPanel,
  OverviewWidgetPanel,
} from "@/components/dashboard/overview-panels";
import {
  type CountryStat,
  type EmbedMetricKey,
  type EmbedTimeseriesPoint,
  type EmbedWidgetSiteStats,
  type EmbedWidgetStats,
  type TrackedLinkInteractionStat,
} from "@/lib/dashboard-data";
import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton";
import { useT } from "@/i18n/context";
import { useOrganization } from "@/hooks/use-organization";
import { useEffect, useMemo, useState } from "react";

type OverviewTab = "summary" | "widget" | "links" | "audience";

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

export default function DashboardOverviewPage() {
  const { organization, siteIds, loading: orgLoading } = useOrganization();
  const t = useT();
  const [activeTab, setActiveTab] = useState<OverviewTab>("summary");
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

      const [overviewRes, embedRes, linksRes, countryRes] = await Promise.all([
        fetch("/api/dashboard/overview", { cache: "no-store" }),
        fetch("/api/dashboard/embed-stats", { cache: "no-store" }),
        fetch("/api/traffic-links", { cache: "no-store" }),
        fetch("/api/dashboard/country-stats", { cache: "no-store" }),
      ]);

      try {
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
        const linksData = await linksRes.json();
        if (linksRes.ok) {
          setTrackedLinks((linksData.links as TrackedLinkInteractionStat[]) ?? []);
        }
      } catch {
        setTrackedLinks([]);
      }

      try {
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

  const tabs = useMemo(
    () => [
      { id: "summary" as const, label: t("dashboard.overview.tabs.summary") },
      { id: "widget" as const, label: t("dashboard.overview.tabs.widget") },
      { id: "links" as const, label: t("dashboard.overview.tabs.links") },
      { id: "audience" as const, label: t("dashboard.overview.tabs.audience") },
    ],
    [t]
  );

  if (orgLoading) {
    return <DashboardPageSkeleton />;
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

  return (
    <div>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <div className="min-w-0 shrink-0">
          <h1 className="text-xl font-bold text-slate-900">{t("dashboard.overview.title")}</h1>
          <p className="mt-0.5 text-sm text-slate-600">{t("dashboard.overview.subtitle")}</p>
          <p className="mt-1 text-xs text-slate-500">
            {organization.name} ·{" "}
            {t("dashboard.overview.plan", {
              plan: organization.subscription_plan ?? "free",
            })}
          </p>
        </div>

        <DashboardTabs
          tabs={tabs}
          active={activeTab}
          onChange={setActiveTab}
          className="min-w-0 flex-1"
        />
      </div>

      <div className="mt-2" role="tabpanel">
        {loading ? (
          <DashboardPageSkeleton />
        ) : (
          <>
            {activeTab === "summary" && (
              <OverviewSummaryPanel
                stats={stats}
                recentConversations={recentConversations}
                recentLeads={recentLeads}
              />
            )}

            {activeTab === "widget" && (
              <OverviewWidgetPanel
                embedStats={embedStats}
                embedSites={embedSites}
                embedDaily={embedDaily}
                embedMonthly={embedMonthly}
                embedPeriod={embedPeriod}
                embedMetric={embedMetric}
                embedChartTotal={embedChartTotal}
                onPeriodChange={setEmbedPeriod}
                onMetricChange={setEmbedMetric}
              />
            )}

            {activeTab === "links" && <OverviewLinksPanel trackedLinks={trackedLinks} />}

            {activeTab === "audience" && <OverviewAudiencePanel countryStats={countryStats} />}
          </>
        )}
      </div>
    </div>
  );
}
