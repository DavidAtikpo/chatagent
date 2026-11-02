"use client";

import { useOrganization } from "@/hooks/use-organization";
import {
  hasProFeatures,
  hasProProfileFeatures,
  hasStarterFeatures,
  normalizePlan,
  planDisplayLabel,
} from "@/lib/plans";
import { useMemo } from "react";

export function usePlanFeatures() {
  const { organization } = useOrganization();
  return useMemo(
    () => ({
      organization,
      plan: normalizePlan(organization?.subscription_plan),
      planLabel: planDisplayLabel(organization?.subscription_plan),
      starter: hasStarterFeatures(organization),
      proProfiles: hasProProfileFeatures(organization),
      proContacts: hasProFeatures(organization),
    }),
    [organization]
  );
}
