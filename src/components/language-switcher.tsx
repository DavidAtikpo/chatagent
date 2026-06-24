"use client";

import { SITE_LOCALE_LABELS, SITE_LOCALES, type SiteLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/context";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <span className="sr-only">{t("languageSwitcher.ariaLabel")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as SiteLocale)}
        aria-label={t("languageSwitcher.ariaLabel")}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
      >
        {SITE_LOCALES.map((code) => (
          <option key={code} value={code}>
            {SITE_LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
