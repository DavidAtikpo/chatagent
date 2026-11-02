"use client";

import {
  ConversationDetailSkeleton,
  ConversationDetailView,
  type ConversationDetailData,
  type ConversationMessage,
} from "@/components/dashboard/conversation-detail-view";
import { DashboardPanel } from "@/components/dashboard/dashboard-tabs";
import { useT } from "@/i18n/context";
import { normalizeRelation } from "@/lib/dashboard-data";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  const t = useT();
  const [conversation, setConversation] = useState<ConversationDetailData | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/dashboard/conversations/${params.id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("dashboard.conversations.notFound"));
        setLoading(false);
        return;
      }
      setConversation(data.conversation as ConversationDetailData);
      setMessages(data.messages ?? []);
      setError(null);
    } catch {
      setError(t("dashboard.conversations.notFound"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const poll = window.setInterval(() => void load(), 4000);
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation-${params.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${params.id}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${params.id}` },
        () => load()
      )
      .subscribe();

    return () => {
      window.clearInterval(poll);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return <ConversationDetailSkeleton />;
  }

  if (error || !conversation) {
    return (
      <div className="space-y-3">
        <Link
          href="/dashboard/conversations"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
        >
          ← {t("dashboard.conversations.detail.back")}
        </Link>
        <DashboardPanel title={t("dashboard.conversations.notFound")}>
          <p className="text-sm text-red-600">{error ?? t("dashboard.conversations.notFound")}</p>
        </DashboardPanel>
      </div>
    );
  }

  const lead = normalizeRelation(conversation.leads);
  const site = normalizeRelation(conversation.sites);

  return (
    <ConversationDetailView
      conversation={conversation}
      messages={messages}
      site={site}
      lead={lead}
      onRefresh={load}
    />
  );
}
