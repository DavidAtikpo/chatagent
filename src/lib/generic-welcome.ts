/** Placeholder / default welcomes — not treated as customized copy. */
export const GENERIC_WELCOME_TEXTS = new Set([
  "Bonjour ! Comment puis-je vous aider ?",
  "Bonjour! Comment puis-je vous aider ?",
  "Hello! How can I help you?",
  "Hello! How can I help you today?",
  "Hi! How can I help you?",
]);

export function isGenericWelcomeMessage(text: string | null | undefined): boolean {
  const cleaned = (text ?? "").trim();
  if (!cleaned) return true;
  return GENERIC_WELCOME_TEXTS.has(cleaned);
}
