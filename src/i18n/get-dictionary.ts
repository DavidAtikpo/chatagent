import type { SiteLocale } from "./config";

export type Messages = typeof import("../../messages/fr.json");

const dictionaries: Partial<Record<SiteLocale, Messages>> = {};

export async function loadMessages(locale: SiteLocale): Promise<Messages> {
  if (dictionaries[locale]) {
    return dictionaries[locale] as Messages;
  }

  try {
    switch (locale) {
      case "fr":
        dictionaries.fr = (await import("../../messages/fr.json")).default;
        return dictionaries.fr as Messages;
      case "en":
        dictionaries.en = (await import("../../messages/en.json")).default;
        return dictionaries.en as Messages;
      case "de":
        dictionaries.de = (await import("../../messages/de.json")).default;
        return dictionaries.de as Messages;
      case "it":
        dictionaries.it = (await import("../../messages/it.json")).default;
        return dictionaries.it as Messages;
      case "es":
        dictionaries.es = (await import("../../messages/es.json")).default;
        return dictionaries.es as Messages;
      case "pt":
        dictionaries.pt = (await import("../../messages/pt.json")).default;
        return dictionaries.pt as Messages;
      default:
        break;
    }
  } catch {
    // Fichier de locale absent — repli sur le français
  }

  if (!dictionaries.fr) {
    dictionaries.fr = (await import("../../messages/fr.json")).default;
  }
  return dictionaries.fr as Messages;
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
