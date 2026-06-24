"use client";

import { BrandLogo } from "@/components/brand-logo";
import { useT } from "@/i18n/context";
import { LOGO_SIZE } from "@/lib/branding";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const t = useT();
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
      setError(data.error ?? t("auth.forgotPassword.sendFailed"));
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
        <h1 className="mt-6 text-center text-2xl font-bold">{t("auth.forgotPassword.title")}</h1>
        <p className="mt-2 text-center text-sm text-slate-500">{t("auth.forgotPassword.subtitle")}</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              {t("auth.forgotPassword.sentBody", { email })}
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
              {t("auth.forgotPassword.gmailHint")}
            </div>
            <Link
              href="/login"
              className="block w-full rounded-lg border border-slate-200 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("auth.forgotPassword.backToLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t("common.email")}</label>
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
              {loading ? t("auth.forgotPassword.submitting") : t("auth.forgotPassword.submit")}
            </button>
          </form>
        )}

        {!sent && (
          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/login" className="text-brand-600 hover:underline">
              ← {t("auth.forgotPassword.backToLogin")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
