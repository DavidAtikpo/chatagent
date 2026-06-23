import { resolveApiUrl } from "@/lib/render-api";

/** URL de l'API Python (Render / local) — usage serveur Next.js. */
export function getBackendApiUrl(): string {
  return resolveApiUrl(process.env.NEXT_PUBLIC_API_URL);
}
