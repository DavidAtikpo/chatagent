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

export function getApiHealthUrl(apiUrl?: string): string {
  const base = resolveApiUrl(apiUrl ?? process.env.NEXT_PUBLIC_API_URL).replace(
    /\/api\/v1\/?$/,
    ""
  );
  return `${base}/health`;
}
