"use client";

import { IntegrationGuide } from "@/components/integration-guide";
import { getWidgetEmbedConfig } from "@/lib/widget-embed";

type Props = {
  widgetKey: string;
  siteUrl?: string;
};

export function WidgetIntegration({ widgetKey, siteUrl }: Props) {
  return (
    <IntegrationGuide
      config={getWidgetEmbedConfig(widgetKey)}
      siteUrl={siteUrl}
      variant="dashboard"
    />
  );
}
