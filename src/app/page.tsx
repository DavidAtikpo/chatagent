import Link from "next/link";

const PLANS = [
  {
    name: "Starter",
    price: "29",
    features: ["1 site", "500 conversations/mois", "Widget embed", "Scoring leads"],
  },
  {
    name: "Pro",
    price: "79",
    popular: true,
    features: [
      "5 sites",
      "Conversations illimitées",
      "Liens trackés",
      "WhatsApp handoff",
      "Notifications temps réel",
    ],
  },
  {
    name: "Agency",
    price: "199",
    features: ["Sites illimités", "Marque blanche", "Multi-clients", "API complète", "Support prioritaire"],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <span className="text-base font-bold text-indigo-600">ChatAgent</span>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#features" className="text-slate-600 hover:text-slate-900">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900">
              Tarifs
            </a>
            <Link
              href="/login"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10 text-center sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Votre agent commercial IA,{" "}
          <span className="text-indigo-600">prêt en 5 minutes</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Collez l&apos;URL de votre site. Notre IA analyse vos pages, comprend vos produits et
          formations, et déploie un agent commercial disponible 24h/24.
        </p>
        <div className="mt-5 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
          >
            Démarrer gratuitement
          </Link>
          <a
            href="#how-it-works"
            className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Voir comment ça marche
          </a>
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-50 py-10 sm:py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-xl font-bold sm:text-2xl">Comment ça marche</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Entrez votre URL",
                desc: "Le système crawl vos pages pour comprendre vos services, prix et FAQ.",
              },
              {
                step: "2",
                title: "Déployez en 1 clic",
                desc: "Script sur votre site ou lien direct tracké pour vos campagnes.",
              },
              {
                step: "3",
                title: "Collectez des leads",
                desc: "L'agent qualifie vos prospects, calcule un score et vous notifie.",
              },
            ].map((item) => (
              <div key={item.step} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  {item.step}
                </div>
                <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-10 sm:py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-xl font-bold sm:text-2xl">Tout ce dont vous avez besoin</h2>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Widget embeddable (< 20kb)",
              "Pages chat standalone trackées",
              "Scoring automatique 0-100",
              "Transfert WhatsApp avec historique",
              "Multi-sites par compte",
              "Mémoire visiteur persistante",
              "Dashboard temps réel",
              "RAG sur votre contenu",
              "Notifications leads instantanées",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700"
              >
                <span className="shrink-0 text-xs text-indigo-600">✓</span>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-slate-50 py-10 sm:py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-xl font-bold sm:text-2xl">Tarifs simples</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg bg-white p-4 shadow-sm ${plan.popular ? "ring-2 ring-indigo-600" : ""}`}
              >
                {plan.popular && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                    Populaire
                  </span>
                )}
                <h3 className={`text-sm font-bold ${plan.popular ? "mt-2" : "mt-0"}`}>{plan.name}</h3>
                <p className="mt-1">
                  <span className="text-2xl font-bold">{plan.price}€</span>
                  <span className="text-xs text-slate-500">/mois</span>
                </p>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="text-indigo-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-4 block rounded-md py-2 text-center text-sm font-semibold ${
                    plan.popular
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Choisir {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
        © 2026 ChatAgent. Tous droits réservés.
      </footer>
    </div>
  );
}
