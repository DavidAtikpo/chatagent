"use client";

type AuthUser = { id: string; email: string; user_metadata: Record<string, unknown> };

async function fetchSessionUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/session", { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email,
    user_metadata: {},
  };
}

/** Compat client — remplace Supabase Auth côté navigateur. */
export function createClient() {
  return {
    auth: {
      async getUser() {
        const user = await fetchSessionUser();
        return { data: { user }, error: null };
      },
      async getSession() {
        const user = await fetchSessionUser();
        return { data: { session: user ? { user } : null }, error: null };
      },
      onAuthStateChange(_callback: (event: string, session: unknown) => void) {
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { data: { user: null, session: null }, error: { message: data.error ?? "Erreur" } };
        }
        const user = await fetchSessionUser();
        return { data: { user, session: user ? {} : null }, error: null };
      },
      async signUp({
        email,
        password,
        options,
      }: {
        email: string;
        password: string;
        options?: { data?: Record<string, unknown>; emailRedirectTo?: string };
      }) {
        const meta = options?.data ?? {};
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            companyName: meta.company_name,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { data: { user: null, session: null }, error: { message: data.error ?? "Erreur" } };
        }
        const user = await fetchSessionUser();
        return { data: { user, session: user ? {} : null }, error: null };
      },
      async signOut() {
        await fetch("/api/auth/logout", { method: "POST" });
        return { error: null };
      },
      async updateUser(_body?: { password?: string }) {
        return { data: { user: null }, error: null as { message: string } | null };
      },
      async exchangeCodeForSession() {
        return { data: { session: null }, error: null };
      },
    },
    channel(_name: string) {
      const ch = {
        on(_event: string, _filter: unknown, _callback: () => void) {
          return ch;
        },
        subscribe() {
          return ch;
        },
      };
      return ch;
    },
    removeChannel(_channel: unknown) {
      return { error: null };
    },
  };
}
