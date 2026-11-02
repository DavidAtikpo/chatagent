"use client";

import {
  CrawlProgress,
  fetchCrawlProgress,
  refreshFormations,
  refreshSessions,
  statusBadge,
  triggerCrawl,
} from "@/lib/dashboard-data";
import { filterSitesByProfile } from "@/lib/site-profile-filter";
import { jobProfileModeFromMeta, type SiteProfileType } from "@/lib/site-profile";
import { useOrganization } from "@/hooks/use-organization";
import { useT } from "@/i18n/context";
import { useDashboardLabels } from "@/i18n/use-dashboard-labels";
import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton";
import { ProfileTabExplainer } from "@/components/dashboard/profile-tab-explainer";
import { SiteKnowledgePanel } from "@/components/dashboard/site-knowledge-panel";
import { PlanUpgradePanel } from "@/components/dashboard/plan-upgrade-panel";
import { DashboardPanel, StatGrid } from "@/components/dashboard/dashboard-tabs";
import { usePlanFeatures } from "@/hooks/use-plan-features";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function crawlPercent(progress: CrawlProgress) {
  if (progress.phase === "embedding") {
    if (!progress.chunks_total) return 0;
    return Math.round((progress.chunks_done / progress.chunks_total) * 100);
  }
  if (!progress.pages_total) return 0;
  return Math.round((progress.pages_done / progress.pages_total) * 100);
}

