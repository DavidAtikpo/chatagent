"use client";

import { useOrganization } from "@/hooks/use-organization";
import { useCallback, useEffect, useState } from "react";

type Member = {
  id: string;
  user_id: string;
  role: string;
  display_name: string | null;
  is_available: boolean;
  email?: string | null;
  created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Admin",
  agent: "Conseiller",
};

export default function AdvisorsPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

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
        Gérez l&apos;équipe qui reçoit les handoffs et les notifications push sur l&apos;app mobile.
      </p>

      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">App mobile conseiller</p>
        <p className="mt-1 text-blue-800">
          Chaque conseiller se connecte avec le même email invité ci-dessous. Les notifications
          Firebase arrivent uniquement si le conseiller est <strong>disponible</strong> et a
          installé l&apos;app.
        </p>
      </div>

      {error && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
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
          disabled={adding}
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
