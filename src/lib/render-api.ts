/** API Render en production (Docker + Playwright). */
export const RENDER_API_URL = "https://chatagentapi-1.onrender.com/api/v1";

const LEGACY_RENDER_HOST = "chatagentapi.onrender.com";

/** Remplace l'ancien service Render par le nouveau si encore configuré. */
export function resolveApiUrl(raw?: string | null): string {
  const trimmed = raw?.trim().replace(/\/$/, "") ?? "";
  if (!trimmed) {
    if (process.env.VERCEL) return RENDER_API_URL;
    return "http://localhost:8000/api/v1";
  }
  if (trimmed.includes(LEGACY_RENDER_HOST) && !trimmed.includes("chatagentapi-1")) {
    return RENDER_API_URL;
  }
  return trimmed;
}

/** URL affichée dans les messages d'erreur (client). */
export function getDisplayApiHealthUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      const local = resolveApiUrl(process.env.NEXT_PUBLIC_API_URL);
      if (local.includes("localhost")) {
        return "http://localhost:8000/health (ou utilisez Render dans .env.local)";
      }
    }
  }
  return getApiHealthUrl(RENDER_API_URL);
}

export function getApiHealthUrl(apiUrl?: string): string {
  const base = resolveApiUrl(apiUrl ?? process.env.NEXT_PUBLIC_API_URL).replace(
    /\/api\/v1\/?$/,
    ""
  );
  return `${base}/health`;
}
