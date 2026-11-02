export async function ensureOrganization(_supabase: unknown) {
  const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
  const sessionData = await sessionRes.json();
  const user = sessionData.user
    ? { id: sessionData.user.id, email: sessionData.user.email, user_metadata: {} }
    : null;
  if (!user) return { user: null, organization: null };

  const orgRes = await fetch("/api/organization", { cache: "no-store" });
  if (!orgRes.ok) return { user, organization: null };
  const data = await orgRes.json();
  return { user, organization: data.organization ?? null };
}
