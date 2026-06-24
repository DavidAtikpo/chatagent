"use client";

import { BrandLogo } from "@/components/brand-logo";
import { useT } from "@/i18n/context";
import { LOGO_SIZE } from "@/lib/branding";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const t = useT();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(!!session);
        setCheckingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
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
        <h1 className="mt-6 text-center text-2xl font-bold">{t("auth.resetPassword.title")}</h1>

        {checkingSession ? (
          <p className="mt-6 text-center text-sm text-slate-500">{t("auth.resetPassword.checking")}</p>
        ) : !hasSession ? (
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
            <Link
              href="/login"
              className="block text-center text-sm text-brand-600 hover:underline"
            >
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
      </div>
    </div>
  );
}
