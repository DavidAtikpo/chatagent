"use client";

import { setupAccount } from "@/lib/setup-account";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function SetupOrganizationForm({ onComplete }: { onComplete: () => void | Promise<void> }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function prefill() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const meta = user.user_metadata ?? {};
      if (meta.company_name) setName(String(meta.company_name));
      if (meta.site_url) setUrl(String(meta.site_url));
    }
    prefill();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Session expirée — reconnectez-vous.");
        return;
      }

      await setupAccount(supabase, user.id, name, url);
      await onComplete();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : "Impossible de créer l'organisation";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">Finalisez votre compte</h1>
      <p className="mt-2 text-sm text-slate-600">
        Votre compte existe mais l&apos;organisation n&apos;a pas encore été créée. Entrez les
        informations de votre entreprise pour continuer.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nom de l&apos;entreprise</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">URL du site</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://monsite.com"
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Création en cours..." : "Créer mon organisation"}
        </button>
      </form>
    </div>
  );
}
