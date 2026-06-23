import { apiUnreachableMessage } from "@/lib/app-url";
import { SupabaseClient } from "@supabase/supabase-js";

export type Organization = {
  id: string;
  name: string;
  subscription_plan?: string;
  subscription_status?: string;
};

export type Site = {
  id: string;
  name: string;
  url: string;
  widget_key: string;
  crawl_status: string;
  is_active: boolean;
  organization_id: string;
  whatsapp_number?: string | null;
  agent_config?: AgentConfig;
};

export type AgentConfig = {
  tone?: string;
  language?: string;
  welcome_message?: string;
  welcome_customized?: boolean;
  welcome_auto_generated?: boolean;
  training_sessions?: { label: string; url: string; region?: string }[];
  formation_profiles?: { key: string; label: string; url: string; summary?: string }[];
  contact_whatsapp?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  cta_url?: string | null;
  cta_label?: string;
  primary_color?: string;
  header_title_color?: string;
  header_font?: string;
  logo_url?: string | null;
  widget_click_stats?: Partial<Record<string, number>>;
  embed_widget_stats?: {
    opens?: number;
    clicks?: Partial<Record<string, number>>;
  };
  tracked_link_interactions?: Record<string, Partial<Record<string, number>>>;
  tracked_link_countries?: Record<string, Record<string, number>>;
  crawl_error?: {
    code: string;
    message: string;
    detail?: string | null;
    at?: string;
  };
};

export type DashboardStats = {
  conversations: number;
  leads: number;
  avgScore: number;
  conversionRate: number;
};

export type TrafficStat = {
  source: string;
  clicks: number;
  links: number;
};

export type WidgetClickStat = {
  event_type: string;
  count: number;
};

export type EmbedWidgetStats = {
  opens: number;
  conversations: number;
  visitor_messages: number;
  clicks: WidgetClickStat[];
};

export type EmbedWidgetSiteStats = EmbedWidgetStats & {
  site_id: string;
  site_name: string;
  site_url: string;
};

export type EmbedTimeseriesPoint = {
  period: string;
  label: string;
  opens: number;
  conversations: number;
  visitor_messages: number;
  clicks: number;
};

export type EmbedMetricKey = "conversations" | "visitor_messages" | "opens" | "clicks";

export const EMBED_METRIC_LABELS: Record<EmbedMetricKey, string> = {
  conversations: "Conversations",
  visitor_messages: "Messages visiteurs",
  opens: "Ouvertures du chat",
  clicks: "Clics (WhatsApp, session…)",
};

export type CountryStat = {
  country: string;
  count: number;
};

const COUNTRY_ALIASES: Record<string, string> = {
  tg: "Togo",
  togo: "Togo",
  fr: "France",
  france: "France",
  ga: "Gabon",
  gabon: "Gabon",
  bj: "Bénin",
  benin: "Bénin",
  gh: "Ghana",
  ghana: "Ghana",
  sn: "Sénégal",
  senegal: "Sénégal",
  ci: "Côte d'Ivoire",
  "cote d'ivoire": "Côte d'Ivoire",
  "côte d'ivoire": "Côte d'Ivoire",
  cm: "Cameroun",
  cameroun: "Cameroun",
  ml: "Mali",
  mali: "Mali",
  bf: "Burkina Faso",
  "burkina faso": "Burkina Faso",
  ne: "Niger",
  niger: "Niger",
  gn: "Guinée",
  guinee: "Guinée",
  guinée: "Guinée",
  cd: "RD Congo",
  rdc: "RD Congo",
  congo: "Congo",
  be: "Belgique",
  belgique: "Belgique",
  ch: "Suisse",
  suisse: "Suisse",
  ca: "Canada",
  canada: "Canada",
};

const NON_COUNTRY_WORDS =
  /\b(frais|inscription|formation|prix|session|cordiste|euro|fcfa|budget|disponib|expérience|experience|bonjour|merci|salut|comment|quel|quelle|combien|tarif|programme|examen|cnd|irata|visiteur|lead|score)\b/i;

const INVALID_COUNTRY_KEYS = new Set([
  "",
  "?",
  "...",
  "n/a",
  "na",
  "none",
  "null",
  "unknown",
  "inconnu",
  "inconnue",
  "not specified",
  "non specifie",
  "non renseigne",
]);

function countryKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function detectCountryFromText(text: string): string | null {
  if (!text?.trim()) return null;
  const patterns: [RegExp, string][] = [
    // Country names
    [/\btogo\b/i, "Togo"],
    [/🇹🇬/, "Togo"],
    [/\b(?:au|en|du|de la|des)\s+togo\b/i, "Togo"],
    [/\bfrance\b/i, "France"],
    [/🇫🇷/, "France"],
    [/\b(?:au|en|du|de la|des)\s+france\b/i, "France"],
    [/\bgabon\b/i, "Gabon"],
    [/\b(?:au|en|du|de la|des)\s+gabon\b/i, "Gabon"],
    [/\bb[ée]nin\b/i, "Bénin"],
    [/\bghana\b/i, "Ghana"],
    [/\bs[ée]n[ée]gal\b/i, "Sénégal"],
    [/\bc[ôo]te d.?ivoire\b/i, "Côte d'Ivoire"],
    [/\bcameroun\b/i, "Cameroun"],
    [/\bmali\b/i, "Mali"],
    [/\bburkina\b/i, "Burkina Faso"],
    [/\bniger\b/i, "Niger"],
    [/\bguin[ée]e\b/i, "Guinée"],
    [/\bbelgique\b/i, "Belgique"],
    [/\bsuisse\b/i, "Suisse"],
    [/\bcanada\b/i, "Canada"],
    [/\bcongo\b/i, "Congo"],
    // Nationalities / demonyms
    [/\btogolai[se]?\b/i, "Togo"],
    [/\bfran[cç]ai[se]?\b/i, "France"],
    [/\bgabonai[se]?\b/i, "Gabon"],
    [/\bb[eé]ninoi[se]?\b/i, "Bénin"],
    [/\bghana[ée]en\b/i, "Ghana"],
    [/\bghanaian\b/i, "Ghana"],
    [/\bs[eé]n[eé]galai[se]?\b/i, "Sénégal"],
    [/\bivoirien\b/i, "Côte d'Ivoire"],
    [/\bivoirienne\b/i, "Côte d'Ivoire"],
    [/\bcamerounai[se]?\b/i, "Cameroun"],
    [/\bmalien\b/i, "Mali"],
    [/\bmalienne\b/i, "Mali"],
    [/\bburkinab[eè]\b/i, "Burkina Faso"],
    [/\bnig[eé]rien\b/i, "Niger"],
    [/\bguin[eé]en\b/i, "Guinée"],
    [/\bbelge\b/i, "Belgique"],
    [/\bcanadien\b/i, "Canada"],
    [/\bcanadienne\b/i, "Canada"],
  ];
  for (const [re, label] of patterns) {
    if (re.test(text)) return label;
  }

  const trimmed = text.trim();
  if (trimmed.length <= 25 && trimmed.split(/\s+/).length <= 3) {
    return normalizeCountryLabel(trimmed);
  }
  return null;
}

export function isValidCountry(value: string | null | undefined): boolean {
  return normalizeCountryLabel(value ?? "") !== null;
}

export function normalizeCountryLabel(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 35) return null;
  if (trimmed.split(/\s+/).length > 4) return null;
  if (NON_COUNTRY_WORDS.test(trimmed)) return null;

  const key = countryKey(trimmed);
  if (INVALID_COUNTRY_KEYS.has(key)) return null;
  if (COUNTRY_ALIASES[key]) return COUNTRY_ALIASES[key];

  for (const label of Object.values(COUNTRY_ALIASES)) {
    if (countryKey(label) === key) return label;
  }
  return null;
}

