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
