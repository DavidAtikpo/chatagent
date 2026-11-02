"use client";

import { WidgetChatMarkdown } from "@/lib/chat-message-display";
import { useT } from "@/i18n/context";

export function WelcomeMessagePreview({
  message,
  fallback,
  primaryColor,
}: {
  message: string;
  fallback: string;
  primaryColor: string;
}) {
  const t = useT();
  const display = message.trim() || fallback;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {t("dashboard.settings.welcomePreview")}
      </p>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-[#f4f5f7] p-3 sm:p-4">
        <div className="flex w-full items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
            style={{ background: primaryColor }}
            aria-hidden
          >
            IA
          </div>
          <div className="min-w-0 flex-1">
            <div className="max-h-[min(50vh,22rem)] overflow-y-auto overscroll-y-contain rounded-2xl rounded-tl-md bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200/80 sm:px-4 sm:py-3.5">
              <WidgetChatMarkdown content={display} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
