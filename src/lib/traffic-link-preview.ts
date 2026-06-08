import { saasLogoUrl } from "@/lib/branding";
import { createAdminClient } from "@/lib/setup-account-server";
import { getTrafficLinkPreviewRow, resolveTrafficLinkImageUrl } from "@/lib/traffic-links-db";

export type TrafficLinkPreview = {
  title: string;
  description: string;
  imageUrl: string | null;
  siteName: string;
};

export async function getTrafficLinkPreview(
  slug: string,
  widgetKey: string
): Promise<TrafficLinkPreview | null> {
  if (!slug || !widgetKey) return null;

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, name, agent_config")
    .eq("widget_key", widgetKey)
    .maybeSingle();

  if (!site) return null;

  const { data: link } = await getTrafficLinkPreviewRow(admin, site.id, slug);

  const agentConfig = (site.agent_config ?? {}) as Record<string, unknown>;
  const siteName = site.name || "Assistant";
  const title = link?.label || `${siteName} — Chat`;
  const description = `Discutez avec ${siteName}. Posez vos questions et inscrivez-vous en direct.`;

  const storedImage =
    link &&
    (await resolveTrafficLinkImageUrl(
      admin,
      site.id,
      slug,
      link.image_url
    ));

  const imageUrl =
    storedImage ||
    (agentConfig.site_image_url as string | undefined) ||
    (agentConfig.logo_url as string | undefined) ||
    saasLogoUrl() ||
    null;

  return { title, description, imageUrl, siteName };
}
