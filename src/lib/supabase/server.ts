import { getSession } from "@/lib/auth/session";

/** Compat layer — remplace @supabase/ssr pour les routes encore en migration. */
export function createClient() {
  return {
    auth: {
      async getUser() {
        const user = await getSession();
        if (!user) {
          return { data: { user: null }, error: null };
        }
        return {
          data: {
            user: {
              id: user.id,
              email: user.email,
              user_metadata: {},
            },
          },
          error: null,
        };
      },
      async updateUser() {
        return { data: { user: null }, error: null };
      },
      async resetPasswordForEmail(_email: string, _options?: { redirectTo?: string }) {
        // TODO: envoi email reset via Neon (password_reset_tokens)
        return { data: {}, error: null as { message: string } | null };
      },
    },
  };
}
