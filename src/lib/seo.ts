import { SAAS_NAME, saasLogoUrl } from "@/lib/branding";

export const SITE_NAME = SAAS_NAME;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://chatagent.fr"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "ChatAgent déploie un agent commercial IA sur votre site en 5 minutes : crawl automatique, chatbot embed, qualification des leads, liens trackés et handoff WhatsApp.";

export const SITE_TAGLINE = "Agent commercial IA pour transformer vos visiteurs en clients qualifiés";

export const SITE_KEYWORDS = [
  "chatbot IA",
  "agent commercial IA",
  "chatbot entreprise",
  "widget chat site web",
  "qualification leads",
  "chatbot formation",
  "assistant virtuel",
  "SaaS chatbot",
  "ChatAgent",
  "chatbot français",
  "liens trackés Facebook",
  "scoring leads",
];

export function absoluteUrl(path = ""): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function siteOgImage() {
  return {
    url: saasLogoUrl(SITE_URL),
    width: 1200,
    height: 1200,
    alt: `${SITE_NAME} — logo`,
    type: "image/png" as const,
  };
}

export function siteJsonLd() {
  const logo = saasLogoUrl(SITE_URL);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: logo,
        },
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "fr-FR",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        offers: {
          "@type": "AggregateOffer",
          lowPrice: "29",
          highPrice: "199",
          priceCurrency: "EUR",
          offerCount: 3,
        },
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

export const PUBLIC_SITEMAP_PATHS = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/signup", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/login", changeFrequency: "monthly" as const, priority: 0.5 },
];
