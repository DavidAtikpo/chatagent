import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { getBackendApiUrl } from "@/lib/api-backend";
import { cookies } from "next/headers";

export async function billingApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });
  }
  const user = await verifySessionToken(token);
  if (!user) {
    return new Response(JSON.stringify({ error: "Session expirée" }), { status: 401 });
  }

  const api = getBackendApiUrl();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${api}/${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
