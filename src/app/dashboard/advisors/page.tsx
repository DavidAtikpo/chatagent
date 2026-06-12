"use client";

import { useOrganization } from "@/hooks/use-organization";
import { useCallback, useEffect, useState } from "react";

type Member = {
  id: string;
  user_id: string;
  role: string;
  display_name: string | null;
  is_available: boolean;
  site_id: string | null;
  site_name?: string | null;
  email?: string | null;
  created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Admin",
  agent: "Conseiller",
};

export default function AdvisorsPage() {
  const { organization, sites, loading: orgLoading } = useOrganization();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (sites.length && !siteId) setSiteId(sites[0].id);
  }, [sites, siteId]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/organization/members");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chargement impossible");
      setMembers(data.members ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (organization) void loadMembers();
  }, [organization, loadMembers]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/organization/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          display_name: displayName.trim() || undefined,
          site_id: siteId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ajout impossible");
      setEmail("");
      setDisplayName("");
      setSuccess(
        data.invited
          ? "Invitation envoyée par email — le conseiller pourra se connecter à l'app mobile."
          : "Conseiller ajouté."
      );
      await loadMembers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAdding(false);
    }
  }

  async function toggleAvailable(member: Member) {
    const res = await fetch(`/api/organization/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: !member.is_available }),
    });
    if (res.ok) await loadMembers();
  }

  async function removeMember(member: Member) {
    if (member.role === "owner") return;
    if (!confirm(`Retirer ${member.display_name || member.email} ?`)) return;
    const res = await fetch(`/api/organization/members/${member.id}`, {
      method: "DELETE",
    });
    if (res.ok) await loadMembers();
    else {
      const data = await res.json();
      setError(data.error ?? "Suppression impossible");
    }
  }

  if (orgLoading) {
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Conseillers</h1>
      <p className="mt-0.5 text-sm text-slate-600">
        Invitez un conseiller par site : il ne verra que les handoffs et notifications de ce
        chat (lien tracké, widget, page dédiée).
      </p>

      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Comment ça marche</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-blue-800">
          <li>Créez un <strong>site</strong> par page / marque (Dashboard → Sites)</li>
          <li>Installez le widget ou partagez un <strong>lien tracké</strong> (Dashboard → Liens)</li>
          <li>Invitez un conseiller en choisissant le <strong>site</strong> ci-dessous</li>
          <li>Il se connecte à l&apos;app mobile avec l&apos;email invité</li>
        </ol>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
          {error.includes("organization_members") || error.includes("migration") ? (
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-red-800">
              <li>Ouvrez Supabase → <strong>SQL Editor</strong></li>
              <li>
                Collez le contenu de{" "}
                <code className="rounded bg-red-100 px-1">supabase/migrations/009_human_handoff.sql</code>
              </li>
              <li>Cliquez <strong>Run</strong>, puis rechargez cette page</li>
            </ol>
          ) : null}
        </div>
      )}
      {success && (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </p>
      )}

      <form
        onSubmit={handleAdd}
        className="mt-4 max-w-xl rounded-lg border border-slate-200 bg-white p-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">Inviter un conseiller</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500">Site assigné</label>
            <select
              required
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {sites.length === 0 ? (
                <option value="">Créez d&apos;abord un site</option>
              ) : (
                sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="conseiller@entreprise.com"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Nom affiché (optionnel)</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Marie Dupont"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={adding || !siteId}
          className="mt-3 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {adding ? "Envoi…" : "Inviter"}
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Équipe ({members.length})</h2>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Chargement…</p>
        ) : members.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucun conseiller pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {m.display_name || m.email || "Conseiller"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {m.email} · {ROLE_LABELS[m.role] ?? m.role}
                    {m.site_name ? ` · Site : ${m.site_name}` : m.role === "owner" ? " · Tous les sites" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAvailable(m)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      m.is_available
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {m.is_available ? "Disponible" : "Indisponible"}
                  </button>
                  {m.role !== "owner" && (
                    <button
                      type="button"
                      onClick={() => removeMember(m)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
