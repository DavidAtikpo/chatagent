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
  tracked_link_interactions?: Record<string, Partial<Record<string, number>>>;
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
  updated_at?: string | null;
};

export async function fetchCrawlProgress(siteId: string): Promise<CrawlProgress | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${apiUrl}/crawl/${siteId}/progress`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as CrawlProgress;
  } catch {
    return null;
  }
}

export async function refreshFormations(
  siteId: string
): Promise<{ ok: boolean; profiles?: number; error?: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${apiUrl}/crawl/${siteId}/formations`, { method: "POST" });
    if (!res.ok) {
      return { ok: false, error: await res.text() };
    }
    const data = (await res.json()) as { formation_profiles?: number };
    return { ok: true, profiles: data.formation_profiles };
  } catch {
    return { ok: false, error: "API inaccessible" };
  }
}

export async function refreshSessions(
  siteId: string
): Promise<{ ok: boolean; count?: number; error?: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${apiUrl}/crawl/${siteId}/sessions`, { method: "POST" });
    if (!res.ok) {
      return { ok: false, error: await res.text() };
    }
    const data = (await res.json()) as { sessions_count?: number };
    return { ok: true, count: data.sessions_count };
  } catch {
    return { ok: false, error: "API inaccessible" };
  }
}

export async function triggerCrawl(siteId: string): Promise<{ ok: boolean; error?: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${apiUrl}/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_id: siteId }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: body || `Erreur API (${res.status})` };
    }
    return { ok: true };
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "API trop lente — vérifiez qu'uvicorn tourne sur le port 8000" };
    }
    return { ok: false, error: "API inaccessible — lancez uvicorn sur le port 8000" };
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
    whatsapp: "WhatsApp",
    phone: "Appel",
    email: "Email",
    signup: "S'inscrire",
    session: "Sessions (inscription)",
    link: "Liens assistant",
  };
  return labels[eventType] ?? eventType;
}

export const WIDGET_CLICK_ORDER = ["whatsapp", "phone", "email", "signup", "session", "link"] as const;

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
};

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
    };
  });
}

export function aggregateWidgetClickStats(
  sites: { agent_config: Record<string, unknown> | null }[]
): WidgetClickStat[] {
  const counts = new Map<string, number>();

  for (const site of sites) {
    const raw = site.agent_config?.widget_click_stats;
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

export function normalizeRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export function widgetScript(widgetKey: string) {
  const url = process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:8787/widget.js";
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  return `<script src="${url}" data-key="${widgetKey}" data-api="${api}" async></script>`;
}
