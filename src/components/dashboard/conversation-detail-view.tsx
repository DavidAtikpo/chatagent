"use client";

import { HandoffAdvisorControls } from "@/components/dashboard/handoff-advisor-controls";
import { DashboardPanel } from "@/components/dashboard/dashboard-tabs";
import { useT } from "@/i18n/context";
import { useDashboardLabels } from "@/i18n/use-dashboard-labels";
import { AI_ASSISTANT_AVATAR_PATH } from "@/lib/branding";
import { ChatMessageContent } from "@/lib/chat-message-display";
import { formatDate, statusBadge } from "@/lib/dashboard-data";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

const SCROLL_PIN_THRESHOLD_PX = 80;

function isPinnedToBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_PIN_THRESHOLD_PX;
}

export type ConversationMessage = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export type ConversationDetailData = {
  id: string;
  status: string;
  lead_score: number;
  page_url: string | null;
  handoff_status?: string | null;
  handoff_reason?: string | null;
  assigned_agent_id?: string | null;
  qualification_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  sites: { name: string; url: string } | null;
  leads:
    | { id: string; name: string | null; email: string | null; phone: string | null; score: number }[]
    | { id: string; name: string | null; email: string | null; phone: string | null; score: number }
    | null;
};

function formatMessageTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function qualificationRows(data: Record<string, unknown> | null): { key: string; value: string }[] {
  if (!data) return [];
  return Object.entries(data).map(([key, value]) => ({
    key,
    value:
      value === null || value === undefined
        ? "—"
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value),
  }));
}

function MessageAvatar({ role }: { role: string }) {
  if (role === "user") {
    return (
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800"
        aria-hidden
      >
        V
      </div>
    );
  }
  if (role === "human") {
    return (
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800"
        aria-hidden
      >
        C
      </div>
    );
  }
  return (
    <Image
      src={AI_ASSISTANT_AVATAR_PATH}
      alt=""
      width={32}
      height={32}
      className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
    />
  );
}

function MessageBubble({
  message,
  roleLabel,
}: {
  message: ConversationMessage;
  roleLabel: string;
}) {
  const isUser = message.role === "user";
  const isHuman = message.role === "human";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <MessageAvatar role={message.role} />
      <div
        className={`min-w-0 max-w-[min(100%,28rem)] rounded-2xl px-3 py-2 shadow-sm ${
          isUser
            ? "bg-brand-600 text-white"
            : isHuman
              ? "bg-blue-50 text-blue-950 ring-1 ring-blue-100"
              : "bg-white text-slate-800 ring-1 ring-slate-200"
        }`}
      >
        <p
          className={`text-[10px] font-medium uppercase tracking-wide ${
            isUser ? "text-brand-100" : "text-slate-500"
          }`}
        >
          {roleLabel} · {formatMessageTime(message.created_at)}
        </p>
        <ChatMessageContent content={message.content} role={message.role} />
      </div>
    </div>
  );
}

