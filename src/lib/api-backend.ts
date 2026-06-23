/** URL de l'API Python (Render / local) — usage serveur Next.js. */
export function getBackendApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (process.env.VERCEL) return "https://chatagentapi-1.onrender.com/api/v1";
  return "http://localhost:8000/api/v1";
}
