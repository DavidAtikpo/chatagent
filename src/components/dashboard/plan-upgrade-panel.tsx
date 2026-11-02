"use client";

import { planDisplayLabel } from "@/lib/plans";
import { useOrganization } from "@/hooks/use-organization";
import { useT } from "@/i18n/context";
import Link from "next/link";

type RequiredPlan = "starter" | "pro";

export function PlanUpgradePanel({
  requiredPlan,
  titleKey,
  bodyKey,
}: {
  requiredPlan: RequiredPlan;
  titleKey: string;
  bodyKey: string;
}) {
  const t = useT();
  const { organization } = useOrganization();
  const current = planDisplayLabel(organization?.subscription_plan);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-4 sm:px-5">
      <p className="text-sm font-semibold text-amber-950">{t(titleKey)}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-amber-900/90">{t(bodyKey)}</p>
      <p className="mt-2 text-xs text-amber-800/80">
        {t("dashboard.plans.currentPlan", { plan: current })}{" "}
        ·{" "}
        {requiredPlan === "starter"
          ? t("dashboard.plans.requiredStarter")
          : t("dashboard.plans.requiredPro")}
      </p>
      <Link
        href="/dashboard/pricing"
        className="mt-3 inline-flex rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
      >
        {t("dashboard.plans.viewPricing")}
      </Link>
    </div>
  );
}
