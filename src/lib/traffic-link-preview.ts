import { createAdminClient } from "@/lib/setup-account-server";

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

  const { data: link } = await admin
    .from("traffic_links")
    .select("label, slug, image_url, source")
    .eq("site_id", site.id)
    .eq("slug", slug)
    .maybeSingle();

  const agentConfig = (site.agent_config ?? {}) as Record<string, unknown>;
  const siteName = site.name || "Assistant";
  const title = link?.label || `${siteName} — Chat`;
  const description = `Discutez avec ${siteName}. Posez vos questions et inscrivez-vous en direct.`;

  const imageUrl =
    (link?.image_url as string | null) ||
    (agentConfig.site_image_url as string | undefined) ||
    (agentConfig.logo_url as string | undefined) ||
    null;

  return { title, description, imageUrl, siteName };
}
