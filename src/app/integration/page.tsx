import { BrandLogo } from "@/components/brand-logo";
import { IntegrationGuide } from "@/components/integration-guide";
import { LOGO_SIZE, SAAS_NAME } from "@/lib/branding";
import { getPublicEmbedDemoConfig } from "@/lib/widget-embed";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Intégration du widget chat",
  description:
    "Installez ChatAgent sur WordPress, Next.js, React, Vue, Angular ou HTML en quelques minutes. Script unique, sans npm, CORS automatique.",
};

const COMPAT = [
  "WordPress",
  "Next.js",
  "React / Vite",
  "Vue 3",
  "Nuxt",
  "Angular",
  "Shopify",
  "HTML / PHP",
];

export default function IntegrationPage() {
  const demoConfig = getPublicEmbedDemoConfig();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-brand-100 bg-brand-50/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
          <BrandLogo href="/" size={LOGO_SIZE.header} nameClassName="text-lg font-bold text-brand-600" />
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-slate-600 hover:text-brand-700">
              Accueil
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Documentation</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Intégrer {SAAS_NAME} sur votre site
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          Un seul script JavaScript. Pas de package npm, pas de configuration CORS de votre côté.
          Compatible avec les stacks les plus courantes.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {COMPAT.map((name) => (
            <span
              key={name}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
            >
              {name}
            </span>
          ))}
        </div>

        <div className="mt-8">
          <IntegrationGuide config={demoConfig} variant="public" />
        </div>
      </main>

      <footer className="border-t border-slate-100 py-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-slate-500">© 2026 {SAAS_NAME}</p>
          <Link href="/signup" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Créer mon compte gratuitement →
          </Link>
        </div>
      </footer>
    </div>
  );
}
