"use client";

import { useOrganization } from "@/hooks/use-organization";
import { useT } from "@/i18n/context";
import { useState } from "react";

const CATEGORIES = ["general", "billing", "technical", "account"] as const;

export function DashboardSupportPage() {
  const t = useT();
  const { organization } = useOrganization();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? t("dashboard.support.sendFailed"));
        return;
      }
      setSent(true);
      setSubject("");
      setMessage("");
      setCategory("general");
    } catch {
      setError(t("dashboard.support.sendFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
          <p className="text-sm font-medium text-emerald-900">{t("dashboard.support.successTitle")}</p>
          <p className="mt-2 text-sm text-emerald-800">{t("dashboard.support.successBody")}</p>
          <button
            type="button"
            className="mt-4 text-sm font-medium text-brand-700 hover:underline"
            onClick={() => setSent(false)}
          >
            {t("dashboard.support.sendAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("dashboard.support.title")}</h1>
        <p className="mt-1 text-sm text-slate-600">{t("dashboard.support.subtitle")}</p>
        {organization?.name ? (
          <p className="mt-2 text-xs text-slate-500">
            {t("dashboard.support.orgContext", { name: organization.name })}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label htmlFor="support-category" className="block text-xs font-medium text-slate-700">
            {t("dashboard.support.category")}
          </label>
          <select
            id="support-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
          >
            {CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {t(`dashboard.support.categories.${key}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="support-subject" className="block text-xs font-medium text-slate-700">
            {t("dashboard.support.subject")}
          </label>
          <input
            id="support-subject"
            type="text"
            required
            maxLength={200}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("dashboard.support.subjectPlaceholder")}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="support-message" className="block text-xs font-medium text-slate-700">
            {t("dashboard.support.message")}
          </label>
          <textarea
            id="support-message"
            required
            minLength={10}
            maxLength={8000}
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("dashboard.support.messagePlaceholder")}
            className="mt-1 w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
          />
          <p className="mt-1 text-[11px] text-slate-400">{t("dashboard.support.replyHint")}</p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
        >
          {busy ? t("dashboard.support.sending") : t("dashboard.support.submit")}
        </button>
      </form>
    </div>
  );
}
