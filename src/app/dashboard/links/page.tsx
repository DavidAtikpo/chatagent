"use client";

import {
  TrackedLinkShareButtons,
  TrackedLinkSharePanel,
} from "@/components/dashboard/tracked-link-share-buttons";
import { trackedLinkUrl } from "@/lib/app-url";
import { DashboardPanel, StatGrid } from "@/components/dashboard/dashboard-tabs";
import { ResponsiveTable } from "@/components/dashboard/responsive-table";
import { formatDate, type TrackedLinkInteractionStat } from "@/lib/dashboard-data";
import { useT } from "@/i18n/context";
import { useDashboardLabels } from "@/i18n/use-dashboard-labels";
import { useOrganization } from "@/hooks/use-organization";
import { useEffect, useMemo, useRef, useState } from "react";

const SOURCE_VALUES = [
  "facebook",
  "instagram",
  "google_ads",
  "whatsapp",
  "qr_code",
  "direct_link",
] as const;

async function uploadLinkImage(linkId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`/api/traffic-links/${linkId}/image`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "");
  }
  return data.image_url as string;
}

export default function LinksPage() {
  const { sites, loading: orgLoading } = useOrganization();
  const t = useT();
  const { sourceLabel, widgetClickLabel } = useDashboardLabels();
  const [links, setLinks] = useState<TrackedLinkInteractionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState("");
  const [slug, setSlug] = useState("");
  const [source, setSource] = useState("facebook");
  const [label, setLabel] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [shareLinkUrl, setShareLinkUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const editImageRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function loadLinks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/traffic-links", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("dashboard.links.loadFailed"));
        setLinks([]);
        return;
      }
      setLinks((data.links as TrackedLinkInteractionStat[]) ?? []);
    } catch {
      setError(t("dashboard.links.loadFailed"));
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!orgLoading) {
      loadLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgLoading]);

  useEffect(() => {
    if (sites.length && !siteId) {
      setSiteId(sites[0].id);
    }
  }, [sites, siteId]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    if (!siteId || !slug) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/traffic-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, slug, source, label: label || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("dashboard.links.createFailed"));
        return;
      }

      const linkId = data.link?.id as string | undefined;
      if (linkId && imageFile) {
        await uploadLinkImage(linkId, imageFile);
      }

      const createdSlug = data.link?.slug as string | undefined;
      const site = sites.find((s) => s.id === siteId);
      if (createdSlug && site?.widget_key) {
        setShareLinkUrl(trackedLinkUrl(createdSlug, site.widget_key));
      }

      setSlug("");
      setLabel("");
      setImageFile(null);
      setShowForm(false);
      await loadLinks();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : t("dashboard.links.createFailed")
      );
    } finally {
      setCreating(false);
    }
  }

  async function changeLinkImage(linkId: string, file: File) {
    setUploadingId(linkId);
    setError(null);
    try {
      await uploadLinkImage(linkId, file);
      await loadLinks();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : t("dashboard.links.imageUpdateFailed")
      );
    } finally {
      setUploadingId(null);
    }
  }

  async function deleteLink(id: string) {
    if (!confirm(t("dashboard.links.deleteConfirm"))) return;
    setError(null);
    const res = await fetch(`/api/traffic-links/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? t("dashboard.links.deleteFailed"));
      return;
    }
    await loadLinks();
  }

  function trackingUrl(link: TrackedLinkInteractionStat) {
    return trackedLinkUrl(link.slug, link.widget_key ?? "");
  }

  async function copyUrl(link: TrackedLinkInteractionStat) {
    await navigator.clipboard.writeText(trackingUrl(link));
    setCopied(link.id);
    setTimeout(() => setCopied(null), 2000);
  }

  const linkStats = useMemo(() => {
    const visits = links.reduce((sum, l) => sum + l.click_count, 0);
    const interactions = links.reduce((sum, l) => sum + l.interaction_total, 0);
    return { count: links.length, visits, interactions };
  }, [links]);

  const statItems = useMemo(
    () => [
      {
        label: t("dashboard.links.title"),
        value: linkStats.count,
        highlight: true,
      },
      {
        label: t("dashboard.links.visits"),
        value: linkStats.visits,
      },
      {
        label: t("dashboard.links.interactions"),
        value: linkStats.interactions,
      },
      {
        label: t("dashboard.nav.sites"),
        value: sites.length,
      },
    ],
    [linkStats, sites.length, t]
  );

  if (orgLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-44 rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
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
          <h1 className="text-xl font-bold text-slate-900">{t("dashboard.links.title")}</h1>
          <p className="mt-0.5 text-sm text-slate-600">{t("dashboard.links.subtitle")}</p>
        </div>
        {sites.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowForm((open) => !open)}
            className="shrink-0 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {showForm ? t("dashboard.sites.cancelAdd") : t("dashboard.links.addLink")}
          </button>
        ) : null}
      </div>

      <StatGrid items={statItems} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {shareLinkUrl ? (
        <TrackedLinkSharePanel
          url={shareLinkUrl}
          continueLabel={t("dashboard.links.shareDismiss")}
          onContinue={() => setShareLinkUrl(null)}
        />
      ) : null}

      {sites.length === 0 ? (
        <DashboardPanel title={t("dashboard.links.title")}>
          <p className="text-sm text-slate-500">{t("dashboard.links.noSiteYet")}</p>
        </DashboardPanel>
      ) : null}

      {sites.length > 0 && showForm ? (
        <DashboardPanel title={t("dashboard.links.newLink")}>
        <form onSubmit={createLink}>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">{t("dashboard.links.siteLabel")}</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">{t("dashboard.links.source")}</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {SOURCE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {t(`dashboard.links.sources.${value}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">{t("dashboard.links.slugHint")}</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                placeholder="facebook-ads"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">{t("dashboard.links.labelOptional")}</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                placeholder={t("dashboard.links.campaignPlaceholder")}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">{t("dashboard.links.previewImage")}</label>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="text-xs text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-brand-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-brand-700"
                />
                {imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt={t("dashboard.links.previewAlt")}
                    className="h-14 w-24 rounded border border-slate-200 object-cover"
                  />
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {t("dashboard.links.previewHint", { slug: slug || "votre-slug" })}
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {creating ? t("dashboard.links.creating") : t("dashboard.links.createLink")}
          </button>
        </form>
        </DashboardPanel>
      ) : null}

      <DashboardPanel title={t("dashboard.links.title")} description={t("dashboard.links.subtitleExtended")}>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-md bg-slate-100" />
            ))}
          </div>
        ) : links.length === 0 ? (
          <p className="text-sm text-slate-500">{t("dashboard.links.emptyTable")}</p>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {links.map((link) => (
              <article
                key={link.id}
                className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
              >
                <div className="flex gap-3">
                  <div className="shrink-0">
                    {link.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={link.image_url}
                        alt={link.label ?? link.slug}
                        className="h-14 w-20 rounded border border-slate-200 object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-20 items-center justify-center rounded border border-dashed border-slate-200 text-[10px] text-slate-400">
                        {t("dashboard.links.noImage")}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{link.label ?? link.slug}</p>
                    <p className="text-xs text-slate-500">{link.site_name}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {sourceLabel(link.source)} · {t("dashboard.links.visits")}{" "}
                      <span className="font-medium">{link.click_count}</span> ·{" "}
                      {t("dashboard.links.interactions")}{" "}
                      <span className="font-medium text-brand-600">{link.interaction_total}</span>
                    </p>
                    <a
                      href={trackingUrl(link)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block break-all text-xs text-brand-600 hover:underline"
                    >
                      {trackingUrl(link)}
                    </a>
                  </div>
                </div>
                {link.countries.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {link.countries.map((row) => (
                      <span
                        key={row.country}
                        className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-800"
                      >
                        {row.country} {row.count}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {t("dashboard.links.colShare")}
                  </p>
                  <div className="mt-1">
                    <TrackedLinkShareButtons
                      url={trackingUrl(link)}
                      shareMessage={
                        link.label
                          ? `${link.label} — ${t("dashboard.links.shareDefaultMessage")}`
                          : undefined
                      }
                      compact
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <input
                    ref={(el) => {
                      editImageRefs.current[link.id] = el;
                    }}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void changeLinkImage(link.id, file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingId === link.id}
                    onClick={() => editImageRefs.current[link.id]?.click()}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                  >
                    {uploadingId === link.id
                      ? t("dashboard.settings.uploading")
                      : link.image_url
                        ? t("dashboard.links.changeImage")
                        : t("dashboard.links.addImage")}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyUrl(link)}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-brand-700"
                  >
                    {copied === link.id ? t("common.copied") : t("common.copy")}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteLink(link.id)}
                    className="rounded-md border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700"
                  >
                    {t("dashboard.links.deleteShort")}
                  </button>
                </div>
                {link.created_at ? (
                  <p className="mt-2 text-[11px] text-slate-400">
                    {t("dashboard.links.colCreated")} · {formatDate(link.created_at)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          <div className="hidden md:block">
          <ResponsiveTable scrollHint={t("common.tableScrollHint")} minWidthClassName="min-w-[960px]">
            <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">{t("dashboard.links.colImage")}</th>
                <th className="px-3 py-2">{t("dashboard.links.colLabel")}</th>
                <th className="px-3 py-2">{t("dashboard.links.source")}</th>
                <th className="px-3 py-2">{t("dashboard.links.visits")}</th>
                <th className="px-3 py-2">{t("dashboard.links.country")}</th>
                <th className="px-3 py-2">{t("dashboard.links.interactions")}</th>
                <th className="px-3 py-2">{t("dashboard.links.colUrl")}</th>
                <th className="px-3 py-2">{t("dashboard.links.colCreated")}</th>
                <th className="px-3 py-2">{t("dashboard.links.colShare")}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b border-slate-50 text-slate-800">
                  <td className="px-3 py-2">
                    <div className="flex flex-col items-start gap-1">
                      {link.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={link.image_url}
                          alt={link.label ?? link.slug}
                          className="h-10 w-16 rounded border border-slate-200 object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-16 items-center justify-center rounded border border-dashed border-slate-200 text-[10px] text-slate-400">
                          {t("dashboard.links.noImage")}
                        </span>
                      )}
                      <input
                        ref={(el) => {
                          editImageRefs.current[link.id] = el;
                        }}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void changeLinkImage(link.id, file);
                          e.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        disabled={uploadingId === link.id}
                        onClick={() => editImageRefs.current[link.id]?.click()}
                        className="text-[10px] text-brand-600 hover:underline disabled:opacity-50"
                      >
                        {uploadingId === link.id
                          ? t("dashboard.settings.uploading")
                          : link.image_url
                          ? t("dashboard.links.changeImage")
                          : t("dashboard.links.addImage")}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{link.label ?? link.slug}</div>
                    <div className="text-xs text-slate-500">{link.site_name}</div>
                  </td>
                  <td className="px-3 py-2">{sourceLabel(link.source)}</td>
                  <td className="px-3 py-2 font-medium">{link.click_count}</td>
                  <td className="px-3 py-2">
                    {link.countries.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {link.countries.map((row) => (
                          <span
                            key={row.country}
                            className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-800"
                          >
                            {row.country} {row.count}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-brand-600">{link.interaction_total}</div>
                    {link.interaction_events.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {link.interaction_events.map((ev) => (
                          <span
                            key={ev.event_type}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                          >
                            {widgetClickLabel(ev.event_type)} {ev.count}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2">
                    <a
                      href={trackingUrl(link)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      /c/{link.slug}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {link.created_at ? formatDate(link.created_at) : "—"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <TrackedLinkShareButtons
                      url={trackingUrl(link)}
                      shareMessage={
                        link.label
                          ? `${link.label} — ${t("dashboard.links.shareDefaultMessage")}`
                          : undefined
                      }
                      inline
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => copyUrl(link)}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        {copied === link.id ? t("common.copied") : t("common.copy")}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLink(link.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        {t("dashboard.links.deleteShort")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </ResponsiveTable>
          </div>
          </>
        )}
      </DashboardPanel>
    </div>
  );
}
