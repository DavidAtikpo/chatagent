import { queryOne } from "@/lib/db";

/** Désactive les sites « événement » dont la date de fin est dépassée. */
export async function expireEventSitesForOrganization(organizationId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `WITH updated AS (
       UPDATE sites s
       SET is_active = false
       FROM (
         SELECT id
         FROM sites
         WHERE organization_id = $1
           AND is_active = true
           AND (agent_config->>'profile_type') = 'other'
           AND (agent_config->>'profile_subtype') = 'event'
           AND COALESCE(
             NULLIF(agent_config->>'profile_event_end_date', ''),
             NULLIF(agent_config->'profile_meta'->>'eventEndDate', '')
           )::date < CURRENT_DATE
       ) expired
       WHERE s.id = expired.id
       RETURNING s.id
     )
     SELECT COUNT(*)::text AS count FROM updated`,
    [organizationId]
  );
  return row ? Number.parseInt(row.count, 10) || 0 : 0;
}