export function ConversationDetailView({
  conversation,
  messages,
  site,
  lead,
  onRefresh,
}: {
  conversation: ConversationDetailData;
  messages: ConversationMessage[];
  site: { name: string; url: string } | null;
  lead: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    score: number;
  } | null;
  onRefresh?: () => void | Promise<void>;
}) {
  const t = useT();
  const { statusLabel } = useDashboardLabels();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottomRef = useRef(true);
  const prevLastMessageIdRef = useRef<string | null>(null);

  const onThreadScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedToBottomRef.current = isPinnedToBottom(el);
  }, []);

  useEffect(() => {
    pinnedToBottomRef.current = true;
    prevLastMessageIdRef.current = null;
  }, [conversation.id]);

  const roleLabel = (role: string) => {
    if (role === "user") return t("dashboard.conversations.visitor");
    if (role === "human") return t("dashboard.conversations.advisor");
    return t("dashboard.conversations.detail.agent");
  };

  const qualRows = qualificationRows(conversation.qualification_data);

  const threadHeaderMeta = (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
      <div className="min-w-0 sm:col-span-2 lg:col-span-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {t("dashboard.conversations.detail.started")}
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-900">
          {formatDate(conversation.created_at)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {t("dashboard.conversations.status")}
        </p>
        <p className="mt-0.5">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(conversation.status)}`}
          >
            {statusLabel(conversation.status)}
          </span>
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {t("dashboard.conversations.detail.score")}
        </p>
        <p className="mt-0.5 text-xs font-semibold tabular-nums text-slate-900">
          {conversation.lead_score}
          <span className="font-normal text-slate-400">/100</span>
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {t("dashboard.conversations.detail.messages")}
        </p>
        <p className="mt-0.5 text-xs font-semibold tabular-nums text-slate-900">{messages.length}</p>
      </div>
      <div className="min-w-0 col-span-2 sm:col-span-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {t("dashboard.conversations.detail.lastUpdate")}
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-900">{formatDate(conversation.updated_at)}</p>
      </div>
    </div>
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || messages.length === 0) return;

    const lastId = messages[messages.length - 1]?.id ?? null;
    const isFirstPaint = prevLastMessageIdRef.current === null;

    if (isFirstPaint || pinnedToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      pinnedToBottomRef.current = true;
    }

    prevLastMessageIdRef.current = lastId;
  }, [messages]);

  return (
    <div className="space-y-3">
      <Link
        href="/dashboard/conversations"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        <span aria-hidden>←</span>
        {t("dashboard.conversations.detail.back")}
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="min-w-0 flex-1 text-lg font-bold text-slate-900 sm:text-xl">
          {site?.name ?? t("dashboard.overview.siteFallback")}
        </h1>
        {conversation.handoff_status === "requested" || conversation.handoff_status === "active" ? (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-900 sm:px-3 sm:py-1 sm:text-xs">
            {t(
              `dashboard.inbox.status.${conversation.handoff_status}` as "dashboard.inbox.status.requested"
            )}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-3 lg:items-start">
        <DashboardPanel
          title={t("dashboard.conversations.detail.transcript")}
          headerExtra={threadHeaderMeta}
          className="flex min-h-0 flex-col sm:min-h-[min(75vh,36rem)] lg:col-span-2"
        >
          {(() => {
            const thread =
              messages.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  {t("dashboard.conversations.detail.noMessages")}
                </p>
              ) : (
                <div
                  ref={scrollRef}
                  onScroll={onThreadScroll}
                  className="max-h-[min(58vh,26rem)] space-y-3 overflow-y-auto overscroll-y-contain rounded-lg bg-slate-50/90 p-2.5 ring-1 ring-slate-100 sm:max-h-[min(62vh,32rem)] sm:p-3"
                >
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} roleLabel={roleLabel(msg.role)} />
                  ))}
                </div>
              );

            if (onRefresh) {
              return (
                <HandoffAdvisorControls
                  conversationId={conversation.id}
                  handoffStatus={conversation.handoff_status}
                  onUpdated={onRefresh}
                >
                  {thread}
                </HandoffAdvisorControls>
              );
            }
            return thread;
          })()}
        </DashboardPanel>

        <div className="space-y-2">
          {lead ? (
            <DashboardPanel
              collapsible
              defaultOpen
              title={t("dashboard.conversations.detail.associatedLead")}
              action={
                <Link
                  href="/dashboard/leads"
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  {t("dashboard.conversations.detail.viewLead")}
                </Link>
              }
            >
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-slate-500">{t("dashboard.conversations.detail.name")}</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{lead.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">{t("dashboard.conversations.detail.email")}</dt>
                  <dd className="mt-0.5 break-all text-slate-800">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="text-brand-600 hover:underline">
                        {lead.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">{t("dashboard.conversations.detail.phone")}</dt>
                  <dd className="mt-0.5 text-slate-800">{lead.phone ?? "—"}</dd>
                </div>
                <div className="rounded-lg bg-brand-50 px-3 py-2 ring-1 ring-brand-100">
                  <dt className="text-xs font-medium text-brand-800">{t("dashboard.conversations.detail.score")}</dt>
                  <dd className="text-2xl font-bold text-brand-900">{lead.score}/100</dd>
                </div>
              </dl>
            </DashboardPanel>
          ) : null}

          <DashboardPanel
            collapsible
            defaultOpen={false}
            title={t("dashboard.conversations.detail.context")}
          >
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500">
                  {t("dashboard.conversations.detail.originPage")}
                </dt>
                <dd className="mt-0.5 break-all text-slate-800">
                  {conversation.page_url ? (
                    <a
                      href={conversation.page_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      {conversation.page_url}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
                {conversation.page_url ? (
                  <a
                    href={conversation.page_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-brand-700 hover:underline"
                  >
                    {t("dashboard.conversations.detail.openPage")} →
                  </a>
                ) : null}
              </div>

              {qualRows.length > 0 ? (
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {t("dashboard.conversations.detail.qualification")}
                  </dt>
                  <ul className="mt-2 space-y-2">
                    {qualRows.map((row) => (
                      <li
                        key={row.key}
                        className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2 text-xs"
                      >
                        <span className="font-medium text-slate-700">{row.key}</span>
                        <p className="mt-0.5 break-words text-slate-600">{row.value}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </dl>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}

export function ConversationDetailSkeleton() {
  const t = useT();
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-40 rounded bg-slate-200" />
      <div className="h-8 w-64 rounded bg-slate-200" />
      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-md bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-80 rounded-lg bg-slate-100 lg:col-span-2" />
        <div className="h-48 rounded-lg bg-slate-100" />
      </div>
      <p className="sr-only">{t("common.loading")}</p>
    </div>
  );
}
