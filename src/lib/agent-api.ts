import { createSessionToken, type SessionUser } from "@/lib/auth/session";
import { resolveApiUrl } from "@/lib/render-api";

function agentBaseUrl(): string {
  return `${resolveApiUrl(process.env.NEXT_PUBLIC_API_URL)}/agent`;
}

/** Appels API conseiller (même backend que l'app mobile Yayra Conseiller). */
export async function agentApiFetch(
  session: SessionUser,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const token = await createSessionToken(session);
  const url = `${agentBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...init, headers, cache: "no-store" });
}
