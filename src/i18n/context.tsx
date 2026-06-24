"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SITE_LOCALE,
  SITE_LOCALE_COOKIE,
  isSiteLocale,
  type SiteLocale,
} from "./config";
import { formatMessage, loadMessages, resolveMessage, type Messages } from "./get-dictionary";

type I18nContextValue = {
  locale: SiteLocale;
  messages: Messages;
  setLocale: (locale: SiteLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readCookieLocale(): SiteLocale {
  if (typeof document === "undefined") return DEFAULT_SITE_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${SITE_LOCALE_COOKIE}=([^;]*)`));
  const raw = match ? decodeURIComponent(match[1]) : "";
  return isSiteLocale(raw) ? raw : DEFAULT_SITE_LOCALE;
}

function writeCookieLocale(locale: SiteLocale) {
  document.cookie = `${SITE_LOCALE_COOKIE}=${encodeURIComponent(locale)};path=/;max-age=31536000;samesite=lax`;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SiteLocale>(DEFAULT_SITE_LOCALE);
  const [messages, setMessages] = useState<Messages | null>(null);

  useEffect(() => {
    const initial = readCookieLocale();
    setLocaleState(initial);
    void loadMessages(initial).then(setMessages);
  }, []);

  const setLocale = useCallback((next: SiteLocale) => {
    setLocaleState(next);
    writeCookieLocale(next);
    void loadMessages(next).then(setMessages);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      if (!messages) return key;
      const raw = resolveMessage(messages, key) ?? key;
      return formatMessage(raw, vars);
    },
    [messages]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      messages: messages ?? ({} as Messages),
      setLocale,
      t,
      ready: messages !== null,
    }),
    [locale, messages, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function useT() {
  return useI18n().t;
}
