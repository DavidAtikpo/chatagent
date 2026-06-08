import type { SupabaseClient } from "@supabase/supabase-js";

type DbError = { message?: string; code?: string } | null;

const BRANDING_BUCKET = "branding";

export function isMissingTrafficLinkImageColumn(error: DbError): boolean {
  if (!error) return false;
  return error.code === "42703" || /image_url/i.test(error.message ?? "");
}

export function trafficLinkImageStoragePath(siteId: string, slug: string, ext: string) {
  return `${siteId}/traffic/${slug}.${ext}`;
}

export function trafficLinkImagePublicUrl(
  admin: SupabaseClient,
  siteId: string,
  slug: string,
  ext: string
) {
  const { data } = admin.storage
    .from(BRANDING_BUCKET)
    .getPublicUrl(trafficLinkImageStoragePath(siteId, slug, ext));
  return data.publicUrl;
}

async function listTrafficImageUrlsBySlug(admin: SupabaseClient, siteId: string) {
  const { data: files } = await admin.storage.from(BRANDING_BUCKET).list(`${siteId}/traffic`);
  const urls = new Map<string, string>();

  for (const file of files ?? []) {
    if (!file.name || file.name.endsWith("/")) continue;
    const slug = file.name.replace(/\.[^.]+$/, "");
    const { data } = admin.storage
      .from(BRANDING_BUCKET)
      .getPublicUrl(`${siteId}/traffic/${file.name}`);
    urls.set(slug, data.publicUrl);
  }

  return urls;
}

export async function resolveTrafficLinkImageUrl(
  admin: SupabaseClient,
  siteId: string,
  slug: string,
  storedUrl?: string | null
) {
  if (storedUrl) return storedUrl;
  const urls = await listTrafficImageUrlsBySlug(admin, siteId);
  return urls.get(slug) ?? null;
}

export function withTrafficLinkImageUrl<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row, image_url: (row.image_url as string | null | undefined) ?? null }));
}

async function enrichTrafficLinksWithStorageImages<
  T extends { site_id: string; slug: string; image_url?: string | null }
>(admin: SupabaseClient, rows: T[]) {
  const bySite = new Map<string, T[]>();

  for (const row of rows) {
    if (row.image_url) continue;
    const siteRows = bySite.get(row.site_id) ?? [];
    siteRows.push(row);
    bySite.set(row.site_id, siteRows);
  }

  const siteIds = Array.from(bySite.keys());
  for (let i = 0; i < siteIds.length; i++) {
    const siteId = siteIds[i];
    const siteRows = bySite.get(siteId)!;
    const urls = await listTrafficImageUrlsBySlug(admin, siteId);
    for (let j = 0; j < siteRows.length; j++) {
      siteRows[j].image_url = urls.get(siteRows[j].slug) ?? null;
    }
  }

  return rows;
}

const LIST_SELECT_WITH_IMAGE =
  "id, slug, source, label, image_url, click_count, created_at, site_id, sites(name, widget_key, agent_config)";
const LIST_SELECT_BASE =
  "id, slug, source, label, click_count, created_at, site_id, sites(name, widget_key, agent_config)";

export async function listTrafficLinksForSites(
  admin: SupabaseClient,
  siteIds: string[]
) {
  const withImage = await admin
    .from("traffic_links")
    .select(LIST_SELECT_WITH_IMAGE)
    .in("site_id", siteIds)
    .order("created_at", { ascending: false });

  if (!withImage.error) {
    const data = withTrafficLinkImageUrl(withImage.data ?? []);
    await enrichTrafficLinksWithStorageImages(admin, data);
    return { ...withImage, data };
  }

  if (!isMissingTrafficLinkImageColumn(withImage.error)) {
    return withImage;
  }

  const fallback = await admin
    .from("traffic_links")
    .select(LIST_SELECT_BASE)
    .in("site_id", siteIds)
    .order("created_at", { ascending: false });

  if (fallback.error) return fallback;

  const data = withTrafficLinkImageUrl(fallback.data ?? []);
  await enrichTrafficLinksWithStorageImages(admin, data);
  return { ...fallback, data };
}

export type TrafficLinkPreviewRow = {
  label: string | null;
  slug: string;
  source: string;
  image_url: string | null;
};

export async function getTrafficLinkPreviewRow(
  admin: SupabaseClient,
  siteId: string,
  slug: string
): Promise<{ data: TrafficLinkPreviewRow | null; error: DbError }> {
  const withImage = await admin
    .from("traffic_links")
    .select("label, slug, image_url, source")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .maybeSingle();

  if (!withImage.error) {
    if (!withImage.data) return { data: null, error: null };
    const image_url = await resolveTrafficLinkImageUrl(
      admin,
      siteId,
      slug,
      withImage.data.image_url as string | null | undefined
    );
    return { data: { ...withImage.data, image_url }, error: null };
  }

  if (!isMissingTrafficLinkImageColumn(withImage.error)) {
    return { data: null, error: withImage.error };
  }

  const fallback = await admin
    .from("traffic_links")
    .select("label, slug, source")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .maybeSingle();

  if (fallback.error) return { data: null, error: fallback.error };
  if (!fallback.data) return { data: null, error: null };

  const image_url = await resolveTrafficLinkImageUrl(admin, siteId, slug);
  return { data: { ...fallback.data, image_url }, error: null };
}
