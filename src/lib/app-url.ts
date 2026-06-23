import { getApiHealthUrl, resolveApiUrl } from "@/lib/render-api";

/** URL publique du dashboard (liens trackés, SEO, Open Graph). */
export function getAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function trackedLinkUrl(slug: string, widgetKey: string): string {
  return `${getAppBaseUrl()}/c/${slug}?key=${widgetKey}`;
}

export function getApiBaseUrl(): string {
  return resolveApiUrl(process.env.NEXT_PUBLIC_API_URL);
}

/** URL absolue du widget.js (pour embed sur sites clients). */
export function getWidgetScriptUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WIDGET_URL?.trim();
  if (fromEnv?.startsWith("http")) return fromEnv;
  if (fromEnv) {
    const path = fromEnv.startsWith("/") ? fromEnv : `/${fromEnv}`;
    return `${getAppBaseUrl()}${path}`;
  }
  return `${getAppBaseUrl()}/widget.js`;
}

export function apiUnreachableMessage(): string {
  const api = getApiBaseUrl();
  if (api.includes("localhost")) {
    return "API inaccessible — lancez uvicorn sur le port 8000 ou définissez NEXT_PUBLIC_API_URL";
  }
  return `API inaccessible — vérifiez ${getApiHealthUrl(api)} (Render peut mettre ~1 min à démarrer)`;
}
