export const SAAS_NAME = "Yayra";
/** App mobile conseillers (stores) */
export const MOBILE_APP_NAME = `${SAAS_NAME} Conseiller`;
export const SAAS_LOGO_PATH = "/logochatagent.png";
/** Avatar IA par défaut dans le widget chat (en-tête + message d'accueil). */
export const AI_ASSISTANT_AVATAR_PATH = "/ia-assistant.png";
/** Incrémenter pour forcer le rechargement du widget.js chez les visiteurs. */
export const WIDGET_SCRIPT_VERSION = "16";
export const SAAS_ICON_VERSION = "3";

/** Couleurs extraites du logo (texte or + fond noir) */
export const BRAND_COLORS = {
  gold: "#D4A83A",
  goldLight: "#E8C96A",
  goldDark: "#A67A22",
  goldDeep: "#8A6318",
  cream: "#FDF8ED",
  creamMuted: "#FAF0D4",
  black: "#0A0A0A",
  white: "#F5F5F5",
} as const;

/** Tailles logo (px) par contexte */
export const LOGO_SIZE = {
  header: 56,
  auth: 88,
  sidebar: 48,
} as const;

import { getAppBaseUrl } from "@/lib/app-url";

export function saasLogoUrl(baseUrl?: string): string {
  const base = (baseUrl || getAppBaseUrl()).replace(/\/$/, "");
  return `${base}${AI_ASSISTANT_AVATAR_PATH}`;
}
