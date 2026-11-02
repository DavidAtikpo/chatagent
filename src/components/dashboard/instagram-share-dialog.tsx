"use client";

import { useT } from "@/i18n/context";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { useEffect, useRef, useState } from "react";

const INSTAGRAM_CREATE = "https://www.instagram.com/create/select/";

type Props = {
  open: boolean;
  shareText: string;
  onClose: () => void;
};

export function InstagramShareDialog({ open, shareText, onClose }: Props) {
  const t = useT();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const [nativeShareOk, setNativeShareOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open) return;
    setCopyState("idle");
    setNativeShareOk(null);
    void copyToClipboard(shareText).then((ok) => setCopyState(ok ? "ok" : "fail"));
    const id = window.setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
    return () => window.clearTimeout(id);
  }, [open, shareText]);

  if (!open) return null;

  async function copyAgain() {
    const ok = await copyToClipboard(shareText);
    setCopyState(ok ? "ok" : "fail");
  }

  function openCreatePost() {
    window.open(INSTAGRAM_CREATE, "_blank", "noopener,noreferrer");
  }

  async function tryNativeShare() {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      setNativeShareOk(false);
      return;
    }
    const lines = shareText.split("\n");
    const urlLine = lines.find((l) => /^https?:\/\//i.test(l.trim())) ?? "";
    const textPart = lines.filter((l) => l !== urlLine).join("\n").trim();
    try {
      const payload: ShareData = {
        title: t("dashboard.links.shareInstagramDialogTitle"),
        text: textPart || shareText,
      };
      if (urlLine) payload.url = urlLine;
      if (navigator.canShare && !navigator.canShare(payload)) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.share(payload);
      }
      setNativeShareOk(true);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setNativeShareOk(false);
    }
  }

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ig-share-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ig-share-title" className="text-base font-semibold text-slate-900">
          {t("dashboard.links.shareInstagramDialogTitle")}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{t("dashboard.links.shareInstagramDialogBody")}</p>

        <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-slate-600">
          {[1, 2, 3, 4].map((n) => (
            <li key={n}>{t(`dashboard.links.shareInstagramStep${n}` as "dashboard.links.shareInstagramStep1")}</li>
          ))}
        </ol>

        <label className="mt-3 block text-xs font-medium text-slate-700">
          {t("dashboard.links.shareInstagramTextLabel")}
        </label>
        <textarea
          ref={textareaRef}
          readOnly
          rows={5}
          value={shareText}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
        />

        {copyState !== "idle" ? (
          <p className="mt-1 text-xs text-slate-500" role="status">
            {copyState === "ok"
              ? t("dashboard.links.shareInstagramCopiedShort")
              : t("dashboard.links.shareCopyFailed")}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyAgain()}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            {t("dashboard.links.shareInstagramCopyBtn")}
          </button>
          <button
            type="button"
            onClick={openCreatePost}
            className="rounded-md bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-3 py-1.5 text-sm font-medium text-white hover:opacity-95"
          >
            {t("dashboard.links.shareInstagramOpenCreate")}
          </button>
          {canNativeShare ? (
            <button
              type="button"
              onClick={() => void tryNativeShare()}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              {t("dashboard.links.shareInstagramNativeShare")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            {t("dashboard.links.shareDismiss")}
          </button>
        </div>
        {nativeShareOk === true ? (
          <p className="mt-2 text-xs text-emerald-700">{t("dashboard.links.shareInstagramShared")}</p>
        ) : null}
        {nativeShareOk === false ? (
          <p className="mt-2 text-xs text-slate-500">{t("dashboard.links.shareInstagramNativeFailed")}</p>
        ) : null}
      </div>
    </div>
  );
}
