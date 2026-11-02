"use client";

import { ChatPreviewDemo, type ProfileDemoVariant } from "@/components/chat-preview-demo";
import { useI18n } from "@/i18n/context";
import { useState } from "react";

const VARIANTS: ProfileDemoVariant[] = ["website", "emploi", "autres"];

export function HomeProfileDemos() {
  const { t, messages, ready } = useI18n();
  const [active, setActive] = useState<ProfileDemoVariant>("website");

  if (!ready) {
    return <div className="min-h-[320px] rounded-lg bg-slate-100 animate-pulse" />;
  }

  const profile = messages.home?.demo?.profiles?.[active] as
    | {
        title?: string;
        titleHighlight?: string;
        titleEnd?: string;
        body?: string;
        bullets?: string[];
        setupTitle?: string;
        setupSteps?: string[];
      }
    | undefined;

  const bullets = profile?.bullets ?? [];
  const setupSteps = profile?.setupSteps ?? [];

  return (
    <section id="profiles" className="border-y border-slate-100 bg-slate-50 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-lg font-bold sm:text-xl">{t("home.profilesSection.title")}</h2>
        <p className="mx-auto mt-1 max-w-2xl text-center text-sm text-slate-600">
          {t("home.profilesSection.subtitle")}
        </p>

        <div
          className="mt-4 flex flex-wrap justify-center gap-2"
          role="tablist"
          aria-label={t("home.profilesSection.title")}
        >
          {VARIANTS.map((variant) => (
            <button
              key={variant}
              type="button"
              role="tab"
              aria-selected={active === variant}
              onClick={() => setActive(variant)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                active === variant
                  ? "bg-brand-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-brand-200"
              }`}
            >
              {t(`home.profilesSection.tabs.${variant}`)}
            </button>
          ))}
        </div>

        <p className="mt-2 text-center text-[11px] font-medium text-brand-800">
          {t(`home.profilesSection.planBadge.${active}`)}
        </p>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
          <div className="min-w-0 space-y-3">
            <div>
              <h3 className="text-base font-bold sm:text-lg">
                {profile?.title}{" "}
                {profile?.titleHighlight ? (
                  <span className="text-brand-600">{profile.titleHighlight}</span>
                ) : null}{" "}
                {profile?.titleEnd ?? ""}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{profile?.body}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-brand-600">✓</span>
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {setupSteps.length > 0 ? (
              <div className="rounded-lg border border-brand-100 bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold text-slate-900">
                  {profile?.setupTitle ?? t("home.profilesSection.setupDefaultTitle")}
                </p>
                <ol className="mt-2 space-y-1.5">
                  {setupSteps.map((step, i) => (
                    <li key={step} className="flex gap-2 text-xs text-slate-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>

          <div className="min-w-0" role="tabpanel">
            <ChatPreviewDemo key={active} variant={active} />
          </div>
        </div>
      </div>
    </section>
  );
}
