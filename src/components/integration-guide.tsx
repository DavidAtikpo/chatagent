"use client";

import {
  FRAMEWORK_GUIDES,
  widgetEmbedHtmlFromConfig,
  WIDGET_INTEGRATION_STEPS,
  type WidgetEmbedConfig,
} from "@/lib/widget-embed";
import Link from "next/link";
import { useState } from "react";

type Props = {
  config: WidgetEmbedConfig;
  siteUrl?: string;
  /** Page marketing publique vs dashboard client */
  variant?: "public" | "dashboard";
};

export function IntegrationGuide({ config, siteUrl, variant = "dashboard" }: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState<string | null>(null);
  const [openGuide, setOpenGuide] = useState<string>("html");
  const snippet = widgetEmbedHtmlFromConfig(config);
  const isPublic = variant === "public";

  async function copy(text: string, kind: "main" | string) {
    await navigator.clipboard.writeText(text);
    if (kind === "main") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedGuide(kind);
      setTimeout(() => setCopiedGuide(null), 2000);
    }
  }

  const activeGuide = FRAMEWORK_GUIDES.find((g) => g.id === openGuide) ?? FRAMEWORK_GUIDES[0];

  return (
    <div
      className={
        isPublic
          ? ""
          : "mt-3 rounded-lg border border-brand-100 bg-gradient-to-b from-brand-50/40 to-white p-4"
      }
    >
      {!isPublic && (
        <>
          <h3 className="text-sm font-semibold text-slate-900">Intégrer sur votre site</h3>
          <p className="mt-1 text-xs text-slate-600">
            Compatible HTML, WordPress, Next.js, React, Vue, Angular, Nuxt, Shopify…
            {siteUrl ? (
              <>
                {" "}
                Domaine autorisé :{" "}
                <span className="font-medium text-slate-800">{siteUrl.replace(/^https?:\/\//, "")}</span>
              </>
            ) : null}
          </p>
        </>
      )}

      {isPublic && (
        <p className="mb-4 text-sm text-slate-600">
          Remplacez <code className="rounded bg-slate-100 px-1 text-xs">wk_VOTRE_CLE</code> par la clé
          fournie dans votre dashboard après inscription. Aucune configuration serveur côté client.
        </p>
      )}

      <ol className={`space-y-2 ${isPublic ? "mb-6" : "mt-3"}`}>
        {WIDGET_INTEGRATION_STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-2 text-xs text-slate-700 sm:text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white sm:h-6 sm:w-6 sm:text-xs">
              {i + 1}
            </span>
            <span>
              <strong className="font-medium text-slate-900">{step.title}</strong>
              {" — "}
              {step.body}
            </span>
          </li>
        ))}
      </ol>

      <p className={`font-medium text-slate-700 ${isPublic ? "text-sm" : "text-xs"}`}>
        Script universel (tous sites)
      </p>
      <pre
        className={`mt-1 overflow-x-auto rounded-lg bg-slate-900 text-green-400 ${
          isPublic ? "p-4 text-xs leading-relaxed sm:text-sm" : "p-3 text-[11px] leading-relaxed"
        }`}
      >
        {snippet}
      </pre>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy(snippet, "main")}
          className="rounded-md bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700 sm:text-sm"
        >
          {copied ? "Copié !" : "Copier le script"}
        </button>
        {isPublic ? (
          <Link
            href="/signup"
            className="rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-medium text-brand-800 hover:bg-brand-100 sm:text-sm"
          >
            Créer un compte → obtenir ma clé
          </Link>
        ) : (
          <Link
            href="/dashboard/links"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Lien chat plein écran
          </Link>
        )}
      </div>

      <div className={`border-slate-100 pt-4 ${isPublic ? "mt-8 border-t" : "mt-4 border-t"}`}>
        <p className={`font-medium text-slate-700 ${isPublic ? "text-sm" : "text-xs"}`}>
          Guides par framework
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FRAMEWORK_GUIDES.map((guide) => (
            <button
              key={guide.id}
              type="button"
              onClick={() => setOpenGuide(guide.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition sm:text-xs ${
                openGuide === guide.id
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {guide.title.split("(")[0].trim()}
            </button>
          ))}
        </div>

        <p className="mt-2 text-xs text-slate-600 sm:text-sm">{activeGuide.summary}</p>
        <pre
          className={`mt-2 overflow-auto rounded-lg bg-slate-900 text-green-400 ${
            isPublic ? "max-h-80 p-4 text-[11px] leading-relaxed sm:text-xs" : "max-h-64 p-3 text-[10px] leading-relaxed"
          }`}
        >
          {activeGuide.code(config)}
        </pre>
        <button
          type="button"
          onClick={() => copy(activeGuide.code(config), activeGuide.id)}
          className="mt-2 text-xs font-medium text-brand-700 hover:text-brand-800 sm:text-sm"
        >
          {copiedGuide === activeGuide.id ? "Exemple copié !" : "Copier cet exemple"}
        </button>
      </div>

      {isPublic && (
        <div className="mt-8 rounded-lg border border-brand-100 bg-brand-50/50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Après inscription</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs sm:text-sm">
            <li>Votre clé personnelle <code className="text-xs">wk_…</code> apparaît dans Dashboard → Sites</li>
            <li>Le script fonctionne sur n&apos;importe quel domaine (WordPress, React, etc.) — pas de CORS à configurer</li>
            <li>Le script est identique — remplacez seulement la clé</li>
          </ul>
        </div>
      )}
    </div>
  );
}
