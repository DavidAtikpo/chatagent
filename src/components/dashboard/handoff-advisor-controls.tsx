"use client";

import { useT } from "@/i18n/context";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

type Props = {
  conversationId: string;
  handoffStatus: string | null | undefined;
  onUpdated: () => void | Promise<void>;
  /** Contenu entre l'en-tête handoff et la zone de saisie (fil de messages). */
  children?: ReactNode;
};

/** Même logique que l'app mobile : claim → chat humain → release. */
export function HandoffAdvisorControls({
  conversationId,
  handoffStatus,
  onUpdated,
  children,
}: Props) {
  const t = useT();
  const router = useRouter();
  const status = handoffStatus ?? "none";
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canClaim = status === "requested";
  const canReply = status === "active";
  const showHandoff = status === "requested" || status === "active";

  if (!showHandoff) {
    return children ? <>{children}</> : null;
  }

  async function claim() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/agent/conversations/${conversationId}/claim`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("dashboard.inbox.claimFailed"));
      await onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.inbox.claimFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function release() {
    if (!confirm(t("dashboard.inbox.releaseConfirm"))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/agent/conversations/${conversationId}/release`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("dashboard.inbox.releaseFailed"));
      await onUpdated();
      router.push("/dashboard/conversations");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.inbox.releaseFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !canReply) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/agent/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("dashboard.inbox.sendFailed"));
      setDraft("");
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.inbox.sendFailed"));
    } finally {
      setBusy(false);
    }
  }

  const header = (
    <>
      {canClaim ? (
        <div className="flex flex-col gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-900">{t("dashboard.inbox.claimHint")}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void claim()}
            className="shrink-0 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? t("dashboard.inbox.claiming") : t("dashboard.inbox.claimBtn")}
          </button>
        </div>
      ) : null}

      {canReply ? (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => void release()}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {t("dashboard.inbox.releaseBtn")}
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}
    </>
  );

  const composer = canReply ? (
    <form
      onSubmit={(e) => void send(e)}
      className="flex flex-col gap-2 border-t border-slate-200 bg-white pt-3 sm:flex-row sm:items-end"
    >
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        placeholder={t("dashboard.inbox.messagePlaceholder")}
        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      <button
        type="submit"
        disabled={busy || !draft.trim()}
        className="shrink-0 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 sm:min-w-[6.5rem]"
      >
        {busy ? t("dashboard.inbox.sending") : t("dashboard.inbox.sendBtn")}
      </button>
    </form>
  ) : canClaim ? (
    <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">{t("dashboard.inbox.replyLocked")}</p>
  ) : null;

  if (!children) {
    return (
      <div className="space-y-3">
        {header}
        {composer}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      {header}
      <div className="min-h-0 flex-1">{children}</div>
      {composer}
    </div>
  );
}
