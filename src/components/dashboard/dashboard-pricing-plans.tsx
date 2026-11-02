"use client";

import { BILLING_PLANS } from "@/lib/billing-config";
import { usePlanFeatures } from "@/hooks/use-plan-features";
import { useOrganization } from "@/hooks/use-organization";
import { useI18n } from "@/i18n/context";
import { normalizePlan, type SubscriptionPlan } from "@/lib/plans";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { PaidPlan } from "@/lib/billing-config";

function planKeyFromName(name: string): SubscriptionPlan {
  const n = name.toLowerCase();
  if (n === "starter" || n === "pro" || n === "agency" || n === "free") return n;
  return "free";
}

export function DashboardPricingPlans() {
  const { t, messages, ready } = useI18n();
  const { plan: currentPlan, planLabel } = usePlanFeatures();
  const { refresh } = useOrganization();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);
  const checkoutBusy = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setNotice(t("dashboard.pricing.checkoutSuccess"));
      void refresh({ silent: true });
      router.replace("/dashboard/pricing");
    } else if (checkout === "cancel") {
      setNotice(t("dashboard.pricing.checkoutCancel"));
      router.replace("/dashboard/pricing");
    }
  }, [searchParams, t, refresh, router]);

  async function choosePlan(planId: PaidPlan) {
    if (checkoutBusy.current) return;
    checkoutBusy.current = true;
    setError(null);
    setLoadingPlan(planId);
    let keepLoading = false;
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = (await res.json()) as { url?: string; updated?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? t("dashboard.pricing.checkoutFailed"));
        return;
      }
      if (data.updated) {
        setNotice(t("dashboard.pricing.planUpdated"));
        await refresh({ silent: true });
        return;
      }
      if (data.url) {
        keepLoading = true;
        window.location.assign(data.url);
        return;
      }
      setError(t("dashboard.pricing.checkoutFailed"));
    } catch {
      setError(t("dashboard.pricing.checkoutFailed"));
    } finally {
      checkoutBusy.current = false;
      if (!keepLoading) setLoadingPlan(null);
    }
  }

  if (!ready) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  const homePricing = messages.home?.pricing as
    | { popular?: string; plans?: { name: string; features: string[]; popular?: boolean }[] }
    | undefined;

  const featureByPlan = new Map(
    (homePricing?.plans ?? []).map((p) => [planKeyFromName(p.name), p.features])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("dashboard.pricing.title")}</h1>
          <p className="mt-0.5 text-sm text-slate-600">{t("dashboard.pricing.subtitle")}</p>
          <p className="mt-2 text-xs text-brand-800">
            {t("dashboard.pricing.currentPlan", { plan: planLabel })}
          </p>
        </div>
        <Link
          href="/dashboard/billing"
          className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {t("dashboard.billing.title")} →
        </Link>
      </div>

      {notice ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {BILLING_PLANS.map((item) => {
          const isCurrent = normalizePlan(currentPlan) === item.id;
          const isPopular = item.id === "pro";
          const features = featureByPlan.get(item.id) ?? [];

          return (
            <div
              key={item.id}
              className={`relative flex flex-col rounded-xl border bg-white p-4 shadow-sm ${
                isCurrent
                  ? "border-brand-400 ring-2 ring-brand-100"
                  : isPopular
                    ? "border-brand-200"
                    : "border-slate-200"
              }`}
            >
              {isPopular ? (
                <span className="absolute -top-2.5 left-3 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {homePricing?.popular ?? t("dashboard.pricing.popular")}
                </span>
              ) : null}
              {isCurrent ? (
                <span className="mb-2 inline-flex w-fit rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-800">
                  {t("dashboard.pricing.yourPlan")}
                </span>
              ) : null}
              <h2 className="text-lg font-bold capitalize text-slate-900">{item.id}</h2>
              <p className="mt-1 flex items-baseline gap-0.5">
                {item.priceUsd === 0 ? (
                  <span className="text-2xl font-bold text-slate-900">{t("dashboard.pricing.freePrice")}</span>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-slate-900">${item.priceUsd}</span>
                    <span className="text-xs text-slate-500">{t("dashboard.pricing.perMonth")}</span>
                  </>
                )}
              </p>
              <ul className="mt-3 flex-1 space-y-1.5 text-xs leading-relaxed text-slate-600">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-1.5">
                    <span className="text-brand-600" aria-hidden>
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {item.paid ? (
                <button
                  type="button"
                  disabled={isCurrent || loadingPlan === item.id}
                  aria-busy={loadingPlan === item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    void choosePlan(item.id as PaidPlan);
                  }}
                  className="mt-4 w-full rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingPlan === item.id
                    ? t("dashboard.pricing.processing")
                    : isCurrent
                      ? t("dashboard.pricing.currentButton")
                      : t("dashboard.pricing.choosePlan", { plan: item.id })}
                </button>
              ) : (
                <p className="mt-4 text-center text-[11px] text-slate-500">
                  {t("dashboard.pricing.freeHint")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
