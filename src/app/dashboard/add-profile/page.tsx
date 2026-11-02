"use client";

import {
  AddSitePanel,
  type AddSiteSubmitPayload,
} from "@/components/dashboard/add-site-panel";
import { DashboardPanel } from "@/components/dashboard/dashboard-tabs";
import { useOrganization } from "@/hooks/use-organization";
import { useT } from "@/i18n/context";
import type { SiteProfileType } from "@/lib/site-profile";
import { triggerCrawl } from "@/lib/dashboard-data";
import { TrackedLinkSharePanel } from "@/components/dashboard/tracked-link-share-buttons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const REDIRECT_BY_TYPE: Record<SiteProfileType, string> = {
  website: "/dashboard/sites",
  job_search: "/dashboard/emploi",
  other: "/dashboard/autres",
};

function AddProfileContent() {
  const { organization, refresh, loading: orgLoading } = useOrganization();
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "shop"
      ? "other"
      : tabParam === "job_search" || tabParam === "other" || tabParam === "website"
        ? tabParam
        : undefined;

  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shareLinkUrl, setShareLinkUrl] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<SiteProfileType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadCvPdf(siteId: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/sites/${siteId}/documents`, { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? t("dashboard.sites.knowledge.uploadFailed"));
    }
  }

  async function addSite(payload: AddSiteSubmitPayload) {
    if (!organization) return;
    setCreating(true);
    setError(null);
    setSuccessMessage(null);
    setShareLinkUrl(null);
    setPendingRedirect(null);
    let blockRedirect = false;

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organization.id,
          profileType: payload.profileType,
          profileSubtype: payload.profileSubtype,
          profileMeta: payload.profileMeta,
          name: payload.name,
          url: payload.url,
          businessDescription: payload.businessDescription,
          contact: payload.contact,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.site?.id) {
        setError(
          data.code === "plan_pro_required"
            ? t("dashboard.plans.proProfilesBody")
            : (data.error ?? t("dashboard.sites.createFailed"))
        );
        blockRedirect = true;
        return;
      }

      if (payload.cvFile) {
        try {
          await uploadCvPdf(data.site.id, payload.cvFile);
          if (payload.profileType === "job_search") {
            await fetch("/api/backend/profiles/compose", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ site_id: data.site.id, force: true }),
            }).catch(() => null);
          }
        } catch (cvErr) {
          setError(cvErr instanceof Error ? cvErr.message : t("dashboard.sites.knowledge.uploadFailed"));
          blockRedirect = true;
        }
      }

      if (payload.profileType === "website" && payload.url) {
        const crawl = await triggerCrawl(data.site.id);
        if (!crawl.ok) {
          setError(crawl.error ?? t("dashboard.sites.crawlNotStarted"));
          blockRedirect = true;
        }
      }

      if (data.trackedLink?.url) {
        setShareLinkUrl(String(data.trackedLink.url));
        setPendingRedirect(payload.profileType);
        blockRedirect = true;
      } else if (payload.profileType !== "website" && data.profileComposed) {
        setSuccessMessage(t("dashboard.sites.addTabs.profileComposed"));
      }

      await refresh({ silent: true });

      if (!blockRedirect) {
        router.push(REDIRECT_BY_TYPE[payload.profileType]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.unexpectedError"));
      blockRedirect = true;
    } finally {
      setCreating(false);
    }
  }

  if (orgLoading) {
    return <p className="text-sm text-slate-500">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("dashboard.addProfile.title")}</h1>
        <p className="mt-0.5 text-sm text-slate-600">{t("dashboard.addProfile.subtitle")}</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {successMessage}
        </div>
      ) : null}
      {shareLinkUrl ? (
        <TrackedLinkSharePanel
          url={shareLinkUrl}
          onContinue={
            pendingRedirect
              ? () => router.push(REDIRECT_BY_TYPE[pendingRedirect])
              : undefined
          }
        />
      ) : null}

      <DashboardPanel title={t("dashboard.sites.newSite")}>
        <AddSitePanel creating={creating} onSubmit={addSite} initialTab={initialTab} />
      </DashboardPanel>

      <p className="text-xs text-slate-500">
        {t("dashboard.addProfile.listHint")}{" "}
        <Link href="/dashboard/sites" className="text-brand-600 hover:underline">
          {t("dashboard.nav.sites")}
        </Link>
        {" · "}
        <Link href="/dashboard/emploi" className="text-brand-600 hover:underline">
          {t("dashboard.nav.emploi")}
        </Link>
        {" · "}
        <Link href="/dashboard/autres" className="text-brand-600 hover:underline">
          {t("dashboard.nav.autres")}
        </Link>
      </p>
    </div>
  );
}

export default function AddProfilePage() {
  const t = useT();
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">{t("common.loading")}</p>}>
      <AddProfileContent />
    </Suspense>
  );
}
