/** Langues du site (interface web) — aligné avec messages/*.json */
export const SITE_LOCALES = ["fr", "en", "de", "it", "es", "pt"] as const;

export type SiteLocale = (typeof SITE_LOCALES)[number];

export const DEFAULT_SITE_LOCALE: SiteLocale = "fr";

export const SITE_LOCALE_LABELS: Record<SiteLocale, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
  it: "Italiano",
  es: "Español",
  pt: "Português",
};

export const SITE_LOCALE_COOKIE = "site_locale";

export function isSiteLocale(value: string): value is SiteLocale {
  return (SITE_LOCALES as readonly string[]).includes(value);
}
