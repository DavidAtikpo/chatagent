import { getApiBaseUrl, getWidgetScriptUrl } from "@/lib/app-url";

export type WidgetEmbedConfig = {
  widgetKey: string;
  scriptUrl: string;
  api: string;
};

export function getWidgetEmbedConfig(widgetKey: string): WidgetEmbedConfig {
  return {
    widgetKey,
    scriptUrl: getWidgetScriptUrl(),
    api: getApiBaseUrl(),
  };
}

/** Exemple public (page /integration) — avant inscription. */
export function getPublicEmbedDemoConfig(): WidgetEmbedConfig {
  return getWidgetEmbedConfig("wk_VOTRE_CLE");
}

export function widgetEmbedHtmlFromConfig(cfg: WidgetEmbedConfig): string {
  return `<script>
  window.ChatAgentBoot = { key: "${cfg.widgetKey}", api: "${cfg.api}" };
</script>
<script src="${cfg.scriptUrl}" async></script>`;
}

/**
 * Snippet HTML universel (WordPress, PHP, site statique, etc.).
 * ChatAgentBoot évite les soucis avec async.
 * CORS : automatique si l'URL du site est celle enregistrée dans le dashboard.
 */
export function widgetEmbedHtml(widgetKey: string): string {
  return widgetEmbedHtmlFromConfig(getWidgetEmbedConfig(widgetKey));
}

export const WIDGET_INTEGRATION_STEPS = [
  {
    title: "Copiez le script",
    body: "Un seul bloc à installer sur tout le site — toutes les pages.",
  },
  {
    title: "Intégrez selon votre techno",
    body: "HTML/WordPress : avant </body>. Next.js/React/Vue : voir les guides ci-dessous.",
  },
  {
    title: "Publiez et testez",
    body: "La bulle apparaît en bas à droite. CORS géré automatiquement pour votre domaine.",
  },
] as const;

export type FrameworkGuide = {
  id: string;
  title: string;
  summary: string;
  code: (cfg: WidgetEmbedConfig) => string;
};

export const FRAMEWORK_GUIDES: FrameworkGuide[] = [
  {
    id: "html",
    title: "HTML / WordPress / Shopify / Wix",
    summary: "Collez le script avant la balise </body> sur toutes les pages.",
    code: (cfg) => widgetEmbedHtml(cfg.widgetKey),
  },
  {
    id: "nextjs",
    title: "Next.js (App Router)",
    summary: "Dans app/layout.tsx — le chat s'affiche sur tout le site.",
    code: ({ widgetKey, scriptUrl, api }) => `// app/layout.tsx
import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Script id="chatagent-boot" strategy="beforeInteractive">
          {\`window.ChatAgentBoot = { key: "${widgetKey}", api: "${api}" };\`}
        </Script>
        <Script src="${scriptUrl}" strategy="afterInteractive" />
      </body>
    </html>
  );
}`,
  },
  {
    id: "react",
    title: "React (Vite, CRA)",
    summary: "Dans index.html OU un useEffect dans App.tsx (une seule fois).",
    code: ({ widgetKey, scriptUrl, api }) => `// Option A — index.html (recommandé)
// Avant </body> :
${widgetEmbedHtml(widgetKey).split("\n").map((l) => "// " + l).join("\n")}

// Option B — src/App.tsx
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    window.ChatAgentBoot = { key: "${widgetKey}", api: "${api}" };
    const s = document.createElement("script");
    s.src = "${scriptUrl}";
    s.async = true;
    document.body.appendChild(s);
  }, []);
  return (/* votre app */);
}`,
  },
  {
    id: "vue",
    title: "Vue 3 (Vite)",
    summary: "Dans index.html ou onMounted dans App.vue.",
    code: ({ widgetKey, scriptUrl, api }) => `<!-- Option A — index.html, avant </body> -->
${widgetEmbedHtml(widgetKey)}

<!-- Option B — App.vue -->
<script setup>
import { onMounted } from "vue";

onMounted(() => {
  window.ChatAgentBoot = { key: "${widgetKey}", api: "${api}" };
  const s = document.createElement("script");
  s.src = "${scriptUrl}";
  s.async = true;
  document.body.appendChild(s);
});
</script>`,
  },
  {
    id: "angular",
    title: "Angular",
    summary: "Dans src/index.html avant </body>, ou AppComponent ngOnInit.",
    code: ({ widgetKey, scriptUrl, api }) => `<!-- src/index.html -->
${widgetEmbedHtml(widgetKey)}

// Ou AppComponent.ts — ngOnInit() :
// window.ChatAgentBoot = { key: "${widgetKey}", api: "${api}" };
// puis charger ${scriptUrl} dynamiquement`,
  },
  {
    id: "nuxt",
    title: "Nuxt 3",
    summary: "Plugin client ou app.vue — une seule injection.",
    code: ({ widgetKey, scriptUrl, api }) => `// plugins/chatagent.client.ts
export default defineNuxtPlugin(() => {
  if (import.meta.server) return;
  window.ChatAgentBoot = { key: "${widgetKey}", api: "${api}" };
  useHead({
    script: [{ src: "${scriptUrl}", async: true }],
  });
});`,
  },
];
