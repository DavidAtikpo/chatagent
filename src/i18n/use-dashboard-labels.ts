"use client";

import type { EmbedMetricKey } from "@/lib/dashboard-data";
import { resolveMessage } from "./get-dictionary";
import { useI18n } from "./context";

function label(messages: unknown, key: string, fallback: string) {
  return resolveMessage(messages, key) ?? fallback;
}

export function useDashboardLabels() {
  const { messages } = useI18n();
  const base = "dashboard.labels";

  return {
    sourceLabel: (source: string) =>
      label(messages, `${base}.sources.${source}`, source),
    widgetClickLabel: (eventType: string) =>
      label(messages, `${base}.widgetClicks.${eventType}`, eventType),
    statusLabel: (status: string) =>
      label(messages, `${base}.statuses.${status}`, status),
    crawlErrorLabel: (code: string) =>
      label(messages, `${base}.crawlErrors.${code}`, code),
    embedMetricLabel: (key: EmbedMetricKey) =>
      label(messages, `${base}.embedMetrics.${key}`, key),
  };
}
