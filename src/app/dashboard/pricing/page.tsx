"use client";

import { DashboardPricingPlans } from "@/components/dashboard/dashboard-pricing-plans";
import { Suspense } from "react";

export default function DashboardPricingPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">…</p>}>
      <DashboardPricingPlans />
    </Suspense>
  );
}
