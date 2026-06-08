/** URL de l'API Python (Render / local) — usage serveur Next.js. */
export function getBackendApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000/api/v1";
  return url.replace(/\/$/, "");
}
