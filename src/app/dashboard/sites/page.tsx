"use client";

import { WidgetIntegration } from "@/components/dashboard/widget-integration";
import {
  CrawlProgress,
  fetchCrawlProgress,
  refreshFormations,
  refreshSessions,
  statusBadge,
  triggerCrawl,
} from "@/lib/dashboard-data";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { useCallback, useEffect, useRef, useState } from "react";

function crawlPercent(progress: CrawlProgress) {
  if (progress.phase === "embedding") {
    if (!progress.chunks_total) return 0;
    return Math.round((progress.chunks_done / progress.chunks_total) * 100);
  }
  if (!progress.pages_total) return 0;
  return Math.round((progress.pages_done / progress.pages_total) * 100);
}

function CrawlProgressBar({ progress }: { progress: CrawlProgress }) {
  const percent = crawlPercent(progress);
  const phaseLabel =
    progress.phase === "embedding" ? "Analyse sémantique (IA)" : "Lecture des pages";

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

export default function SitesPage() {
  const { organization, sites, refresh, loading: orgLoading } = useOrganization();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [crawling, setCrawling] = useState<string | null>(null);
  const [refreshingSessions, setRefreshingSessions] = useState<string | null>(null);
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
    const activeSites = sites.filter(
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

    if (Object.values(next).some((p) => p.status === "completed")) {
      await refresh({ silent: true });
    }
  }, [sites, refresh, stopProgressPolling]);

  const startProgressPolling = useCallback(() => {
    stopProgressPolling();
    void pollProgress();
    progressRef.current = setInterval(() => {
      void pollProgress();
    }, 2000);
  }, [pollProgress, stopProgressPolling]);

  useEffect(() => {
    const active = sites.some((s) => s.crawl_status === "pending" || s.crawl_status === "running");
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
  }, [sites, startPolling, startProgressPolling, stopPolling, stopProgressPolling]);

  async function addSite(e: React.FormEvent) {
    e.preventDefault();
    if (!organization || !newName || !newUrl) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organization.id,
          name: newName,
          url: newUrl,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.site?.id) {
        setError(data.error ?? "Impossible de créer le site");
        return;
      }

      const crawl = await triggerCrawl(data.site.id);
      if (!crawl.ok) {
        setError(crawl.error ?? "Crawl non lancé — vérifiez l'API (NEXT_PUBLIC_API_URL)");
      }

      setNewName("");
      setNewUrl("");
      setShowForm(false);
      await refresh({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setCreating(false);
    }
  }

  async function recrawl(siteId: string) {
    setCrawling(siteId);
    setError(null);
    try {
      const crawl = await triggerCrawl(siteId);
      if (!crawl.ok) {
        setError(crawl.error ?? "Crawl non lancé");
        return;
      }
      const supabase = createClient();
      await supabase.from("sites").update({ crawl_status: "pending" }).eq("id", siteId);
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
        setError(formations.error ?? "Indexation formations échouée");
        return;
      }
      const result = await refreshSessions(siteId);
      if (!result.ok) {
        setError(result.error ?? "Import sessions échoué");
        return;
      }
      await refresh({ silent: true });
    } finally {
      setRefreshingSessions(null);
    }
  }

  async function toggleActive(siteId: string, isActive: boolean) {
    const supabase = createClient();
    await supabase.from("sites").update({ is_active: !isActive }).eq("id", siteId);
    await refresh();
  }

  if (orgLoading) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sites</h1>
          <p className="mt-0.5 text-sm text-slate-600">Vos sites et clés widget pour l&apos;intégration.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {showForm ? "Annuler" : "+ Ajouter un site"}
        </button>
      </div>

      {error && (
        <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {showForm && (
        <form onSubmit={addSite} className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Nouveau site</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">Nom</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">URL</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://monsite.com"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="mt-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {creating ? "Création..." : "Créer et lancer le crawl"}
          </button>
        </form>
      )}

      {sites.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          Aucun site. Cliquez sur &quot;+ Ajouter un site&quot; pour commencer.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {sites.map((site) => (
            <div key={site.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{site.name}</h2>
                    {!site.is_active && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        Inactif
                      </span>
                    )}
                  </div>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-brand-600 hover:underline"
                  >
                    {site.url}
                  </a>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(site.crawl_status)}`}>
                    Crawl : {site.crawl_status}
                  </span>
                  <button
                    type="button"
                    onClick={() => importSessions(site.id)}
                    disabled={refreshingSessions === site.id}
                    className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                  >
                    {refreshingSessions === site.id ? "Import…" : "Importer formations"}
                  </button>
                  <button
                    type="button"
                    onClick={() => recrawl(site.id)}
                    disabled={crawling === site.id || site.crawl_status === "running"}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                  >
                    {crawling === site.id ? "Relance..." : "Re-crawler"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(site.id, site.is_active)}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  >
                    {site.is_active ? "Désactiver" : "Activer"}
                  </button>
                </div>
              </div>

              {(site.crawl_status === "pending" || site.crawl_status === "running") &&
                (progressMap[site.id] ? (
                  <CrawlProgressBar progress={progressMap[site.id]} />
                ) : (
                  <div className="mt-2 rounded-md border border-brand-100 bg-brand-50/50 p-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span className="font-medium">Crawl en cours…</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-400" />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Connexion à l&apos;API pour afficher la progression…
                    </p>
                  </div>
                ))}

              <WidgetIntegration widgetKey={site.widget_key} siteUrl={site.url} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
