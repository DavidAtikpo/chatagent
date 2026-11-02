"use client";

import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { PlanUpgradePanel } from "@/components/dashboard/plan-upgrade-panel";
import { ProfileTabExplainer } from "@/components/dashboard/profile-tab-explainer";
import { usePlanFeatures } from "@/hooks/use-plan-features";
import { useT } from "@/i18n/context";
import {
  buildJobSearchDescription,
  buildOtherDescription,
  buildWebsiteBootstrap,
  type JobProfileMode,
  type JobSearchProfileFields,
  type OtherProfileFields,
  type OtherProfileSubtype,
  type SiteProfileType,
} from "@/lib/site-profile";
import { useEffect, useMemo, useState } from "react";

export type AddSiteSubmitPayload = {
  profileType: SiteProfileType;
  profileSubtype?: string;
  name: string;
  url?: string;
  businessDescription: string;
  profileMeta: Record<string, unknown>;
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  cvFile?: File | null;
};

type Props = {
  creating: boolean;
  onSubmit: (payload: AddSiteSubmitPayload) => void | Promise<void>;
  onCancel?: () => void;
  initialTab?: SiteProfileType;
};

const OTHER_SUBTYPES: OtherProfileSubtype[] = [
  "freelance",
  "ngo",
  "event",
  "real_estate",
  "artist",
  "training",
  "custom",
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-slate-600">{children}</label>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 ${props.className ?? ""}`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 ${props.className ?? ""}`}
    />
  );
}

