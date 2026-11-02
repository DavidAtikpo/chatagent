"use client";

import { WidgetChatMarkdown } from "@/lib/chat-message-display";
import { useT } from "@/i18n/context";

export function KnowledgeDescriptionPreview({ content }: { content: string }) {
  const t = useT();
  const trimmed = content.trim();
  if (!trimmed) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 ring-1 ring-slate-100">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {t("dashboard.sites.knowledge.descriptionPreview")}
      </p>
      <div className="mt-2 max-h-[min(50vh,22rem)] overflow-y-auto overscroll-y-contain rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm leading-relaxed sm:px-4 sm:py-3.5">
        <WidgetChatMarkdown content={trimmed} />
      </div>
    </div>
  );
}
