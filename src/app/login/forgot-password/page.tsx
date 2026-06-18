"use client";

import { BrandLogo } from "@/components/brand-logo";
import { LOGO_SIZE } from "@/lib/branding";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      setError(data.error ?? "Impossible d'envoyer l'email. Réessayez plus tard.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex justify-center">
          <BrandLogo
            href="/"
            size={LOGO_SIZE.auth}
            showName={false}
            className="flex-col gap-2"
          />
        </div>
        <h1 className="mt-6 text-center text-2xl font-bold">Mot de passe oublié</h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Entrez votre email — nous vous enverrons un lien pour choisir un nouveau mot de passe.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              Si un compte existe pour <strong>{email}</strong>, un email vient d&apos;être envoyé.
              Vérifiez aussi vos spams.
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <strong>Gmail :</strong> consultez aussi l&apos;onglet <em>Promotions</em> et la
              recherche « Supabase » ou « Reset password ». Les emails d&apos;auth Supabase sont
              parfois filtrés par Gmail.
            </div>
            <Link
              href="/login"
              className="block w-full rounded-lg border border-slate-200 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500"
                required
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>
          </form>
        )}

        {!sent && (
          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/login" className="text-brand-600 hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