export function AddSitePanel({ creating, onSubmit, onCancel, initialTab }: Props) {
  const t = useT();
  const { proProfiles } = usePlanFeatures();
  const [tab, setTab] = useState<SiteProfileType>(initialTab ?? "website");

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [websiteContact, setWebsiteContact] = useState({
    contactEmail: "",
    contactPhone: "",
    contactWhatsapp: "",
  });

  const [job, setJob] = useState<JobSearchProfileFields>({
    mode: "candidate",
    targetRole: "",
    skillsText: "",
    contactEmail: "",
    contactPhone: "",
    contactWhatsapp: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);

  const [other, setOther] = useState<OtherProfileFields>({
    subtype: "freelance",
    offerSummary: "",
    details: "",
    pricing: "",
    location: "",
    eventEndDate: "",
  });

  const tabs = useMemo(
    () => [
      { id: "website" as const, label: t("dashboard.sites.addTabs.website") },
      { id: "job_search" as const, label: t("dashboard.sites.addTabs.jobSearch") },
      { id: "other" as const, label: t("dashboard.sites.addTabs.other") },
    ],
    [t]
  );

  const proTabLocked = !proProfiles && tab !== "website";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (proTabLocked) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (tab === "website") {
      if (!url.trim()) return;
      const { businessDescription, hasContactFallback } = buildWebsiteBootstrap(
        trimmedName,
        url.trim(),
        websiteContact
      );
      await onSubmit({
        profileType: "website",
        name: trimmedName,
        url: url.trim(),
        businessDescription,
        profileMeta: { contactFallback: hasContactFallback },
        contact: {
          email: websiteContact.contactEmail.trim() || undefined,
          phone: websiteContact.contactPhone.trim() || undefined,
          whatsapp: websiteContact.contactWhatsapp.trim() || undefined,
        },
      });
      return;
    }

    if (tab === "job_search") {
      if (job.targetRole.trim().length < 3 || job.skillsText.trim().length < 30) return;
      await onSubmit({
        profileType: "job_search",
        name: trimmedName,
        businessDescription: buildJobSearchDescription(trimmedName, job),
        profileMeta: { ...job, hasCv: Boolean(cvFile) },
        contact: {
          email: job.contactEmail?.trim() || undefined,
          phone: job.contactPhone?.trim() || undefined,
          whatsapp: job.contactWhatsapp?.trim() || undefined,
        },
        cvFile,
      });
      return;
    }

    if (other.offerSummary.trim().length < 10 || other.details.trim().length < 20) return;
    await onSubmit({
      profileType: "other",
      profileSubtype: other.subtype,
      name: trimmedName,
      businessDescription: buildOtherDescription(trimmedName, other),
      profileMeta: { ...other },
    });
  }

  const jobIsRecruitment = job.mode === "recruitment";

  const submitLabel =
    tab === "website"
      ? t("dashboard.sites.createAndCrawl")
      : tab === "job_search"
        ? jobIsRecruitment
          ? t("dashboard.sites.addTabs.submitRecruitment")
          : t("dashboard.sites.addTabs.submitJob")
        : t("dashboard.sites.createWithoutCrawl");

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
      <DashboardTabs tabs={tabs} active={tab} onChange={setTab} />

      <ProfileTabExplainer profileType={tab} jobMode={tab === "job_search" ? job.mode : undefined} />

      {proTabLocked ? (
        <PlanUpgradePanel
          requiredPlan="pro"
          titleKey="dashboard.plans.addProfileProHintTitle"
          bodyKey="dashboard.plans.addProfileProHintBody"
        />
      ) : null}

      <p className="text-xs text-slate-500">
        {tab === "website" && t("dashboard.sites.addTabs.hintWebsite")}
        {tab === "job_search" &&
          (jobIsRecruitment
            ? t("dashboard.sites.addTabs.hintJobRecruitment")
            : t("dashboard.sites.addTabs.hintJob"))}
        {tab === "other" && t("dashboard.sites.addTabs.hintOther")}
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className={tab === "website" ? "" : "sm:col-span-2"}>
          <FieldLabel>
            {tab === "job_search"
              ? jobIsRecruitment
                ? t("dashboard.sites.addTabs.recruitmentName")
                : t("dashboard.sites.addTabs.candidateName")
              : t("dashboard.sites.siteName")}
          </FieldLabel>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        {tab === "website" && (
          <div>
            <FieldLabel>{t("dashboard.sites.siteUrl")}</FieldLabel>
            <TextInput
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("dashboard.sites.urlPlaceholder")}
              required
            />
          </div>
        )}
      </div>

      {tab === "website" && (
        <div className="rounded-lg border border-slate-100 bg-white p-3">
          <p className="text-xs font-semibold text-slate-800">
            {t("dashboard.sites.addTabs.websiteContactSection")}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {t("dashboard.sites.addTabs.websiteContactHint")}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div>
              <FieldLabel>{t("dashboard.sites.addTabs.contactEmail")}</FieldLabel>
              <TextInput
                type="email"
                value={websiteContact.contactEmail}
                onChange={(e) =>
                  setWebsiteContact((c) => ({ ...c, contactEmail: e.target.value }))
                }
              />
            </div>
            <div>
              <FieldLabel>{t("dashboard.sites.addTabs.contactPhone")}</FieldLabel>
              <TextInput
                value={websiteContact.contactPhone}
                onChange={(e) =>
                  setWebsiteContact((c) => ({ ...c, contactPhone: e.target.value }))
                }
              />
            </div>
            <div>
              <FieldLabel>{t("dashboard.sites.addTabs.contactWhatsapp")}</FieldLabel>
              <TextInput
                value={websiteContact.contactWhatsapp}
                onChange={(e) =>
                  setWebsiteContact((c) => ({ ...c, contactWhatsapp: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
      )}

      {tab === "job_search" && (
        <div className="space-y-2">
          <div>
            <FieldLabel>{t("dashboard.sites.addTabs.jobMode")}</FieldLabel>
            <div className="mt-1 flex flex-wrap gap-2">
              {(
                [
                  { id: "candidate" as JobProfileMode, label: t("dashboard.sites.addTabs.jobModeCandidate") },
                  { id: "recruitment" as JobProfileMode, label: t("dashboard.sites.addTabs.jobModeRecruitment") },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setJob((j) => ({ ...j, mode: opt.id }))}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    job.mode === opt.id
                      ? "border-brand-500 bg-brand-50 text-brand-900"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>
              {jobIsRecruitment
                ? t("dashboard.sites.addTabs.recruitmentRole")
                : t("dashboard.sites.addTabs.jobTarget")}
            </FieldLabel>
            <TextInput
              value={job.targetRole}
              onChange={(e) => setJob((j) => ({ ...j, targetRole: e.target.value }))}
              placeholder={
                jobIsRecruitment
                  ? t("dashboard.sites.addTabs.recruitmentRolePlaceholder")
                  : t("dashboard.sites.addTabs.jobTargetPlaceholder")
              }
              required
            />
          </div>
          <div>
            <FieldLabel>
              {jobIsRecruitment
                ? t("dashboard.sites.addTabs.recruitmentDetails")
                : t("dashboard.sites.addTabs.jobSkills")}
            </FieldLabel>
            <TextArea
              value={job.skillsText}
              onChange={(e) => setJob((j) => ({ ...j, skillsText: e.target.value }))}
              rows={4}
              required
            />
          </div>
          <div>
            <FieldLabel>
              {jobIsRecruitment
                ? t("dashboard.sites.addTabs.recruitmentPdf")
                : t("dashboard.sites.addTabs.jobCv")}
            </FieldLabel>
            <input
              type="file"
              accept="application/pdf"
              className="mt-1 block w-full text-sm text-slate-600"
              onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <FieldLabel>{t("dashboard.sites.addTabs.contactEmail")}</FieldLabel>
              <TextInput
                type="email"
                value={job.contactEmail}
                onChange={(e) => setJob((j) => ({ ...j, contactEmail: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>{t("dashboard.sites.addTabs.contactPhone")}</FieldLabel>
              <TextInput
                value={job.contactPhone}
                onChange={(e) => setJob((j) => ({ ...j, contactPhone: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>{t("dashboard.sites.addTabs.contactWhatsapp")}</FieldLabel>
              <TextInput
                value={job.contactWhatsapp}
                onChange={(e) => setJob((j) => ({ ...j, contactWhatsapp: e.target.value }))}
              />
            </div>
          </div>
          <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-600">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <li key={n}>
                {t(
                  (jobIsRecruitment
                    ? `dashboard.sites.addTabs.jobRecruitStep${n}`
                    : `dashboard.sites.addTabs.jobStep${n}`) as "dashboard.sites.addTabs.jobStep1"
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {tab === "other" && (
        <div className="space-y-2">
          <div>
            <FieldLabel>{t("dashboard.sites.addTabs.otherType")}</FieldLabel>
            <select
              value={other.subtype}
              onChange={(e) =>
                setOther((o) => ({ ...o, subtype: e.target.value as OtherProfileSubtype }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            >
              {OTHER_SUBTYPES.map((st) => (
                <option key={st} value={st}>
                  {t(`dashboard.sites.addTabs.otherTypes.${st}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>{t("dashboard.sites.addTabs.otherSummary")}</FieldLabel>
            <TextArea
              value={other.offerSummary}
              onChange={(e) => setOther((o) => ({ ...o, offerSummary: e.target.value }))}
              rows={2}
              required
            />
          </div>
          <div>
            <FieldLabel>{t("dashboard.sites.addTabs.otherDetails")}</FieldLabel>
            <TextArea
              value={other.details}
              onChange={(e) => setOther((o) => ({ ...o, details: e.target.value }))}
              rows={4}
              required
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("dashboard.sites.addTabs.otherPricing")}</FieldLabel>
              <TextInput
                value={other.pricing}
                onChange={(e) => setOther((o) => ({ ...o, pricing: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>{t("dashboard.sites.addTabs.otherLocation")}</FieldLabel>
              <TextInput
                value={other.location}
                onChange={(e) => setOther((o) => ({ ...o, location: e.target.value }))}
              />
            </div>
          </div>
          {other.subtype === "event" && (
            <div>
              <FieldLabel>{t("dashboard.sites.addTabs.eventEndDate")}</FieldLabel>
              <TextInput
                type="date"
                value={other.eventEndDate}
                onChange={(e) => setOther((o) => ({ ...o, eventEndDate: e.target.value }))}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={creating || proTabLocked}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {proTabLocked
            ? t("dashboard.plans.upgradeToCreate")
            : creating
              ? t("dashboard.sites.creating")
              : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t("dashboard.sites.cancelAdd")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
