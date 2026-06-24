"use client";

import { useI18n } from "@/i18n/context";
import { SAAS_NAME } from "@/lib/branding";
import { useEffect, useState } from "react";

type Phase =
  | "idle"
  | "typing"
  | "submitting"
  | "crawling"
  | "embedding"
  | "deploy"
  | "lead"
  | "hold";

const DEMO_URL = "https://mon-entreprise.com";
const CRAWL_URLS = [
  "https://mon-entreprise.com/",
  "https://mon-entreprise.com/formations",
  "https://mon-entreprise.com/tarifs",
  "https://mon-entreprise.com/contact",
];

function useTypewriter(text: string, active: boolean, msPerChar: number) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      return;
    }
    setDisplayed("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, msPerChar);
    return () => window.clearInterval(id);
  }, [text, active, msPerChar]);

  return displayed;
}

function activeStep(phase: Phase): number {
  if (phase === "deploy") return 2;
  if (phase === "lead" || phase === "hold") return 3;
  if (phase === "idle") return 0;
  return 1;
}

export function SignupFlowDemo() {
  const { t, messages, ready } = useI18n();
  const [phase, setPhase] = useState<Phase>("idle");
  const [cycle, setCycle] = useState(0);
  const [progress, setProgress] = useState(0);
  const [crawlUrl, setCrawlUrl] = useState(CRAWL_URLS[0]);
  const [pagesDone, setPagesDone] = useState(0);

  const demo = messages.home?.demo?.signupFlow;
  const demoName = demo?.demoName ?? "Mon Centre de Formation";
  const steps = demo?.steps ?? [];

  const nameText = useTypewriter(demoName, phase === "typing", 40);
  const nameDone = nameText.length >= demoName.length;
  const urlText = useTypewriter(DEMO_URL, phase === "typing" && nameDone, 22);

  useEffect(() => {
    if (!ready) return;

    const sequence: { phase: Phase; delay: number }[] = [
      { phase: "idle", delay: 500 },
      { phase: "typing", delay: demoName.length * 40 + DEMO_URL.length * 22 + 600 },
      { phase: "submitting", delay: 1200 },
      { phase: "crawling", delay: 3200 },
      { phase: "embedding", delay: 2400 },
      { phase: "deploy", delay: 2200 },
      { phase: "lead", delay: 2800 },
      { phase: "hold", delay: 3000 },
    ];

    let i = 0;
    let timeoutId: number;

    function next() {
      const item = sequence[i];
      setPhase(item.phase);
      if (item.phase === "crawling") {
        setProgress(0);
        setPagesDone(0);
        setCrawlUrl(CRAWL_URLS[0]);
      }
      if (item.phase === "embedding") {
        setProgress(0);
      }
      timeoutId = window.setTimeout(() => {
        i += 1;
        if (i >= sequence.length) {
          setCycle((c) => c + 1);
          i = 0;
        }
        next();
      }, item.delay);
    }

    next();
    return () => window.clearTimeout(timeoutId);
  }, [cycle, ready, demoName]);

  useEffect(() => {
    if (phase !== "crawling") return;
    let p = 0;
    let page = 0;
    const id = window.setInterval(() => {
      p = Math.min(p + 4, 100);
      setProgress(p);
      const newPage = Math.min(Math.floor(p / 25), CRAWL_URLS.length - 1);
      if (newPage !== page) {
        page = newPage;
        setPagesDone(page + 1);
        setCrawlUrl(CRAWL_URLS[page]);
      }
    }, 120);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "embedding") return;
    let p = 0;
    const id = window.setInterval(() => {
      p = Math.min(p + 6, 100);
      setProgress(p);
    }, 140);
    return () => window.clearInterval(id);
  }, [phase]);

  const step = activeStep(phase);

  function phaseTitle() {
    if (phase === "typing" || phase === "submitting") {
      return t("home.demo.signupFlow.phases.creatingAccount");
    }
    if (phase === "crawling" || phase === "embedding") {
      return t("home.demo.signupFlow.phases.configuringAgent");
    }
    if (phase === "deploy") return t("home.demo.signupFlow.phases.deploying");
    if (phase === "lead" || phase === "hold") {
      return t("home.demo.signupFlow.phases.dashboard");
    }
    return t("home.demo.signupFlow.phases.demoTitle", { saasName: SAAS_NAME });
  }

  if (!ready) {
    return <div className="min-h-[260px] rounded-lg border border-slate-200 bg-white" />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-2 lg:col-span-2">
        {steps.map((s, idx) => {
          const num = idx + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div
              key={num}
              className={`rounded-lg border p-3 transition-all duration-500 ${
                isActive
                  ? "border-brand-400 bg-brand-50 shadow-sm ring-1 ring-brand-200"
                  : isDone
                    ? "border-brand-100 bg-white opacity-90"
                    : "border-slate-100 bg-white opacity-60"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : isDone
                        ? "bg-brand-100 text-brand-700"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isDone ? "✓" : num}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <p className="text-xs text-slate-600">{s.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="lg:col-span-3">
        <div className="min-h-[260px] rounded-lg border border-slate-200 bg-white p-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <p className="text-xs font-semibold text-slate-800">{phaseTitle()}</p>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
              {t("home.demo.signupFlow.live")}
            </span>
          </div>

          <div className="mt-2">
            {(phase === "idle" ||
              phase === "typing" ||
              phase === "submitting" ||
              phase === "crawling" ||
              phase === "embedding") && (
              <div
                className={`transition-opacity duration-300 ${
                  phase === "crawling" || phase === "embedding" ? "opacity-40" : "opacity-100"
                }`}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {t("home.demo.signupFlow.signup")}
                </p>
                <div className="mt-1.5 space-y-1.5">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    {nameText || "\u00A0"}
                    {phase === "typing" && nameText.length < demoName.length && (
                      <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-brand-500" />
                    )}
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    {urlText || "\u00A0"}
                    {phase === "typing" && nameDone && urlText.length < DEMO_URL.length && (
                      <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-brand-500" />
                    )}
                  </div>
                  <button
                    type="button"
                    className={`w-full rounded-lg py-2 text-xs font-semibold text-white transition-colors ${
                      phase === "submitting" ? "bg-brand-500" : "bg-brand-600"
                    }`}
                  >
                    {phase === "submitting" ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {t("home.demo.signupFlow.submitting")}
                      </span>
                    ) : (
                      t("home.demo.signupFlow.submit")
                    )}
                  </button>
                </div>
              </div>
            )}

            {(phase === "crawling" || phase === "embedding") && (
              <div className="mt-2 rounded-lg border border-brand-100 bg-brand-50/60 p-2.5 transition-all duration-300">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>
                    {phase === "crawling"
                      ? t("home.demo.signupFlow.crawlPages")
                      : t("home.demo.signupFlow.crawlEmbedding")}
                  </span>
                  <span>{progress} %</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all duration-150"
                    style={{ width: `${Math.max(progress, 5)}%` }}
                  />
                </div>
                {phase === "crawling" && (
                  <>
                    <p className="mt-2 text-xs text-slate-600">
                      {t("home.demo.signupFlow.pageProgress", {
                        current: pagesDone,
                        total: CRAWL_URLS.length,
                      })}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-slate-400">{crawlUrl}</p>
                  </>
                )}
                {phase === "embedding" && (
                  <p className="mt-2 text-xs text-slate-600">
                    {t("home.demo.signupFlow.indexing")}
                  </p>
                )}
              </div>
            )}

            {(phase === "deploy" || phase === "lead" || phase === "hold") && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <span className="text-emerald-600">✓</span>
                  <p className="text-xs font-medium text-emerald-800">
                    {t("home.demo.signupFlow.agentReady")}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-900 p-3">
                  <p className="text-[10px] text-slate-400">
                    {t("home.demo.signupFlow.scriptHint")}
                  </p>
                  <code className="mt-1 block text-[10px] text-emerald-400">
                    {`<script src="…/widget.js" data-key="wk_…"></script>`}
                  </code>
                </div>
              </div>
            )}

            {(phase === "lead" || phase === "hold") && (
              <div className="mt-2 rounded-lg border border-brand-200 bg-white p-2.5 shadow-sm">
                <div className="flex items-start gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    80
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {t("home.demo.signupFlow.newLead")}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {t("home.demo.signupFlow.leadDetail")}
                    </p>
                    <p className="mt-1 text-[10px] text-brand-600">
                      {t("home.demo.signupFlow.leadScore")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="mt-2 text-center text-[10px] text-slate-400">
            {t("home.demo.signupFlow.footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
