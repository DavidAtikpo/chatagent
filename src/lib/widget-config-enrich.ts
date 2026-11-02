import { AI_ASSISTANT_AVATAR_PATH } from "@/lib/branding";

const LOCAL_HOST = /localhost|127\.0\.0\.1/i;

/** Complète la config widget renvoyée par l'API (compat anciennes versions). */
export function enrichWidgetConfig(
  config: Record<string, unknown>,
  appOrigin: string
): Record<string, unknown> {
  const base = appOrigin.replace(/\/$/, "");
  const defaultAvatar = `${base}${AI_ASSISTANT_AVATAR_PATH}`;
  const current = typeof config.assistant_avatar_url === "string" ? config.assistant_avatar_url : "";
  const next = { ...config };

  if (!current || (LOCAL_HOST.test(current) && !LOCAL_HOST.test(base))) {
    next.assistant_avatar_url = defaultAvatar;
  }

  // En-tête widget : logo entreprise (paramètres). Ne pas confondre avec l'avatar IA du message d'accueil.
  return next;
}
