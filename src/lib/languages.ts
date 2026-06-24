/** Langues supportées par l'agent — aligné avec api/app/services/languages.py */
export const SUPPORTED_LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "it", label: "Italiano" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "de", label: "Deutsch" },
] as const;

export type AgentLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["value"];

export function languageLabel(code: string | undefined): string {
  return SUPPORTED_LANGUAGES.find((l) => l.value === code)?.label ?? code ?? "Français";
}
