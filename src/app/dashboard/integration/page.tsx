"use client";

import { PlanUpgradePanel } from "@/components/dashboard/plan-upgrade-panel";
import { WidgetIntegration } from "@/components/dashboard/widget-integration";
import { DashboardPanel, StatGrid } from "@/components/dashboard/dashboard-tabs";
import { usePlanFeatures } from "@/hooks/use-plan-features";
import { useOrganization } from "@/hooks/use-organization";
import { useT } from "@/i18n/context";
import { widgetEmbedHtmlFromConfig, getWidgetEmbedConfig } from "@/lib/widget-embed";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function DashboardIntegrationPage() {
  const { sites, loading } = useOrganization();
  const { starter } = usePlanFeatures();
  const t = useT();
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);

  async function copyKey(siteId: string, key: string) {
    if (!starter) return;
    await navigator.clipboard.writeText(key);
    setCopiedKeyId(siteId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  }

  async function copyScript(widgetKey: string) {
    if (!starter) return;
    const snippet = widgetEmbedHtmlFromConfig(getWidgetEmbedConfig(widgetKey));
    await navigator.clipboard.writeText(snippet);
  }

  const stats = useMemo(() => {
    const active = sites.filter((s) => s.is_active).length;
    return { total: sites.length, active, keys: sites.length };
  }, [sites]);

  const statItems = useMemo(
    () => [
      {
        label: t("dashboard.integrationPage.title"),
        value: stats.keys,
        hint: t("dashboard.integrationPage.widgetKey"),
        highlight: true,
      },
      {
        label: t("dashboard.nav.sites"),
        value: stats.total,
      },
      {
        label: t("dashboard.sites.activate"),
        value: stats.active,
      },
    ],
    [stats, t]
  );

  const previewSites =
    sites.length > 0
      ? sites
      : [
          {
            id: "preview",
            name: t("dashboard.plans.integrationPreviewSite"),
            url: "https://votre-site.com",
            widget_key: "wk_preview_starter_plan",
            is_active: true,
          },
        ];

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="grid gap-1.5 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-md bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {t("dashboard.integrationPage.title")}
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            {t("dashboard.integrationPage.subtitle")}
          </p>
        </div>
        <Link
          href="/integration"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800 hover:bg-brand-100"
        >
          {t("dashboard.integrationPage.publicGuide")} →
        </Link>
      </div>

      <StatGrid items={statItems} />

      {!starter ? (
        <PlanUpgradePanel
          requiredPlan="starter"
          titleKey="dashboard.plans.integrationTitle"
          bodyKey="dashboard.plans.integrationBody"
        />
      ) : null}

      {sites.length === 0 && starter ? (
        <DashboardPanel title={t("dashboard.integrationPage.title")}>
          <p className="text-sm text-slate-500">{t("dashboard.integrationPage.noSites")}</p>
          <Link
            href="/dashboard/sites"
            className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            {t("dashboard.nav.sites")} →
          </Link>
        </DashboardPanel>
      ) : (
        <div className="space-y-3">
          {previewSites.map((site) => {
            const isPreview = site.id === "preview";
            const expanded = expandedSiteId === site.id;
            const displayKey = starter && !isPreview ? site.widget_key : "wk_••••••••••••••••••";
            return (
              <DashboardPanel
                key={site.id}
                title={site.name}
                description={(site.url ?? "").replace(/^https?:\/\//, "") || "—"}
                action={
                  !site.is_active && !isPreview ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {t("common.inactive")}
                    </span>
                  ) : isPreview ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                      {t("dashboard.plans.previewLabel")}
                    </span>
                  ) : undefined
                }
              >
                {site.url ? (
                  <a
                    href={isPreview ? "#" : site.url}
                    target={isPreview ? undefined : "_blank"}
                    rel="noreferrer"
                    className={`text-sm ${isPreview ? "text-slate-400 pointer-events-none" : "text-brand-600 hover:underline"}`}
                    onClick={isPreview ? (e) => e.preventDefault() : undefined}
                  >
                    {site.url}
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">—</p>
                )}

                <div className={`mt-3 flex flex-wrap items-center gap-2 ${!starter ? "opacity-90" : ""}`}>
                  <code className="max-w-full truncate rounded-md bg-slate-100 px-2 py-1.5 text-xs text-slate-800">
                    {displayKey}
                  </code>
                  <button
                    type="button"
                    disabled={!starter || isPreview}
                    onClick={() => void copyKey(site.id, site.widget_key)}
                    className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copiedKeyId === site.id
                      ? t("dashboard.integrationPage.keyCopied")
                      : t("dashboard.integrationPage.copyKey")}
                  </button>
                  <button
                    type="button"
                    disabled={!starter || isPreview}
                    onClick={() => void copyScript(site.widget_key)}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("dashboard.integrationPage.copyScript")}
                  </button>
                  <button
                    type="button"
                    disabled={!starter || isPreview}
                    onClick={() => setExpandedSiteId(expanded ? null : site.id)}
                    className="rounded-md border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {expanded
                      ? t("dashboard.integrationPage.hideGuide")
                      : t("dashboard.integrationPage.showGuide")}
                  </button>
                </div>

                {expanded && starter && !isPreview ? (
                  <WidgetIntegration widgetKey={site.widget_key} siteUrl={site.url ?? undefined} />
                ) : expanded && !starter ? (
                  <p className="mt-3 text-xs text-slate-500">{t("dashboard.plans.integrationGuideLocked")}</p>
                ) : null}
              </DashboardPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
