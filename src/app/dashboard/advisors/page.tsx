"use client";

import { DashboardPanel, StatGrid } from "@/components/dashboard/dashboard-tabs";
import { useOrganization } from "@/hooks/use-organization";
import { useT } from "@/i18n/context";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

function memberInitials(member: Member) {
  const base = member.display_name?.trim() || member.email?.trim() || "?";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
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

  const stats = useMemo(() => {
    const agents = members.filter((m) => m.role === "agent");
    const available = members.filter((m) => m.is_available).length;
    return {
      total: members.length,
      agents: agents.length,
      available,
      sites: sites.length,
    };
  }, [members, sites.length]);

  const statItems = useMemo(
    () => [
      {
        label: t("dashboard.advisors.title"),
        value: stats.total,
        hint: t("dashboard.advisors.team", { count: stats.total }),
        highlight: true,
      },
      {
        label: t("dashboard.advisors.roleAgent"),
        value: stats.agents,
      },
      {
        label: t("dashboard.advisors.available"),
        value: stats.available,
      },
      {
        label: t("dashboard.nav.sites"),
        value: stats.sites,
      },
    ],
    [stats, t]
  );

  if (orgLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-md bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("dashboard.advisors.title")}</h1>
          <p className="mt-0.5 text-sm text-slate-600">{t("dashboard.advisors.subtitleExtended")}</p>
        </div>
        <Link
          href="/dashboard/inbox"
          className="shrink-0 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t("dashboard.advisors.openInbox")}
        </Link>
      </div>

      <StatGrid items={statItems} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
          {error.includes("organization_members") || error.includes("migration") ? (
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-red-800">
              <li>
                Ouvrez Supabase → <strong>SQL Editor</strong>
              </li>
              <li>
                Collez le contenu de{" "}
                <code className="rounded bg-red-100 px-1">supabase/migrations/009_human_handoff.sql</code>
              </li>
              <li>
                Cliquez <strong>Run</strong>, puis rechargez cette page
              </li>
            </ol>
          ) : null}
        </div>
      ) : null}

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}

      <DashboardPanel
        collapsible
        defaultOpen={false}
        title={t("dashboard.advisors.howItWorks")}
        description={t("dashboard.advisors.subtitle")}
      >
        <ol className="list-decimal space-y-2 pl-4 text-sm text-slate-700">
          <li>
            {t("dashboard.advisors.step1")}{" "}
            <Link href="/dashboard/sites" className="font-medium text-brand-600 hover:underline">
              {t("dashboard.nav.sites")} →
            </Link>
          </li>
          <li>
            {t("dashboard.advisors.step2")}{" "}
            <Link href="/dashboard/links" className="font-medium text-brand-600 hover:underline">
              {t("dashboard.nav.trackedLinks")} →
            </Link>
          </li>
          <li>{t("dashboard.advisors.step3")}</li>
          <li>{t("dashboard.advisors.step4")}</li>
        </ol>
      </DashboardPanel>

      <DashboardPanel title={t("dashboard.advisors.inviteTitle")}>
        <form onSubmit={handleAdd} className="max-w-2xl">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-500">
                {t("dashboard.advisors.assignedSite")}
              </label>
              <select
                required
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
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
              <label className="text-xs font-medium text-slate-500">{t("common.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="conseiller@entreprise.com"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">
                {t("dashboard.advisors.displayNameOptional")}
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("dashboard.advisors.namePlaceholder")}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={adding || !siteId}
            className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {adding ? t("dashboard.advisors.inviting") : t("dashboard.advisors.invite")}
          </button>
        </form>
      </DashboardPanel>

      <DashboardPanel title={t("dashboard.advisors.team", { count: members.length })}>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-slate-500">{t("dashboard.advisors.noAdvisors")}</p>
        ) : (
          <div className="space-y-4">
            {groupedAgents.map(({ site, advisors }) =>
              advisors.length > 0 ? (
                <div key={site.id}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {site.name} · {advisorCountLabel(advisors.length)}
                  </p>
                  <ul className="space-y-2">
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
            {otherMembers.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("dashboard.advisors.ownerAdmin")}
                </p>
                <ul className="space-y-2">
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
            ) : null}
          </div>
        )}
      </DashboardPanel>
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
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800"
          aria-hidden
        >
          {memberInitials(m)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {m.display_name || m.email || t("dashboard.advisors.roleAgent")}
          </p>
          <p className="truncate text-xs text-slate-500">
            {m.email} · {roleLabel(m.role, t)}
            {m.site_name
              ? ` · ${t("dashboard.advisors.siteLabel", { name: m.site_name })}`
              : m.role === "owner"
                ? ` · ${t("dashboard.advisors.allSites")}`
                : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {m.role === "agent" ? (
          <button
            type="button"
            onClick={() => onToggle(m)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              m.is_available
                ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {m.is_available ? t("dashboard.advisors.available") : t("dashboard.advisors.unavailable")}
          </button>
        ) : null}
        {m.role !== "owner" ? (
          <button
            type="button"
            onClick={() => onRemove(m)}
            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            {t("dashboard.advisors.remove")}
          </button>
        ) : null}
      </div>
    </li>
  );
}
