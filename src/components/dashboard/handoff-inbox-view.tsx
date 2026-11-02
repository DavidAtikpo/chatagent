"use client";

import { useHandoffAlerts } from "@/components/dashboard/handoff-alert-provider";
import { DashboardPanel } from "@/components/dashboard/dashboard-tabs";
import { useT } from "@/i18n/context";
import { formatDate } from "@/lib/dashboard-data";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type HandoffInboxItem = {
  id: string;
  site_id: string;
  site_name?: string;
  handoff_status: string;
  handoff_reason?: string | null;
  handoff_requested_at?: string | null;
  lead_score: number;
  page_url?: string | null;
  updated_at: string;
  assigned_agent_id?: string | null;
};

type InboxPayload = {
  pending: HandoffInboxItem[];
  active: HandoffInboxItem[];
  pool_active: HandoffInboxItem[];
};

function handoffReasonLabel(reason: string | null | undefined, t: (k: string) => string) {
  if (!reason) return t("dashboard.inbox.reasonDefault");
  const key = `dashboard.inbox.reasons.${reason}` as const;
  const translated = t(key);
  if (translated === key) return t("dashboard.inbox.reasonDefault");
  return translated;
}

function InboxCard({ item, cta }: { item: HandoffInboxItem; cta: string }) {
  const t = useT();
  return (
    <Link
      href={`/dashboard/conversations/${item.id}`}
      className="block rounded-lg border border-slate-100 bg-slate-50/80 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-slate-900">{item.site_name ?? t("dashboard.overview.siteFallback")}</p>
        <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">
          {item.lead_score}/100
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-600">{handoffReasonLabel(item.handoff_reason, t)}</p>
      {item.page_url ? (
        <p className="mt-1 truncate text-xs text-slate-500">{item.page_url}</p>
      ) : null}
      <p className="mt-2 text-[11px] text-slate-400">
        {item.handoff_requested_at
          ? formatDate(item.handoff_requested_at)
          : formatDate(item.updated_at)}{" "}
        · {cta}
      </p>
    </Link>
  );
}

export function HandoffInboxView({ embedded = false }: { embedded?: boolean }) {
  const t = useT();
  const handoffAlerts = useHandoffAlerts();
  const [data, setData] = useState<InboxPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/inbox", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? t("dashboard.inbox.loadFailed"));
        setData({ pending: [], active: [], pool_active: [] });
        return;
      }
      setData(json as InboxPayload);
      setError(null);
    } catch {
      setError(t("dashboard.inbox.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, [load]);

  const pending = data?.pending ?? [];
  const active = data?.active ?? [];
  const pool = data?.pool_active ?? [];

  return (
    <div className="space-y-3">
      {!embedded ? (
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("dashboard.inbox.title")}</h1>
          <p className="mt-0.5 text-sm text-slate-600">{t("dashboard.inbox.subtitle")}</p>
          {handoffAlerts?.notifyPermission === "default" ? (
            <button
              type="button"
              className="mt-2 text-xs font-medium text-brand-700 hover:underline"
              onClick={() => void handoffAlerts.requestNotifications()}
            >
              {t("dashboard.inbox.enableNotify")}
            </button>
          ) : handoffAlerts?.notifyPermission === "denied" ? (
            <p className="mt-2 text-xs text-amber-800">{t("dashboard.inbox.notifyDenied")}</p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
          <p className="mt-1 text-xs text-amber-800">{t("dashboard.inbox.dbHint")}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
        <DashboardPanel
          title={t("dashboard.inbox.pendingTitle", { count: pending.length })}
          description={t("dashboard.inbox.pendingDesc")}
          className="min-w-0 flex-1"
        >
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-slate-500">{t("dashboard.inbox.pendingEmpty")}</p>
          ) : (
            <div className="space-y-2">
              {pending.map((item) => (
                <InboxCard key={item.id} item={item} cta={t("dashboard.inbox.takeConversation")} />
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title={t("dashboard.inbox.activeTitle", { count: active.length })}
          description={t("dashboard.inbox.activeDesc")}
          className="min-w-0 flex-1"
        >
          {loading ? (
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
          ) : active.length === 0 ? (
            <p className="text-sm text-slate-500">{t("dashboard.inbox.activeEmpty")}</p>
          ) : (
            <div className="space-y-2">
              {active.map((item) => (
                <InboxCard key={item.id} item={item} cta={t("dashboard.inbox.continueChat")} />
              ))}
            </div>
          )}
        </DashboardPanel>
      </div>

      {pool.length > 0 ? (
        <DashboardPanel title={t("dashboard.inbox.poolTitle")} description={t("dashboard.inbox.poolDesc")}>
          <div className="space-y-2">
            {pool.map((item) => (
              <InboxCard key={item.id} item={item} cta={t("dashboard.inbox.viewOnly")} />
            ))}
          </div>
        </DashboardPanel>
      ) : null}
    </div>
  );
}
