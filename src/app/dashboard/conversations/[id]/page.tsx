"use client";

import { formatDate, normalizeRelation, statusBadge } from "@/lib/dashboard-data";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

type ConversationDetail = {
  id: string;
  status: string;
  lead_score: number;
  page_url: string | null;
  qualification_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  sites: { name: string; url: string } | null;
  leads: { id: string; name: string | null; email: string | null; phone: string | null; score: number }[] | null;
};

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/dashboard/conversations/${params.id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Conversation introuvable.");
        setLoading(false);
        return;
      }
      setConversation(data.conversation as ConversationDetail);
      setMessages(data.messages ?? []);
      setError(null);
    } catch {
      setError("Conversation introuvable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  if (error || !conversation) {
    return (
      <div>
        <Link href="/dashboard/conversations" className="text-sm text-brand-600 hover:underline">
          ← Retour
        </Link>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const lead = normalizeRelation(conversation.leads);
  const site = normalizeRelation(conversation.sites);

  return (
    <div>
      <Link href="/dashboard/conversations" className="text-sm text-brand-600 hover:underline">
        ← Conversations
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{site?.name ?? "Conversation"}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Démarrée le {formatDate(conversation.created_at)} · MAJ {formatDate(conversation.updated_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(conversation.status)}`}>
            {conversation.status}
          </span>
          <span className="text-base font-bold text-brand-600">{conversation.lead_score}/100</span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <h2 className="text-sm font-semibold text-slate-700">Transcript</h2>
            {messages.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Aucun message.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {messages.map((msg) => (
                  <li
                    key={msg.id}
                    className={`rounded-md px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "ml-0 bg-brand-50 text-brand-900 sm:ml-8"
                        : msg.role === "human"
                          ? "mr-0 bg-blue-50 text-blue-900 sm:mr-8"
                          : "mr-0 bg-slate-100 text-slate-800 sm:mr-8"
                    }`}
                  >
                    <p className="text-xs font-medium uppercase text-slate-500">
                      {msg.role === "user"
                        ? "Visiteur"
                        : msg.role === "human"
                          ? "Conseiller"
                          : "Agent"}{" "}
                      · {formatDate(msg.created_at)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{msg.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {lead && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <h2 className="text-sm font-semibold">Lead associé</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Nom</dt>
                  <dd>{lead.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd>{lead.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Téléphone</dt>
                  <dd>{lead.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Score</dt>
                  <dd className="font-bold text-brand-600">{lead.score}/100</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <h2 className="text-sm font-semibold">Contexte</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Page d&apos;origine</dt>
                <dd className="break-all">{conversation.page_url ?? "—"}</dd>
              </div>
              {conversation.qualification_data && Object.keys(conversation.qualification_data).length > 0 && (
                <div>
                  <dt className="text-xs text-slate-500">Qualification</dt>
                  <dd className="mt-1 rounded bg-slate-50 p-2 text-xs">
                    <pre>{JSON.stringify(conversation.qualification_data, null, 2)}</pre>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
