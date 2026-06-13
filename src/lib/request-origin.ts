/** Origin public (https://domaine.tld) depuis une requête Next.js / Vercel. */
export function getOriginFromRequest(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    if (host) return `${forwardedProto}://${host}`;
  }

  const host = request.headers.get("host");
  if (host) {
    const proto = host.startsWith("localhost") ? "http" : forwardedProto;
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

/** Base URL pour les redirects Supabase Auth (priorité à la requête en prod). */
export function getAuthBaseUrl(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

  if (request) {
    const fromRequest = getOriginFromRequest(request);
    if (!fromRequest.includes("localhost")) return fromRequest;
    if (fromEnv) return fromEnv;
    return fromRequest;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  if (fromEnv) return fromEnv;
  return "http://localhost:3000";
}
