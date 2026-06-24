"use client";

import { useT } from "@/i18n/context";
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

function roleLabel(role: string, t: (key: string) => string) {
  if (role === "owner") return t("dashboard.advisors.roleOwner");
  if (role === "admin") return t("dashboard.advisors.roleAdmin");
  if (role === "agent") return t("dashboard.advisors.roleAgent");
  return role;
}

export default function AdvisorsPage() {
  const { organization, sites, loading: orgLoading } = useOrganization();
  const t = useT();
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
      if (!res.ok) throw new Error(data.error ?? t("dashboard.advisors.loadFailed"));
      setMembers(data.members ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      if (!res.ok) throw new Error(data.error ?? t("dashboard.advisors.addFailed"));
      setEmail("");
      setDisplayName("");
      setSuccess(
        data.invited
          ? t("dashboard.advisors.inviteSent")
          : data.updated
          ? t("dashboard.advisors.siteUpdated")
          : t("dashboard.advisors.advisorAdded")
      );
      await loadMembers();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
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
    const name = member.display_name || member.email || "";
    if (!confirm(t("dashboard.advisors.removeConfirm", { name }))) return;
    const res = await fetch(`/api/organization/members/${member.id}`, {
      method: "DELETE",
    });
    if (res.ok) await loadMembers();
    else {
      const data = await res.json();
      setError(data.error ?? t("dashboard.advisors.removeFailed"));
    }
  }

  const agentsBySite = members.filter((m) => m.role === "agent" && m.site_id);
  const agentCountForSite = (id: string) =>
    agentsBySite.filter((m) => m.site_id === id).length;

  const groupedAgents = sites.map((site) => ({
    site,
    advisors: members.filter((m) => m.role === "agent" && m.site_id === site.id),
  }));
  const otherMembers = members.filter(
    (m) => m.role === "owner" || m.role === "admin" || (m.role === "agent" && !m.site_id)
  );

  function advisorCountLabel(count: number) {
    return count > 1
      ? t("dashboard.advisors.advisorCountPlural", { count })
      : t("dashboard.advisors.advisorCount", { count });
  }

  if (orgLoading) {
    return <p className="text-sm text-slate-500">{t("common.loading")}</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">{t("dashboard.advisors.title")}</h1>
      <p className="mt-0.5 text-sm text-slate-600">{t("dashboard.advisors.subtitleExtended")}</p>

      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">{t("dashboard.advisors.howItWorks")}</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-blue-800">
          <li>{t("dashboard.advisors.step1")}</li>
          <li>{t("dashboard.advisors.step2")}</li>
          <li>{t("dashboard.advisors.step3")}</li>
          <li>{t("dashboard.advisors.step4")}</li>
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
        <h2 className="text-sm font-semibold text-slate-900">{t("dashboard.advisors.inviteTitle")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500">{t("dashboard.advisors.assignedSite")}</label>
            <select
              required
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {sites.length === 0 ? (
                <option value="">{t("dashboard.advisors.createSiteFirst")}</option>
              ) : (
                sites.map((s) => {
                  const n = agentCountForSite(s.id);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {n > 0 ? ` — ${advisorCountLabel(n)}` : ""}
                    </option>
                  );
                })
              )}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">{t("common.email")}</label>
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
            <label className="text-xs text-slate-500">{t("dashboard.advisors.displayNameOptional")}</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("dashboard.advisors.namePlaceholder")}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={adding || !siteId}
          className="mt-3 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {adding ? t("dashboard.advisors.inviting") : t("dashboard.advisors.invite")}
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {t("dashboard.advisors.team", { count: members.length })}
          </h2>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-slate-500">{t("common.loading")}</p>
        ) : members.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">{t("dashboard.advisors.noAdvisors")}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {groupedAgents.map(({ site, advisors }) =>
              advisors.length > 0 ? (
                <div key={site.id}>
                  <p className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {site.name} · {advisorCountLabel(advisors.length)}
                  </p>
                  <ul>
                    {advisors.map((m) => (
                      <MemberRow
                        key={m.id}
                        member={m}
                        onToggle={toggleAvailable}
                        onRemove={removeMember}
                      />
                    ))}
                  </ul>
                </div>
              ) : null
            )}
            {otherMembers.length > 0 && (
              <div>
                <p className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("dashboard.advisors.ownerAdmin")}
                </p>
                <ul>
                  {otherMembers.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      onToggle={toggleAvailable}
                      onRemove={removeMember}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberRow({
  member: m,
  onToggle,
  onRemove,
}: {
  member: Member;
  onToggle: (m: Member) => void;
  onRemove: (m: Member) => void;
}) {
  const t = useT();

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">
          {m.display_name || m.email || t("dashboard.advisors.roleAgent")}
        </p>
        <p className="text-xs text-slate-500">
          {m.email} · {roleLabel(m.role, t)}
          {m.site_name
            ? ` · ${t("dashboard.advisors.siteLabel", { name: m.site_name })}`
            : m.role === "owner"
            ? ` · ${t("dashboard.advisors.allSites")}`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggle(m)}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            m.is_available
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {m.is_available ? t("dashboard.advisors.available") : t("dashboard.advisors.unavailable")}
        </button>
        {m.role !== "owner" && (
          <button
            type="button"
            onClick={() => onRemove(m)}
            className="text-xs text-red-600 hover:underline"
          >
            {t("dashboard.advisors.remove")}
          </button>
        )}
      </div>
    </li>
  );
}
