import { SupabaseClient } from "@supabase/supabase-js";

export async function setupAccount(
  _supabase: SupabaseClient,
  _userId: string,
  companyName: string,
  siteUrl: string
) {
  const res = await fetch("/api/setup-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName, siteUrl }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Impossible de créer l'organisation");
  }

  return data as { organizationId: string; siteId: string };
}
