"use client";

import {
  formatDate,
  sourceLabel,
  statusBadge,
  widgetClickLabel,
  WIDGET_CLICK_ORDER,
  widgetScript,
  type WidgetClickStat,
  type TrackedLinkInteractionStat,
  type CountryStat,
} from "@/lib/dashboard-data";
import { useOrganization } from "@/hooks/use-organization";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [stats, setStats] = useState({ conversations: 0, leads: 0, avgScore: 0, conversionRate: 0 });
  const [widgetClicks, setWidgetClicks] = useState<WidgetClickStat[]>([]);
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
        const widgetRes = await fetch("/api/dashboard/widget-stats", { cache: "no-store" });
        const widgetData = await widgetRes.json();
        if (widgetRes.ok) {
          setWidgetClicks((widgetData.stats as WidgetClickStat[]) ?? []);
        }
      } catch {
        setWidgetClicks([]);
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

  const firstSite = sites[0];

  async function copyEmbed() {
    if (!firstSite) return;
    await navigator.clipboard.writeText(widgetScript(firstSite.widget_key));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (orgLoading || loading) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  if (!organization) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h1 className="text-base font-semibold text-amber-900">Compte non configuré</h1>
        <p className="mt-1 text-sm text-amber-800">
          Votre organisation n&apos;a pas encore été créée. Contactez le support ou réinscrivez-vous.
        </p>
      </div>
    );
  }

  const statCards = [
    { label: "Conversations", value: stats.conversations, hint: "Total" },
    { label: "Leads qualifiés", value: stats.leads, hint: "Tous scores" },
    { label: "Score moyen", value: `${stats.avgScore}`, hint: "Sur 100" },
    { label: "Taux conversion", value: `${stats.conversionRate}%`, hint: "Leads / conv." },
  ];

  const widgetClickMap = new Map(widgetClicks.map((s) => [s.event_type, s.count]));
  const widgetClickCards = WIDGET_CLICK_ORDER.map((type) => ({
    type,
    label: widgetClickLabel(type),
    count: widgetClickMap.get(type) ?? 0,
  }));
  const totalWidgetClicks = widgetClickCards.reduce((sum, c) => sum + c.count, 0);
  const totalCountryVisitors = countryStats.reduce((sum, c) => sum + c.count, 0);
  const maxCountryCount = countryStats[0]?.count ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vue d&apos;ensemble</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            {organization.name} · Plan {organization.subscription_plan ?? "starter"}
          </p>
        </div>
        <Link
          href="/dashboard/sites"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Gérer les sites
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white p-3 shadow-sm">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Conversations récentes</h2>
            <Link href="/dashboard/conversations" className="text-xs text-brand-600 hover:underline">
              Voir tout
            </Link>
          </div>
          {recentConversations.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucune conversation pour le moment.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {recentConversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/conversations/${c.id}`}
                    className="flex items-center justify-between py-2 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.sites?.name ?? "Site"}</p>
                      <p className="text-xs text-slate-500">{formatDate(c.updated_at)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(c.status)}`}>
                        {c.status}
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
            <h2 className="text-sm font-semibold">Leads récents</h2>
            <Link href="/dashboard/leads" className="text-xs text-brand-600 hover:underline">
              Voir tout
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucun lead pour le moment.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{l.name ?? "Visiteur anonyme"}</p>
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
          <h2 className="text-sm font-semibold">Interactions chat widget</h2>
          <p className="text-xs text-slate-500">
            {totalWidgetClicks} clic{totalWidgetClicks !== 1 ? "s" : ""} au total
          </p>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          WhatsApp, appel, email, inscription et liens proposés par l&apos;assistant.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {widgetClickCards.map((c) => (
            <div key={c.type} className="rounded-md bg-slate-50 p-2.5">
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className="text-xl font-bold text-slate-900">{c.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Performance des liens trackés</h2>
          <Link href="/dashboard/links" className="text-xs text-brand-600 hover:underline">
            Gérer les liens
          </Link>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          Pour chaque lien créé (Facebook, Instagram…), voyez qui a ouvert le chat et où ils ont
          cliqué (WhatsApp, session, inscription…).
        </p>
        {trackedLinks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Aucun lien tracké. Créez un lien Facebook ou Instagram dans{" "}
            <Link href="/dashboard/links" className="text-brand-600 hover:underline">
              Liens trackés
            </Link>{" "}
            puis partagez l&apos;URL sur vos réseaux.
          </p>
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
                      {link.click_count} visite{link.click_count !== 1 ? "s" : ""}
                    </p>
                    <p className="text-brand-600">
                      {link.interaction_total} interaction{link.interaction_total !== 1 ? "s" : ""}
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
                    Pas encore d&apos;interaction (WhatsApp, session, etc.) sur ce lien.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Répartition par pays</h2>
          {totalCountryVisitors > 0 && (
            <p className="text-xs text-slate-500">
              {totalCountryVisitors} visiteur{totalCountryVisitors !== 1 ? "s" : ""} qualifié
              {totalCountryVisitors !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          Pays indiqués par les visiteurs lors de la qualification dans le chat.
        </p>
        {countryStats.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Aucune donnée pays pour le moment. Les pays apparaissent quand l&apos;assistant qualifie
            un visiteur (question sur le pays d&apos;origine).
          </p>
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
          <h2 className="text-sm font-semibold">Déploiement rapide — {firstSite.name}</h2>
          <p className="mt-1 text-xs text-slate-600">
            Collez ce script avant la balise{" "}
            <code className="rounded bg-slate-100 px-1">&lt;/body&gt;</code> de votre site :
          </p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-green-400">
            {widgetScript(firstSite.widget_key)}
          </pre>
          <button
            onClick={copyEmbed}
            className="mt-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {copied ? "Copié !" : "Copier le script"}
          </button>
        </div>
      )}
    </div>
  );
}
