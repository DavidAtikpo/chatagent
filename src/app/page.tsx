import { BrandLogo } from "@/components/brand-logo";
import { ChatPreviewDemo } from "@/components/chat-preview-demo";
import { SignupFlowDemo } from "@/components/signup-flow-demo";
import { LOGO_SIZE, SAAS_NAME } from "@/lib/branding";
import Link from "next/link";

const PLANS = [
  {
    name: "Starter",
    price: "29",
    features: ["1 site", "500 conversations/mois", "Widget embed", "Scoring leads", "Dashboard KPIs"],
  },
  {
    name: "Pro",
    price: "79",
    popular: true,
    features: [
      "5 sites",
      "Conversations illimitées",
      "Liens trackés + image d'aperçu",
      "WhatsApp, appel & email",
      "Notifications temps réel",
      "Stats pays & campagnes",
    ],
  },
  {
    name: "Agency",
    price: "199",
    features: [
      "Sites illimités",
      "Marque blanche",
      "Multi-clients",
      "API complète",
      "Support prioritaire",
    ],
  },
];

const FEATURES = [
  {
    title: "Widget embed léger",
    desc: "Un script sur votre site. Le chat s'ouvre en bulle ou en page plein écran, sans ralentir vos pages.",
    icon: "💬",
  },
  {
    title: "IA formée sur votre site",
    desc: "Crawl automatique de vos pages, formations et FAQ. L'agent répond avec vos vrais tarifs et liens d'inscription.",
    icon: "🧠",
  },
  {
    title: "Liens trackés par campagne",
    desc: "Créez un slug par source (Facebook, Instagram, Google Ads…) et suivez visites et interactions.",
    icon: "🔗",
  },
  {
    title: "Qualification & scoring",
    desc: "Pays, budget, disponibilité : chaque conversation est notée sur 100. Les leads chauds remontent seuls.",
    icon: "📊",
  },
  {
    title: "Voix intégrée",
    desc: "Vos visiteurs peuvent parler au micro et écouter les réponses — idéal pour le mobile et l'accessibilité.",
    icon: "🎙️",
  },
  {
    title: "Handoff humain",
    desc: "Boutons WhatsApp, appel et email en un clic. L'historique de la conversation reste disponible.",
    icon: "🤝",
  },
];

const USE_CASES = [
  {
    title: "Centres de formation",
    desc: "Sessions IRATA, CND, dates et tarifs : l'agent propose les bonnes inscriptions avec les liens exacts.",
  },
  {
    title: "E-commerce & services",
    desc: "Réponses produit, FAQ et orientation vers l'achat ou le devis sans attendre un conseiller.",
  },
  {
    title: "Campagnes social ads",
    desc: "Un lien /c/votre-slug par campagne. Voyez d'où viennent les clics et ce que font les visiteurs dans le chat.",
  },
];

const FAQ = [
  {
    q: "Combien de temps pour être en ligne ?",
    a: "Environ 5 minutes : créez un compte, entrez l'URL de votre site, le crawl et l'entraînement de l'agent se lancent automatiquement.",
  },
  {
    q: "L'IA invente-t-elle des informations ?",
    a: "Non par design : l'agent s'appuie uniquement sur le contenu crawlé de votre site. S'il ne sait pas, il propose le contact humain.",
  },
  {
    q: "Puis-je l'utiliser sans développeur ?",
    a: "Oui. Copiez le script widget ou le lien tracké depuis le dashboard. Aucune compétence technique requise.",
  },
  {
    q: "Comment l'intégrer sur mon site (WordPress, Next.js, React…) ?",
    a: "Un seul script à coller avant </body>. Guides détaillés pour chaque framework sur la page Intégration — consultable avant même de créer un compte.",
    link: "/integration",
  },
  {
    q: "Quelles langues sont supportées ?",
    a: "Français et anglais en priorité. L'agent détecte la langue du visiteur et répond dans la même langue.",
  },
];

