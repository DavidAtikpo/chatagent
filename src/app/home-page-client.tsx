"use client";

import { BrandLogo } from "@/components/brand-logo";
import { ChatPreviewDemo } from "@/components/chat-preview-demo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SignupFlowDemo } from "@/components/signup-flow-demo";
import { useI18n } from "@/i18n/context";
import { SAAS_NAME } from "@/lib/branding";
import Link from "next/link";
import { useEffect, useState } from "react";

const FEATURE_ICONS = ["💬", "🧠", "🔗", "📊", "🎙️", "🤝"];
const STAT_VALUES = ["5 min", "24/7", "< 20kb", "0–100"];
const STAT_KEYS = ["goLive", "availability", "widgetLight", "leadScore"] as const;

const NAV_LINKS = [
  { href: "#features", key: "nav.features" as const },
  { href: "#use-cases", key: "nav.useCases" as const },
  { href: "#pricing", key: "nav.pricing" as const },
  { href: "/integration", key: "nav.integration" as const, internal: true },
  { href: "#faq", key: "nav.faq" as const },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function HomePageClient() {
  const { t, messages, ready } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onResize() {
      if (window.matchMedia("(min-width: 1024px)").matches) setMenuOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        {t("common.loading")}
      </div>
    );
  }

  const features = messages.home.features.items;
  const useCases = messages.home.useCases.items;
  const plans = messages.home.pricing.plans;
  const faq = messages.home.faq.items;
  const dashboardTags = messages.home.dashboardHighlight.tags;
  const previewBullets = messages.home.preview.bullets;

  return (
    <div className="relative min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-white text-slate-900">
      <header className="sticky top-0 z-50 overflow-x-hidden border-b border-brand-100 bg-brand-50/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <BrandLogo
            href="/"
            size={40}
            className="min-w-0 max-w-[calc(100%-3rem)] shrink gap-2"
            nameClassName="truncate text-base font-bold text-brand-600 sm:text-lg"
          />
          <nav className="hidden min-w-0 items-center gap-3 text-sm lg:flex xl:gap-5">
            {NAV_LINKS.map((link) =>
              link.internal ? (
                <Link
                  key={link.key}
                  href={link.href}
                  className="whitespace-nowrap text-slate-600 hover:text-brand-700"
                >
                  {t(link.key)}
                </Link>
              ) : (
                <a
                  key={link.key}
                  href={link.href}
                  className="whitespace-nowrap text-slate-600 hover:text-brand-700"
                >
                  {t(link.key)}
                </a>
              )
            )}
            <LanguageSwitcher />
            <Link
              href="/login"
              className="shrink-0 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              {t("nav.login")}
            </Link>
          </nav>
          <div className="flex shrink-0 items-center lg:hidden">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700"
              aria-expanded={menuOpen}
              aria-controls="home-mobile-nav"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>
        {menuOpen ? (
          <div
            id="home-mobile-nav"
            className="border-t border-brand-100 bg-white px-4 py-3 shadow-sm lg:hidden"
          >
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="text-xs font-medium text-slate-500">{t("languageSwitcher.label")}</span>
              <LanguageSwitcher className="w-auto shrink-0" />
            </div>
            <nav className="flex flex-col gap-1 text-sm">
              {NAV_LINKS.map((link) =>
                link.internal ? (
                  <Link
                    key={link.key}
                    href={link.href}
                    className="rounded-md px-2 py-2.5 text-slate-700 hover:bg-brand-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t(link.key)}
                  </Link>
                ) : (
                  <a
                    key={link.key}
                    href={link.href}
                    className="rounded-md px-2 py-2.5 text-slate-700 hover:bg-brand-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t(link.key)}
                  </a>
                )
              )}
              <Link
                href="/login"
                className="rounded-md px-2 py-2.5 text-slate-700 hover:bg-brand-50"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/signup"
                className="mt-1 rounded-md bg-brand-600 px-3 py-2.5 text-center font-medium text-white hover:bg-brand-700"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.freeTrial")}
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      <section className="bg-gradient-to-b from-brand-50/80 via-brand-50/30 to-white">
        <div className="mx-auto max-w-5xl px-4 py-8 text-center sm:px-6 sm:py-12">
          <p className="inline-block max-w-full rounded-full border border-brand-200 bg-white px-2.5 py-0.5 text-xs font-medium text-brand-700">
            {t("home.hero.badge")}
          </p>
          <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight sm:text-4xl">
            {t("home.hero.title")}{" "}
            <span className="text-brand-600">{t("home.hero.titleHighlight")}</span>
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
            {t("home.hero.subtitle", { saasName: SAAS_NAME })}
          </p>
          <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 sm:w-auto"
            >
              {t("home.hero.ctaPrimary")}
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:bg-brand-50 sm:w-auto"
            >
              {t("home.hero.ctaSecondary")}
            </a>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STAT_KEYS.map((key, i) => (
              <div
                key={key}
                className="min-w-0 rounded-lg border border-brand-100 bg-white/80 px-2 py-2 shadow-sm sm:px-2.5"
              >
                <p className="text-base font-bold text-brand-600 sm:text-lg">{STAT_VALUES[i]}</p>
                <p className="text-[11px] leading-snug text-slate-500 sm:text-xs">
                  {t(`home.stats.${key}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid items-center gap-5 lg:grid-cols-2">
            <div className="min-w-0">
              <h2 className="text-lg font-bold sm:text-xl">
                {t("home.preview.title")}{" "}
                <span className="text-brand-600">{t("home.preview.titleHighlight")}</span>{" "}
                {t("home.preview.titleEnd")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("home.preview.body")}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {previewBullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-brand-600">✓</span>
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0">
              <ChatPreviewDemo />
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-lg font-bold sm:text-xl">
            {t("home.howItWorks.title")}
          </h2>
          <p className="mx-auto mt-1 max-w-lg text-center text-sm text-slate-600">
            {t("home.howItWorks.subtitle")}
          </p>
          <div className="mt-4">
            <SignupFlowDemo />
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-lg font-bold sm:text-xl">
            {t("home.features.title")}
          </h2>
          <p className="mx-auto mt-1 max-w-lg text-center text-sm text-slate-600">
            {t("home.features.subtitle")}
          </p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="min-w-0 rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition hover:border-brand-200"
              >
                <span className="text-xl" aria-hidden>
                  {FEATURE_ICONS[i]}
                </span>
                <h3 className="mt-1 text-sm font-semibold">{f.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-lg font-bold sm:text-xl">
            {t("home.useCases.title")}
          </h2>
          <div className="mt-4 grid gap-2.5 md:grid-cols-3">
            {useCases.map((uc) => (
              <div
                key={uc.title}
                className="rounded-lg border-l-4 border-brand-500 bg-brand-50/50 p-3"
              >
                <h3 className="text-sm font-semibold text-brand-800">{uc.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-brand-100 bg-brand-50/50 py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h2 className="text-lg font-bold sm:text-xl">
            {t("home.dashboardHighlight.title")}
          </h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-slate-600">
            {t("home.dashboardHighlight.subtitle")}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {dashboardTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-brand-200 bg-white px-2.5 py-0.5 text-xs font-medium text-brand-800"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            href="/signup"
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {t("home.dashboardHighlight.cta")}
          </Link>
        </div>
      </section>

      <section id="pricing" className="py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-lg font-bold sm:text-xl">
            {t("home.pricing.title")}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-center text-sm text-slate-600">
            {t("home.pricing.subtitle")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex min-w-0 flex-col rounded-lg bg-white p-4 shadow-sm ${
                  plan.popular ? "ring-2 ring-brand-600" : "border border-slate-100"
                }`}
              >
                {plan.popular && (
                  <span className="w-fit rounded-full bg-brand-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                    {t("home.pricing.popular")}
                  </span>
                )}
                <h3 className={`text-sm font-bold ${plan.popular ? "mt-1.5" : ""}`}>
                  {plan.name}
                </h3>
                <p className="mt-1">
                  <span className="text-2xl font-bold">{plan.price}€</span>
                  <span className="text-xs text-slate-500">{t("common.perMonth")}</span>
                </p>
                <ul className="mt-3 flex-1 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600 sm:text-sm">
                      <span className="shrink-0 text-brand-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-3 block rounded-lg px-2 py-2.5 text-center text-sm font-semibold ${
                    plan.popular
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "border border-slate-200 text-slate-700 hover:border-brand-200 hover:bg-brand-50"
                  }`}
                >
                  {t("home.pricing.choosePlan", { plan: plan.name })}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-slate-50 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-lg font-bold sm:text-xl">{t("home.faq.title")}</h2>
          <div className="mt-4 space-y-2">
            {faq.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-slate-100 bg-white p-3 shadow-sm"
              >
                <summary className="cursor-pointer list-none font-medium text-slate-900 marker:content-none">
                  <span className="flex items-start justify-between gap-2 text-left text-sm sm:text-base">
                    <span className="min-w-0 break-words">{item.q}</span>
                    <span className="shrink-0 text-brand-600 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.a}
                  {"hasIntegrationLink" in item && item.hasIntegrationLink ? (
                    <>
                      {" "}
                      <Link href="/integration" className="font-medium text-brand-600 hover:underline">
                        {t("common.seeGuide")}
                      </Link>
                    </>
                  ) : null}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-brand-600 to-brand-800 py-8 text-white sm:py-10">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-balance text-xl font-bold sm:text-2xl">{t("home.cta.title")}</h2>
          <p className="mt-2 text-pretty text-sm text-brand-100">
            {t("home.cta.subtitle", { saasName: SAAS_NAME })}
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            {t("home.cta.button")}
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white py-4">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 sm:px-6 md:flex-row md:flex-wrap">
          <BrandLogo href="/" size={40} showName={false} />
          <nav className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            <a href="#features" className="hover:text-brand-600">
              {t("nav.features")}
            </a>
            <a href="#pricing" className="hover:text-brand-600">
              {t("nav.pricing")}
            </a>
            <Link href="/integration" className="hover:text-brand-600">
              {t("nav.integration")}
            </Link>
            <Link href="/privacy" className="hover:text-brand-600">
              {t("nav.privacy")}
            </Link>
            <Link href="/delete-account" className="hover:text-brand-600">
              {t("nav.deleteAccount")}
            </Link>
            <Link href="/login" className="hover:text-brand-600">
              {t("nav.login")}
            </Link>
            <Link href="/signup" className="hover:text-brand-600">
              {t("nav.signup")}
            </Link>
          </nav>
          <p className="text-xs text-slate-400">
            © 2026 {SAAS_NAME}. {t("common.rightsReserved")}
          </p>
        </div>
      </footer>
    </div>
  );
}
