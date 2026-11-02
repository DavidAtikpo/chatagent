import { queryOne, queryRows } from "@/lib/db";

export function withTrafficLinkImageUrl<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row, image_url: (row.image_url as string | null | undefined) ?? null }));
}

export async function listTrafficLinksForSites(siteIds: string[]) {
  if (!siteIds.length) {
    return { data: [] as Record<string, unknown>[], error: null };
  }

  try {
    const rows = await queryRows(
      `SELECT tl.id, tl.slug, tl.source, tl.label, tl.image_url, tl.click_count, tl.created_at, tl.site_id,
              s.name AS site_name, s.widget_key, s.agent_config
       FROM traffic_links tl
       INNER JOIN sites s ON s.id = tl.site_id
       WHERE tl.site_id = ANY($1::uuid[])
       ORDER BY tl.created_at DESC`,
      [siteIds]
    );

    const data = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      source: row.source,
      label: row.label,
      image_url: row.image_url,
      click_count: row.click_count,
      created_at: row.created_at,
      site_id: row.site_id,
      sites: {
        name: row.site_name,
        widget_key: row.widget_key,
        agent_config: row.agent_config,
      },
    }));

    return { data: withTrafficLinkImageUrl(data), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur base de données";
    return { data: null, error: { message, code: "db_error" } };
  }
}

export type TrafficLinkPreviewRow = {
  label: string | null;
  slug: string;
  source: string;
  image_url: string | null;
};

export async function getTrafficLinkPreviewRow(siteId: string, slug: string) {
  try {
    const row = await queryOne<TrafficLinkPreviewRow>(
      `SELECT label, slug, source, image_url
       FROM traffic_links
       WHERE site_id = $1 AND slug = $2`,
      [siteId, slug]
    );
    return { data: row, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur base de données";
    return { data: null, error: { message } };
  }
}
