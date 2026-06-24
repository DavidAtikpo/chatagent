import type { SiteLocale } from "./config";

export type Messages = typeof import("../../messages/fr.json");

const dictionaries: Partial<Record<SiteLocale, Messages>> = {};

async function loadFr(): Promise<Messages> {
  if (!dictionaries.fr) {
    dictionaries.fr = (await import("../../messages/fr.json")).default;
  }
  return dictionaries.fr as Messages;
}

/** Fusionne la locale sur le français pour les clés manquantes */
function deepMerge(base: unknown, overlay: unknown): unknown {
  if (overlay == null) return base;
  if (base == null) return overlay;
  if (Array.isArray(overlay)) return overlay.length ? overlay : base;
  if (typeof overlay !== "object" || typeof base !== "object") return overlay;

  const result = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(overlay as Record<string, unknown>)) {
    result[key] = deepMerge((base as Record<string, unknown>)[key], value);
  }
  return result;
}

export async function loadMessages(locale: SiteLocale): Promise<Messages> {
  if (dictionaries[locale]) {
    return dictionaries[locale] as Messages;
  }

  const fr = await loadFr();

  try {
    let loaded: Messages;
    switch (locale) {
      case "fr":
        return fr;
      case "en":
        loaded = (await import("../../messages/en.json")).default as Messages;
        break;
      case "de":
        loaded = (await import("../../messages/de.json")).default as Messages;
        break;
      case "it":
        loaded = (await import("../../messages/it.json")).default as Messages;
        break;
      case "es":
        loaded = (await import("../../messages/es.json")).default as Messages;
        break;
      case "pt":
        loaded = (await import("../../messages/pt.json")).default as Messages;
        break;
      default:
        return fr;
    }
    dictionaries[locale] = deepMerge(fr, loaded) as Messages;
    return dictionaries[locale] as Messages;
  } catch {
    return fr;
  }
}

/** Résout une clé pointée : "home.hero.title" */
export function resolveMessage(obj: unknown, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

/** Remplace {name} dans les chaînes */
export function formatMessage(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`
  );
}
