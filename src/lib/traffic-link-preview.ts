import { saasLogoUrl } from "@/lib/branding";
import { queryOne } from "@/lib/db";
import { getTrafficLinkPreviewRow } from "@/lib/traffic-links-db";
import { cache } from "react";

export type TrafficLinkPreview = {
  title: string;
  description: string;
  imageUrl: string | null;
  siteName: string;
  primaryColor: string;
};

export const getTrafficLinkPreview = cache(async function getTrafficLinkPreview(
  slug: string,
  widgetKey: string
): Promise<TrafficLinkPreview | null> {
  if (!slug || !widgetKey) return null;

  const site = await queryOne<{ id: string; name: string; agent_config: Record<string, unknown> }>(
    `SELECT id, name, agent_config FROM sites WHERE widget_key = $1`,
    [widgetKey]
  );

  if (!site) return null;

  const { data: linkRow } = await getTrafficLinkPreviewRow(site.id, slug);

  const agentConfig = site.agent_config ?? {};
  const siteName = site.name || "Assistant";
  const title = linkRow?.label || `${siteName} — Chat`;
  const publicPresentation = (agentConfig.public_presentation as string | undefined)?.trim();
  const profileType = agentConfig.profile_type as string | undefined;
  let description = `Discutez avec ${siteName}. Posez vos questions et inscrivez-vous en direct.`;
  if (profileType === "job_search" && publicPresentation) {
    description = publicPresentation.replace(/\*\*/g, "").slice(0, 280);
    if (publicPresentation.length > 280) description += "…";
  } else if (publicPresentation && publicPresentation.length > 40) {
    description = publicPresentation.replace(/\*\*/g, "").slice(0, 280);
  }

  const imageUrl =
    linkRow?.image_url ||
    (agentConfig.site_image_url as string | undefined) ||
    (agentConfig.logo_url as string | undefined) ||
    saasLogoUrl() ||
    null;

  return {
    title,
    description,
    imageUrl,
    siteName,
    primaryColor: (agentConfig.primary_color as string | undefined) || "#C9922A",
  };
});