function CrawlProgressBar({ progress }: { progress: CrawlProgress }) {
  const t = useT();
  const percent = crawlPercent(progress);
  const phaseLabel =
    progress.phase === "embedding"
      ? t("dashboard.sites.crawlPhaseEmbedding")
      : t("dashboard.sites.crawlPhasePages");

  return (
    <div className="mt-2 rounded-md border border-brand-100 bg-brand-50/50 p-2.5">
      <div className="flex items-center justify-between gap-2 text-xs text-slate-700">
        <span className="font-medium">{phaseLabel}</span>
        <span>{percent} %</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-500"
          style={{ width: `${Math.max(percent, 4)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-600">{progress.message}</p>
      {progress.current_url && (
        <p className="mt-1 truncate text-xs text-slate-400" title={progress.current_url}>
          {progress.current_url}
        </p>
      )}
    </div>
  );
}

type Props = {
  profileType: SiteProfileType;
  titleKey:
    | "dashboard.profiles.websites.title"
    | "dashboard.profiles.emploi.title"
    | "dashboard.profiles.autres.title";
  subtitleKey:
    | "dashboard.profiles.websites.subtitle"
    | "dashboard.profiles.emploi.subtitle"
    | "dashboard.profiles.autres.subtitle";
  emptyKey:
    | "dashboard.profiles.websites.empty"
    | "dashboard.profiles.emploi.empty"
    | "dashboard.profiles.autres.empty";
  showSessionImport?: boolean;
};

export function ProfileSitesPage({
  profileType,
  titleKey,
  subtitleKey,
  emptyKey,
  showSessionImport = false,
}: Props) {
  const { sites, refresh, loading: orgLoading } = useOrganization();
  const { proProfiles } = usePlanFeatures();
  const t = useT();
  const requiresPro = profileType !== "website";
  const { crawlErrorLabel } = useDashboardLabels();
  const filteredSites = useMemo(
    () => filterSitesByProfile(sites, profileType),
    [sites, profileType]
  );

  const [crawling, setCrawling] = useState<string | null>(null);
  const [refreshingSessions, setRefreshingSessions] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, CrawlProgress>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const stopProgressPolling = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(() => refresh({ silent: true }), 10000);
  }, [refresh, stopPolling]);

  const pollProgress = useCallback(async () => {
    const activeSites = filteredSites.filter(
      (s) => s.crawl_status === "pending" || s.crawl_status === "running"
    );
    if (activeSites.length === 0) {
      stopProgressPolling();
      return;
    }

    const next: Record<string, CrawlProgress> = {};
    await Promise.all(
      activeSites.map(async (site) => {
        const progress = await fetchCrawlProgress(site.id);
        if (progress) next[site.id] = progress;
      })
    );

    setProgressMap((prev) => ({ ...prev, ...next }));

    if (Object.values(next).some((p) => p.status === "completed" || p.status === "failed")) {
      await refresh({ silent: true });
    }
  }, [filteredSites, refresh, stopProgressPolling]);

  const startProgressPolling = useCallback(() => {
    stopProgressPolling();
    void pollProgress();
    progressRef.current = setInterval(() => {
      void pollProgress();
    }, 2000);
  }, [pollProgress, stopProgressPolling]);

  useEffect(() => {
    const active = filteredSites.some(
      (s) => s.crawl_status === "pending" || s.crawl_status === "running"
    );
    if (active) {
      startPolling();
      startProgressPolling();
    } else {
      stopPolling();
      stopProgressPolling();
    }
    return () => {
      stopPolling();
      stopProgressPolling();
    };
  }, [filteredSites, startPolling, startProgressPolling, stopPolling, stopProgressPolling]);

  async function recrawl(siteId: string) {
    setCrawling(siteId);
    setError(null);
    try {
      const crawl = await triggerCrawl(siteId);
      if (!crawl.ok) {
        setError(crawl.error ?? t("dashboard.sites.crawlFailedShort"));
        return;
      }
      await fetch(`/api/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crawl_status: "pending" }),
      });
      await refresh({ silent: true });
    } finally {
      setCrawling(null);
    }
  }

  async function importSessions(siteId: string) {
    setRefreshingSessions(siteId);
    setError(null);
    try {
      const formations = await refreshFormations(siteId);
      if (!formations.ok) {
        setError(formations.error ?? t("dashboard.sites.formationsFailed"));
        return;
      }
      const result = await refreshSessions(siteId);
      if (!result.ok) {
        setError(result.error ?? t("dashboard.sites.sessionsFailed"));
        return;
      }
      await refresh({ silent: true });
    } finally {
      setRefreshingSessions(null);
    }
  }

  async function toggleActive(siteId: string, isActive: boolean) {
    await fetch(`/api/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    await refresh();
  }

  async function deleteSite(siteId: string, siteName: string) {
    const confirmed = window.confirm(t("dashboard.sites.deleteConfirm", { name: siteName }));
    if (!confirmed) return;

    setDeleting(siteId);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("dashboard.sites.deleteFailed"));
        return;
      }
      await refresh({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.unexpectedError"));
    } finally {
      setDeleting(null);
    }
  }

  const stats = useMemo(() => {
    const active = filteredSites.filter((s) => s.is_active).length;
    return { total: filteredSites.length, active };
  }, [filteredSites]);

  const statItems = useMemo(
    () => [
      { label: t(titleKey), value: stats.total, highlight: true },
      { label: t("common.active"), value: stats.active },
    ],
    [stats, t, titleKey]
  );

  if (orgLoading && filteredSites.length === 0) {
    return <DashboardPageSkeleton />;
  }

  const proLocked = requiresPro && !proProfiles;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t(titleKey)}</h1>
          <p className="mt-0.5 text-sm text-slate-600">{t(subtitleKey)}</p>
        </div>
        <Link
          href={`/dashboard/add-profile?tab=${profileType}`}
          className="shrink-0 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t("dashboard.nav.addProfile")}
        </Link>
      </div>

      <ProfileTabExplainer profileType={profileType} />

      {proLocked ? (
        <PlanUpgradePanel
          requiredPlan="pro"
          titleKey="dashboard.plans.proProfilesTitle"
          bodyKey="dashboard.plans.proProfilesBody"
        />
      ) : null}

      <StatGrid items={statItems} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <DashboardPanel title={t(titleKey)}>
        {filteredSites.length === 0 ? (
          <p className="text-sm text-slate-500">
            {proLocked ? t("dashboard.plans.proProfilesEmptyPreview") : t(emptyKey)}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredSites.map((site) => (
              <div
                key={site.id}
                className="rounded-lg border border-slate-100 bg-slate-50/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{site.name}</h2>
                      {profileType === "job_search" ? (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800">
                          {jobProfileModeFromMeta(site.agent_config?.profile_meta) === "recruitment"
                            ? t("dashboard.sites.addTabs.jobBadgeRecruitment")
                            : t("dashboard.sites.addTabs.jobBadgeCandidate")}
                        </span>
                      ) : null}
                      {!site.is_active && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {t("common.inactive")}
                        </span>
                      )}
                    </div>
                    {site.url ? (
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-sm text-brand-600 hover:underline"
                      >
                        {site.url}
                      </a>
                    ) : profileType === "website" ? (
                      <p className="text-sm text-slate-500">{t("dashboard.sites.noWebsite")}</p>
                    ) : null}
                    {site.agent_config?.profile_subtype === "event" &&
                    site.agent_config?.profile_event_end_date ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {t("dashboard.sites.addTabs.eventEnds", {
                          date: site.agent_config.profile_event_end_date,
                        })}
                      </p>
                    ) : null}
                    {profileType === "job_search" ? (
                      <p className="mt-1 text-xs text-slate-600">
                        <Link href="/dashboard/links" className="font-medium text-brand-600 hover:underline">
                          {t("dashboard.profiles.emploi.manageLinks")}
                        </Link>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {site.url ? (
                      <>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(site.crawl_status)}`}
                        >
                          {t("dashboard.sites.crawlPrefix")} {site.crawl_status}
                        </span>
                        {showSessionImport ? (
                          <button
                            type="button"
                            onClick={() => importSessions(site.id)}
                            disabled={refreshingSessions === site.id}
                            className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                          >
                            {refreshingSessions === site.id
                              ? t("dashboard.sites.importing")
                              : t("dashboard.sites.importFormations")}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => recrawl(site.id)}
                          disabled={
                            crawling === site.id || site.crawl_status === "running"
                          }
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                        >
                          {crawling === site.id
                            ? t("dashboard.sites.recrawling")
                            : t("dashboard.sites.recrawl")}
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggleActive(site.id, site.is_active)}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      {site.is_active
                        ? t("dashboard.sites.deactivate")
                        : t("dashboard.sites.activate")}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSite(site.id, site.name)}
                      disabled={deleting === site.id}
                      className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      {deleting === site.id ? t("common.deleting") : t("common.delete")}
                    </button>
                  </div>
                </div>

                {(site.crawl_status === "pending" || site.crawl_status === "running") &&
                  site.url &&
                  (progressMap[site.id] ? (
                    <CrawlProgressBar progress={progressMap[site.id]} />
                  ) : (
                    <div className="mt-2 rounded-md border border-brand-100 bg-brand-50/50 p-2.5">
                      <p className="text-xs text-slate-500">{t("dashboard.sites.crawlConnecting")}</p>
                    </div>
                  ))}

                <SiteKnowledgePanel
                  siteId={site.id}
                  initialDescription={site.business_description}
                  hasUrl={Boolean(site.url)}
                  variant={profileType === "job_search" ? "emploi" : "default"}
                />

                {site.crawl_status === "failed" && site.url && (
                  <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-800">
                      {t("dashboard.sites.crawlFailed")}
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      {site.agent_config?.crawl_error?.message ??
                        progressMap[site.id]?.message ??
                        t("dashboard.sites.crawlFailedDefault")}
                    </p>
                    {(site.agent_config?.crawl_error?.code ?? progressMap[site.id]?.error_code) && (
                      <p className="mt-2 text-xs text-red-600">
                        {t("dashboard.sites.crawlCause")} :{" "}
                        {crawlErrorLabel(
                          site.agent_config?.crawl_error?.code ??
                            progressMap[site.id]?.error_code ??
                            "unknown"
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