const STATS = [
  { value: "5 min", label: "Mise en ligne" },
  { value: "24/7", label: "Disponibilité" },
  { value: "< 20kb", label: "Widget léger" },
  { value: "0–100", label: "Score lead" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-brand-100 bg-brand-50/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
          <BrandLogo
            href="/"
            size={LOGO_SIZE.header}
            nameClassName="text-lg font-bold text-brand-600"
          />
          <nav className="hidden items-center gap-5 text-sm sm:flex">
            <a href="#features" className="text-slate-600 hover:text-brand-700">
              Fonctionnalités
            </a>
            <a href="#use-cases" className="text-slate-600 hover:text-brand-700">
              Cas d&apos;usage
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-brand-700">
              Tarifs
            </a>
            <Link href="/integration" className="text-slate-600 hover:text-brand-700">
              Intégration
            </Link>
            <a href="#faq" className="text-slate-600 hover:text-brand-700">
              FAQ
            </a>
            <Link
              href="/login"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Connexion
            </Link>
          </nav>
          <Link
            href="/signup"
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 sm:hidden"
          >
            Essai gratuit
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50/80 via-brand-50/30 to-white">
        <div className="mx-auto max-w-5xl px-4 py-8 text-center sm:py-10">
          <p className="inline-block rounded-full border border-brand-200 bg-white px-2.5 py-0.5 text-xs font-medium text-brand-700">
            Agent commercial IA · Embed · Leads qualifiés
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
            Transformez vos visiteurs en{" "}
            <span className="text-brand-600">clients qualifiés</span>
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            {SAAS_NAME} analyse votre site web, déploie un chatbot intelligent sur vos pages ou vos
            campagnes publicitaires, et vous alerte quand un prospect est prêt à acheter ou
            s&apos;inscrire.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="w-full rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 sm:w-auto"
            >
              Créer mon agent gratuitement
            </Link>
            <a
              href="#how-it-works"
              className="w-full rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:bg-brand-50 sm:w-auto"
            >
              Voir comment ça marche
            </a>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-brand-100 bg-white/80 px-2.5 py-2 shadow-sm"
              >
                <p className="text-base font-bold text-brand-600 sm:text-lg">{s.value}</p>
                <p className="text-[11px] text-slate-500 sm:text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product preview */}
      <section className="border-y border-slate-100 bg-slate-50 py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-5 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">
                Un assistant qui connaît <span className="text-brand-600">votre</span> entreprise
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Pas de configuration manuelle interminable : notre moteur lit vos pages produits,
                formations, tarifs et sessions. Claude rédige des réponses naturelles, en français
                ou en anglais, avec vos liens d&apos;inscription et boutons de contact.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {[
                  "Message d'accueil généré après le crawl",
                  "Boutons session [[inscription]] automatiques",
                  "Dashboard : pays, campagnes, clics widget",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 text-brand-600">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <ChatPreviewDemo />
          </div>
        </div>
      </section>

      {/* How it works — animated signup flow */}
      <section id="how-it-works" className="py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-lg font-bold sm:text-xl">Comment ça marche</h2>
          <p className="mx-auto mt-1 max-w-lg text-center text-sm text-slate-600">
            De l&apos;inscription au premier lead qualifié — suivez le parcours en direct.
          </p>
          <div className="mt-4">
            <SignupFlowDemo />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-lg font-bold sm:text-xl">Fonctionnalités clés</h2>
          <p className="mx-auto mt-1 max-w-lg text-center text-sm text-slate-600">
            Tout ce qu&apos;il faut pour vendre et qualifier, sans équipe technique.
          </p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition hover:border-brand-200"
              >
                <span className="text-xl" aria-hidden>
                  {f.icon}
                </span>
                <h3 className="mt-1 text-sm font-semibold">{f.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-lg font-bold sm:text-xl">Pour qui ?</h2>
          <div className="mt-4 grid gap-2.5 md:grid-cols-3">
            {USE_CASES.map((uc) => (
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

      {/* Dashboard highlight */}
      <section className="border-y border-brand-100 bg-brand-50/50 py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-lg font-bold sm:text-xl">Un dashboard qui parle business</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-slate-600">
            KPIs, conversations, leads, répartition par pays, performance des liens trackés et
            interactions widget — tout en un seul endroit.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {[
              "Conversations en direct",
              "Score lead 0–100",
              "Stats par pays",
              "Clics WhatsApp / session",
              "Liens Facebook & Instagram",
              "Export leads",
            ].map((tag) => (
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
            className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Accéder au dashboard
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-lg font-bold sm:text-xl">Tarifs simples</h2>
          <p className="mx-auto mt-1 max-w-md text-center text-sm text-slate-600">
            Commencez petit, passez Pro quand vos campagnes décollent.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-lg bg-white p-4 shadow-sm ${
                  plan.popular ? "ring-2 ring-brand-600" : "border border-slate-100"
                }`}
              >
                {plan.popular && (
                  <span className="w-fit rounded-full bg-brand-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                    Le plus choisi
                  </span>
                )}
                <h3 className={`text-sm font-bold ${plan.popular ? "mt-1.5" : ""}`}>{plan.name}</h3>
                <p className="mt-1">
                  <span className="text-2xl font-bold">{plan.price}€</span>
                  <span className="text-xs text-slate-500">/mois</span>
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
                  className={`mt-3 block rounded-lg py-2 text-center text-sm font-semibold ${
                    plan.popular
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "border border-slate-200 text-slate-700 hover:border-brand-200 hover:bg-brand-50"
                  }`}
                >
                  Choisir {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-slate-50 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-lg font-bold sm:text-xl">Questions fréquentes</h2>
          <div className="mt-4 space-y-2">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-slate-100 bg-white p-3 shadow-sm"
              >
                <summary className="cursor-pointer list-none font-medium text-slate-900 marker:content-none">
                  <span className="flex items-center justify-between gap-2">
                    {item.q}
                    <span className="text-brand-600 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.a}
                  {"link" in item && item.link ? (
                    <>
                      {" "}
                      <Link href={item.link} className="font-medium text-brand-600 hover:underline">
                        Voir le guide d&apos;intégration →
                      </Link>
                    </>
                  ) : null}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 py-8 text-white sm:py-10">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-xl font-bold sm:text-2xl">
            Prêt à ne plus perdre un visiteur ?
          </h2>
          <p className="mt-2 text-sm text-brand-100">
            Créez votre compte, entrez l&apos;URL de votre site et laissez {SAAS_NAME} faire le
            reste. Essai sans engagement.
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-block rounded-lg bg-white px-5 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Démarrer maintenant — c&apos;est gratuit
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white py-4">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <BrandLogo href="/" size={40} showName={false} />
          <nav className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            <a href="#features" className="hover:text-brand-600">
              Fonctionnalités
            </a>
            <a href="#pricing" className="hover:text-brand-600">
              Tarifs
            </a>
            <Link href="/integration" className="hover:text-brand-600">
              Intégration
            </Link>
            <Link href="/login" className="hover:text-brand-600">
              Connexion
            </Link>
            <Link href="/signup" className="hover:text-brand-600">
              Inscription
            </Link>
          </nav>
          <p className="text-xs text-slate-400">© 2026 {SAAS_NAME}. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
