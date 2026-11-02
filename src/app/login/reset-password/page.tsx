"use client";

import { AuthPageCard, AuthPageShell } from "@/components/auth-page-shell";
import { BrandLogo } from "@/components/brand-logo";
import { useT } from "@/i18n/context";
import { LOGO_SIZE } from "@/lib/branding";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const t = useT();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setCheckingToken(false);
      setTokenValid(false);
      return;
    }
    fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => setTokenValid(Boolean(data.valid)))
      .catch(() => setTokenValid(false))
      .finally(() => setCheckingToken(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("auth.resetPassword.passwordMin"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.resetPassword.passwordMismatch"));
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? t("auth.resetPassword.failed"));
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/dashboard/add-profile");
      router.refresh();
    }, 1500);
  }

  return (
    <AuthPageShell>
      <AuthPageCard>
        <div className="flex justify-center">
          <BrandLogo href="/" size={LOGO_SIZE.auth} showName={false} className="flex-col gap-2" />
        </div>
        <h1 className="mt-6 text-center text-xl font-bold sm:text-2xl">{t("auth.resetPassword.title")}</h1>

        {checkingToken ? (
          <p className="mt-6 text-center text-sm text-slate-500">{t("auth.resetPassword.checking")}</p>
        ) : !tokenValid ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t("auth.resetPassword.invalidLink")}
            </div>
            <Link
              href="/login/forgot-password"
              className="block w-full rounded-lg bg-brand-600 py-3 text-center font-semibold text-white hover:bg-brand-700"
            >
              {t("auth.resetPassword.forgotLink")}
            </Link>
            <Link href="/login" className="block text-center text-sm text-brand-600 hover:underline">
              {t("auth.forgotPassword.backToLogin")}
            </Link>
          </div>
        ) : done ? (
          <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-center text-sm text-green-800">
            {t("auth.resetPassword.success")}
          </div>
        ) : (
          <>
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {t("auth.resetPassword.newPassword")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {t("auth.resetPassword.confirmPassword")}
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? t("auth.resetPassword.submitting") : t("auth.resetPassword.submit")}
              </button>
            </form>
          </>
        )}
      </AuthPageCard>
    </AuthPageShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthPageShell>
          <AuthPageCard>
            <p className="text-center text-sm text-slate-500">…</p>
          </AuthPageCard>
        </AuthPageShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