export function aggregateCountryStats(countries: string[]): CountryStat[] {
  const map = new Map<string, CountryStat>();

  for (const raw of countries) {
    const label = normalizeCountryLabel(raw);
    if (!label) continue;
    const key = label.toLowerCase();
    const current = map.get(key);
    if (current) {
      current.count += 1;
    } else {
      map.set(key, { country: label, count: 1 });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export async function getOrganization(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, organization: null };

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, subscription_plan, subscription_status")
    .eq("owner_id", user.id)
    .maybeSingle();

  return { user, organization: organization as Organization | null };
}

export async function getSites(supabase: SupabaseClient, organizationId: string) {
  const { data } = await supabase
    .from("sites")
    .select("id, name, url, widget_key, crawl_status, is_active, organization_id, whatsapp_number, agent_config")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  return (data ?? []) as Site[];
}

export async function getDashboardStats(
  supabase: SupabaseClient,
  organizationId: string,
  siteIds: string[]
): Promise<DashboardStats> {
  if (!siteIds.length) {
    return { conversations: 0, leads: 0, avgScore: 0, conversionRate: 0 };
  }

  const { count: conversations } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .in("site_id", siteIds);

  const { data: leads } = await supabase
    .from("leads")
    .select("score")
    .eq("organization_id", organizationId);

  const scores = (leads ?? []).map((l) => l.score).filter((s) => s != null);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const leadCount = leads?.length ?? 0;
  const convCount = conversations ?? 0;
  const conversionRate = convCount ? Math.round((leadCount / convCount) * 100) : 0;

  return {
    conversations: convCount,
    leads: leadCount,
    avgScore,
    conversionRate,
  };
}

export async function getTrafficStats(supabase: SupabaseClient, siteIds: string[]): Promise<TrafficStat[]> {
  if (!siteIds.length) return [];

  const { data } = await supabase
    .from("traffic_links")
    .select("source, click_count")
    .in("site_id", siteIds);

  const map = new Map<string, { clicks: number; links: number }>();
  for (const row of data ?? []) {
    const current = map.get(row.source) ?? { clicks: 0, links: 0 };
    map.set(row.source, {
      clicks: current.clicks + (row.click_count ?? 0),
      links: current.links + 1,
    });
  }

  return Array.from(map.entries())
    .map(([source, v]) => ({ source, ...v }))
    .sort((a, b) => b.clicks - a.clicks);
}

export type CrawlProgress = {
  status: string;
  phase: "crawling" | "embedding" | "done";
  pages_done: number;
  pages_total: number;
  chunks_done: number;
  chunks_total: number;
  current_url?: string | null;
  message: string;
  error_code?: string | null;
  updated_at?: string | null;
};

export function crawlErrorLabel(code: string) {
  const labels: Record<string, string> = {
    cloudflare: "Cloudflare / anti-bot",
    anti_bot: "Anti-bot / captcha",
    robots_txt: "robots.txt",
    http_forbidden: "Accès refusé (403)",
    http_error: "Erreur HTTP",
    timeout: "Délai dépassé",
    network: "Erreur réseau",
    js_render: "JavaScript requis",
    empty_content: "Contenu vide",
    playwright_unavailable: "Playwright indisponible",
    wrong_url: "URL incorrecte",
    unknown: "Erreur inconnue",
  };
  return labels[code] ?? code;
}

export async function fetchCrawlProgress(siteId: string): Promise<CrawlProgress | null> {
  try {
    const res = await fetch(`/api/crawl/${siteId}/progress`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as CrawlProgress;
  } catch {
    return null;
  }
}

export async function refreshFormations(
  siteId: string
): Promise<{ ok: boolean; profiles?: number; error?: string }> {
  try {
    const res = await fetch(`/api/crawl/${siteId}/formations`, { method: "POST" });
    const data = (await res.json()) as { formation_profiles?: number; error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Erreur API" };
    }
    return { ok: true, profiles: data.formation_profiles };
  } catch {
    return { ok: false, error: apiUnreachableMessage() };
  }
}

export async function refreshSessions(
  siteId: string
): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const res = await fetch(`/api/crawl/${siteId}/sessions`, { method: "POST" });
    const data = (await res.json()) as { sessions_count?: number; error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Erreur API" };
    }
    return { ok: true, count: data.sessions_count };
  } catch {
    return { ok: false, error: apiUnreachableMessage() };
  }
}

export async function triggerCrawl(siteId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/crawl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? `Erreur API (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: apiUnreachableMessage() };
  }
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusBadge(status: string) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    qualified: "bg-brand-100 text-brand-700",
    handed_off: "bg-amber-100 text-amber-700",
    closed: "bg-slate-100 text-slate-600",
    pending: "bg-yellow-100 text-yellow-700",
    running: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  return colors[status] ?? "bg-slate-100 text-slate-600";
}

export function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    google_ads: "Google Ads",
    whatsapp: "WhatsApp",
    qr_code: "QR Code",
    direct_link: "Lien direct",
    widget: "Site web",
    other: "Autre",
  };
  return labels[source] ?? source;
}

export function widgetClickLabel(eventType: string) {
  const labels: Record<string, string> = {
    open: "Ouvertures du chat",
    whatsapp: "WhatsApp",
    phone: "Appel",
    email: "Email",
    signup: "S'inscrire",
    session: "Sessions (inscription)",
    link: "Liens assistant",
  };
  return labels[eventType] ?? eventType;
}

export const WIDGET_CLICK_ORDER = [
  "whatsapp",
  "phone",
  "email",
  "signup",
  "session",
  "link",
] as const;

export type TrackedLinkInteractionStat = {
  id: string;
  slug: string;
  source: string;
  label: string | null;
  image_url: string | null;
  click_count: number;
  site_name: string | null;
  widget_key?: string | null;
  created_at?: string;
  interaction_total: number;
  interaction_events: WidgetClickStat[];
  countries: CountryStat[];
};

export function parseLinkCountryStats(
  raw: Record<string, number> | null | undefined
): CountryStat[] {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw)
    .filter(([, count]) => typeof count === "number" && count > 0)
    .map(([country, count]) => ({ country, count: count as number }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}

export function parseLinkInteractionStats(
  raw: Partial<Record<string, number>> | null | undefined
): { total: number; events: WidgetClickStat[] } {
  if (!raw || typeof raw !== "object") {
    return { total: 0, events: [] };
  }

  const events: WidgetClickStat[] = WIDGET_CLICK_ORDER.map((event_type) => ({
    event_type,
    count: typeof raw[event_type] === "number" ? raw[event_type]! : 0,
  })).filter((e) => e.count > 0);

  for (const [event_type, value] of Object.entries(raw)) {
    if (event_type === "_total") continue;
    if (typeof value !== "number" || value <= 0) continue;
    if (!WIDGET_CLICK_ORDER.includes(event_type as (typeof WIDGET_CLICK_ORDER)[number])) {
      events.push({ event_type, count: value });
    }
  }

  const total =
    typeof raw._total === "number"
      ? raw._total
      : events.reduce((sum, e) => sum + e.count, 0);

  return { total, events };
}

export function buildTrackedLinkStats(
  links: {
    id: string;
    slug: string;
    source: string;
    label: string | null;
    image_url?: string | null;
    click_count: number;
    sites: { name: string; widget_key?: string; agent_config?: Record<string, unknown> | null } | { name: string; widget_key?: string; agent_config?: Record<string, unknown> | null }[] | null;
    created_at?: string;
  }[]
): TrackedLinkInteractionStat[] {
  return links.map((link) => {
    const site = normalizeRelation(link.sites);
    const agentConfig = site?.agent_config as AgentConfig | null | undefined;
    const raw = agentConfig?.tracked_link_interactions?.[link.slug];
    const { total, events } = parseLinkInteractionStats(raw);
    const countries = parseLinkCountryStats(agentConfig?.tracked_link_countries?.[link.slug]);

    return {
      id: link.id,
      slug: link.slug,
      source: link.source,
      label: link.label,
      image_url: link.image_url ?? null,
      click_count: link.click_count ?? 0,
      site_name: site?.name ?? null,
      widget_key: site?.widget_key ?? null,
      created_at: link.created_at,
      interaction_total: total,
      interaction_events: events,
      countries,
    };
  });
}

export function aggregateWidgetClickStats(
  sites: { agent_config: Record<string, unknown> | null }[]
): WidgetClickStat[] {
  const counts = new Map<string, number>();

  for (const site of sites) {
    const config = site.agent_config as AgentConfig | null | undefined;
    const raw =
      config?.embed_widget_stats?.clicks ??
      config?.widget_click_stats;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    for (const [eventType, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value !== "number" || value <= 0) continue;
      counts.set(eventType, (counts.get(eventType) ?? 0) + value);
    }
  }

  const stats: WidgetClickStat[] = WIDGET_CLICK_ORDER.map((event_type) => ({
    event_type,
    count: counts.get(event_type) ?? 0,
  }));

  counts.forEach((count, event_type) => {
    if (!WIDGET_CLICK_ORDER.includes(event_type as (typeof WIDGET_CLICK_ORDER)[number])) {
      stats.push({ event_type, count });
    }
  });

  return stats;
}

function parseEmbedClickStats(
  config: AgentConfig | null | undefined
): WidgetClickStat[] {
  const raw = config?.embed_widget_stats?.clicks ?? config?.widget_click_stats;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return WIDGET_CLICK_ORDER.map((event_type) => ({ event_type, count: 0 }));
  }
  return WIDGET_CLICK_ORDER.map((event_type) => ({
    event_type,
    count: typeof raw[event_type] === "number" ? raw[event_type]! : 0,
  })).filter((e) => e.count > 0);
}

function embedOpensFromConfig(config: AgentConfig | null | undefined): number {
  const opens = config?.embed_widget_stats?.opens;
  return typeof opens === "number" ? opens : 0;
}

export async function fetchEmbedWidgetStats(
  admin: SupabaseClient,
  siteIds: string[]
): Promise<{ totals: EmbedWidgetStats; sites: EmbedWidgetSiteStats[] }> {
  const empty: EmbedWidgetStats = {
    opens: 0,
    conversations: 0,
    visitor_messages: 0,
    clicks: [],
  };

  if (!siteIds.length) {
    return { totals: empty, sites: [] };
  }

  const { data: siteRows } = await admin
    .from("sites")
    .select("id, name, url, agent_config")
    .in("id", siteIds);

  const { data: convRows } = await admin
    .from("conversations")
    .select("id, site_id")
    .in("site_id", siteIds)
    .is("traffic_link_id", null);

  const convs = convRows ?? [];
  const convIds = convs.map((c) => c.id);

  let visitorMessages = 0;
  if (convIds.length) {
    const { count } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .eq("role", "user");
    visitorMessages = count ?? 0;
  }

  const convsBySite = new Map<string, string[]>();
  for (const conv of convs) {
    const list = convsBySite.get(conv.site_id) ?? [];
    list.push(conv.id);
    convsBySite.set(conv.site_id, list);
  }

  const sites: EmbedWidgetSiteStats[] = [];
  let totalOpens = 0;
  let totalConversations = 0;
  const clickTotals = new Map<string, number>();

  for (const site of siteRows ?? []) {
    const config = site.agent_config as AgentConfig | null | undefined;
    const opens = embedOpensFromConfig(config);
    const siteConvIds = convsBySite.get(site.id) ?? [];
    const clicks = parseEmbedClickStats(config);

    let siteMessages = 0;
    if (siteConvIds.length) {
      const { count } = await admin
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", siteConvIds)
        .eq("role", "user");
      siteMessages = count ?? 0;
    }

    totalOpens += opens;
    totalConversations += siteConvIds.length;
    for (const c of clicks) {
      clickTotals.set(c.event_type, (clickTotals.get(c.event_type) ?? 0) + c.count);
    }

    sites.push({
      site_id: site.id,
      site_name: site.name,
      site_url: site.url,
      opens,
      conversations: siteConvIds.length,
      visitor_messages: siteMessages,
      clicks,
    });
  }

  sites.sort((a, b) => b.conversations - a.conversations);

  const totals: EmbedWidgetStats = {
    opens: totalOpens,
    conversations: totalConversations,
    visitor_messages: visitorMessages,
    clicks: WIDGET_CLICK_ORDER.map((event_type) => ({
      event_type,
      count: clickTotals.get(event_type) ?? 0,
    })).filter((c) => c.count > 0),
  };

  return { totals, sites };
}

function toDayKey(iso: string): string {
  return iso.slice(0, 10);
}

function toMonthKey(iso: string): string {
  return iso.slice(0, 7);
}

function buildDayRange(days: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" });
    out.push({ key, label });
  }
  return out;
}

function buildMonthRange(months: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit", timeZone: "UTC" });
    out.push({ key, label });
  }
  return out;
}

function emptyTimeseries(
  range: { key: string; label: string }[]
): EmbedTimeseriesPoint[] {
  return range.map(({ key, label }) => ({
    period: key,
    label,
    opens: 0,
    conversations: 0,
    visitor_messages: 0,
    clicks: 0,
  }));
}

function incrementBucket(
  map: Map<string, EmbedTimeseriesPoint>,
  key: string,
  label: string,
  field: keyof Pick<
    EmbedTimeseriesPoint,
    "opens" | "conversations" | "visitor_messages" | "clicks"
  >
) {
  const row = map.get(key) ?? {
    period: key,
    label,
    opens: 0,
    conversations: 0,
    visitor_messages: 0,
    clicks: 0,
  };
  row[field] += 1;
  map.set(key, row);
}

export async function fetchEmbedWidgetTimeseries(
  admin: SupabaseClient,
  siteIds: string[]
): Promise<{ daily: EmbedTimeseriesPoint[]; monthly: EmbedTimeseriesPoint[] }> {
  const dayRange = buildDayRange(30);
  const monthRange = buildMonthRange(12);

  if (!siteIds.length) {
    return {
      daily: emptyTimeseries(dayRange),
      monthly: emptyTimeseries(monthRange),
    };
  }

  const yearAgo = new Date();
  yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1);
  const since = yearAgo.toISOString();

  const dayKeys = new Set(dayRange.map((d) => d.key));
  const monthKeys = new Set(monthRange.map((m) => m.key));
  const dayLabels = new Map(dayRange.map((d) => [d.key, d.label]));
  const monthLabels = new Map(monthRange.map((m) => [m.key, m.label]));

  const dailyMap = new Map<string, EmbedTimeseriesPoint>();
  const monthlyMap = new Map<string, EmbedTimeseriesPoint>();

  const { data: convRows } = await admin
    .from("conversations")
    .select("id, created_at")
    .in("site_id", siteIds)
    .is("traffic_link_id", null)
    .gte("created_at", since);

  const convIds: string[] = [];
  for (const row of convRows ?? []) {
    if (!row.created_at) continue;
    convIds.push(row.id);
    const day = toDayKey(row.created_at);
    const month = toMonthKey(row.created_at);
    if (dayKeys.has(day)) {
      incrementBucket(dailyMap, day, dayLabels.get(day) ?? day, "conversations");
    }
    if (monthKeys.has(month)) {
      incrementBucket(monthlyMap, month, monthLabels.get(month) ?? month, "conversations");
    }
  }

  if (convIds.length) {
    const batchSize = 500;
    for (let i = 0; i < convIds.length; i += batchSize) {
      const batch = convIds.slice(i, i + batchSize);
      const { data: msgRows } = await admin
        .from("messages")
        .select("created_at")
        .in("conversation_id", batch)
        .eq("role", "user")
        .gte("created_at", since);

      for (const row of msgRows ?? []) {
        if (!row.created_at) continue;
        const day = toDayKey(row.created_at);
        const month = toMonthKey(row.created_at);
        if (dayKeys.has(day)) {
          incrementBucket(dailyMap, day, dayLabels.get(day) ?? day, "visitor_messages");
        }
        if (monthKeys.has(month)) {
          incrementBucket(
            monthlyMap,
            month,
            monthLabels.get(month) ?? month,
            "visitor_messages"
          );
        }
      }
    }
  }

  const { data: eventRows, error: eventsError } = await admin
    .from("widget_click_events")
    .select("event_type, created_at")
    .in("site_id", siteIds)
    .gte("created_at", since);

  if (!eventsError) {
    for (const row of eventRows ?? []) {
      if (!row.created_at) continue;
      const day = toDayKey(row.created_at);
      const month = toMonthKey(row.created_at);
      const field = row.event_type === "open" ? "opens" : "clicks";
      if (dayKeys.has(day)) {
        incrementBucket(dailyMap, day, dayLabels.get(day) ?? day, field);
      }
      if (monthKeys.has(month)) {
        incrementBucket(monthlyMap, month, monthLabels.get(month) ?? month, field);
      }
    }
  }

  const daily = dayRange.map(({ key, label }) => dailyMap.get(key) ?? {
    period: key,
    label,
    opens: 0,
    conversations: 0,
    visitor_messages: 0,
    clicks: 0,
  });

  const monthly = monthRange.map(({ key, label }) => monthlyMap.get(key) ?? {
    period: key,
    label,
    opens: 0,
    conversations: 0,
    visitor_messages: 0,
    clicks: 0,
  });

  return { daily, monthly };
}

export function normalizeRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export { widgetEmbedHtml as widgetScript } from "@/lib/widget-embed";
