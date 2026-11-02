"use client";

import { formatUsd } from "@/lib/billing-config";
import { useT } from "@/i18n/context";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type InvoiceRow = {
  id: string;
  stripe_invoice_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  plan: string | null;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
  paid_at: string | null;
  created_at: string;
};

export function DashboardBillingPage() {
  const t = useT();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/invoices", { cache: "no-store" });
      const data = (await res.json()) as { invoices?: InvoiceRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? t("dashboard.billing.loadFailed"));
        return;
      }
      setInvoices(data.invoices ?? []);
    } catch {
      setError(t("dashboard.billing.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("dashboard.billing.title")}</h1>
          <p className="mt-0.5 text-sm text-slate-600">{t("dashboard.billing.subtitle")}</p>
        </div>
        <Link
          href="/dashboard/pricing"
          className="shrink-0 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
        >
          {t("dashboard.billing.changePlan")}
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      ) : invoices.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-sm text-slate-600">{t("dashboard.billing.empty")}</p>
          <Link
            href="/dashboard/pricing"
            className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            {t("dashboard.billing.changePlan")}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">{t("dashboard.billing.colDate")}</th>
                <th className="px-3 py-2">{t("dashboard.billing.colPlan")}</th>
                <th className="px-3 py-2">{t("dashboard.billing.colAmount")}</th>
                <th className="px-3 py-2">{t("dashboard.billing.colStatus")}</th>
                <th className="px-3 py-2">{t("dashboard.billing.colInvoice")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const date = inv.paid_at ?? inv.created_at;
                const pdf = inv.invoice_pdf_url ?? inv.hosted_invoice_url;
                return (
                  <tr key={inv.id} className="bg-white">
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                      {date ? new Date(date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2.5 capitalize text-slate-700">{inv.plan ?? "—"}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">
                      {formatUsd(inv.amount_cents, inv.currency)}
                    </td>
                    <td className="px-3 py-2.5 capitalize text-slate-600">{inv.status}</td>
                    <td className="px-3 py-2.5">
                      {pdf ? (
                        <a
                          href={pdf}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-brand-700 hover:underline"
                        >
                          {t("dashboard.billing.download")}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
