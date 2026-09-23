"use client";

import { SITE_LOCALE_LABELS, SITE_LOCALES, type SiteLocale } from "@/i18n/config";

const MOBILE_LOCALE_LABELS: Record<SiteLocale, string> = {
  fr: "FR",
  en: "EN",
  de: "DE",
  it: "IT",
  es: "ES",
  pt: "PT",
};
import { useI18n } from "@/i18n/context";

export function LanguageSwitcher({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className={`inline-flex max-w-full items-center gap-2 text-sm ${className}`}>
      <span className="sr-only">{t("languageSwitcher.ariaLabel")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as SiteLocale)}
        aria-label={t("languageSwitcher.ariaLabel")}
        className={`rounded-md border border-slate-200 bg-white text-slate-700 ${
          compact
            ? "w-[4.25rem] shrink-0 px-1.5 py-1.5 text-xs"
            : "max-w-[8.5rem] px-2 py-1.5 text-sm"
        }`}
      >
        {SITE_LOCALES.map((code) => (
          <option key={code} value={code}>
            {compact ? MOBILE_LOCALE_LABELS[code] : SITE_LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
