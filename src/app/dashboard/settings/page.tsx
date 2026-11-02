"use client";

import { WelcomeMessagePreview } from "@/components/dashboard/welcome-message-preview";
import { DashboardPanel, DashboardTabs, StatGrid } from "@/components/dashboard/dashboard-tabs";
import { PlanUpgradePanel } from "@/components/dashboard/plan-upgrade-panel";
import { hasProFeatures, hasStarterFeatures, planDisplayLabel } from "@/lib/plans";
import { AgentConfig } from "@/lib/dashboard-data";
import { isGenericWelcomeMessage } from "@/lib/generic-welcome";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { useT } from "@/i18n/context";
import { useOrganization } from "@/hooks/use-organization";
import { useEffect, useMemo, useState } from "react";

type SettingsTab = "account" | "contacts" | "widget" | "agent";

const TONE_VALUES = ["professional", "friendly", "casual", "formal"] as const;

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
const fieldDisabledClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-400";
const labelClass = "text-xs font-medium text-slate-600";

const HEADER_FONT_OPTIONS = [
  { key: "system", value: "system-ui, -apple-system, sans-serif" },
  { key: "georgia", value: "Georgia, 'Times New Roman', serif" },
  { key: "arial", value: "Arial, Helvetica, sans-serif" },
  { key: "trebuchet", value: "'Trebuchet MS', sans-serif" },
  { key: "verdana", value: "Verdana, sans-serif" },
  { key: "courier", value: "'Courier New', monospace" },
] as const;

function applySiteConfig(
  config: AgentConfig,
  whatsappFromSite: string | null | undefined,
  defaultWelcome: string,
  setters: {
    setWelcomeMessage: (v: string) => void;
    setTone: (v: string) => void;
    setLanguage: (v: string) => void;
    setCtaUrl: (v: string) => void;
    setCtaLabel: (v: string) => void;
    setWhatsappNumber: (v: string) => void;
    setContactPhone: (v: string) => void;
    setContactEmail: (v: string) => void;
    setPrimaryColor: (v: string) => void;
    setHeaderTitleColor: (v: string) => void;
    setHeaderFont: (v: string) => void;
    setLogoUrl: (v: string) => void;
  }
) {
  setters.setWelcomeMessage(
    config.welcome_customized && !isGenericWelcomeMessage(config.welcome_message)
      ? (config.welcome_message ?? "")
      : ""
  );
  setters.setTone(config.tone ?? "professional");
  setters.setLanguage(config.language ?? "fr");
  setters.setCtaUrl(config.cta_url ?? "");
  setters.setCtaLabel(config.cta_label ?? "");
  setters.setWhatsappNumber(config.contact_whatsapp ?? whatsappFromSite ?? "");
  setters.setContactPhone(config.contact_phone ?? "");
  setters.setContactEmail(config.contact_email ?? "");
  setters.setPrimaryColor(config.primary_color ?? "#C9922A");
  setters.setHeaderTitleColor(config.header_title_color ?? "#ffffff");
  setters.setHeaderFont(config.header_font ?? "system-ui, -apple-system, sans-serif");
  setters.setLogoUrl(config.logo_url ?? "");
}

export default function SettingsPage() {
  const { organization, sites, email, loading: orgLoading, refresh } = useOrganization();
  const t = useT();
  const proContacts = hasProFeatures(organization);
  const starterBranding = hasStarterFeatures(organization);
  const [orgName, setOrgName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("fr");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#C9922A");
  const [headerTitleColor, setHeaderTitleColor] = useState("#ffffff");
  const [headerFont, setHeaderFont] = useState("system-ui, -apple-system, sans-serif");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [welcomeTouched, setWelcomeTouched] = useState(false);

  const defaultWelcome = t("dashboard.settings.defaultWelcome");

  const settingsTabs = useMemo(
    () => [
      { id: "account" as const, label: t("dashboard.settings.tabs.account") },
      { id: "contacts" as const, label: t("dashboard.settings.tabs.contacts") },
      { id: "widget" as const, label: t("dashboard.settings.tabs.widget") },
      { id: "agent" as const, label: t("dashboard.settings.tabs.agent") },
    ],
    [t]
  );

  const selectedSite = sites.find((s) => s.id === siteId) ?? sites[0];

  const settingsStatItems = useMemo(
    () => [
      {
        label: t("dashboard.settings.account"),
        value: planDisplayLabel(organization?.subscription_plan),
      },
      {
        label: t("dashboard.nav.sites"),
        value: sites.length,
      },
      {
        label: t("dashboard.settings.siteToConfigure"),
        value: selectedSite?.name ?? "—",
      },
      {
        label: t("dashboard.settings.tabs.contacts"),
        value: proContacts ? t("dashboard.settings.planPro") : planDisplayLabel(organization?.subscription_plan),
      },
    ],
    [organization, sites.length, selectedSite, proContacts, t]
  );

  const siteSelector =
    sites.length > 0 ? (
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <span className={labelClass}>{t("dashboard.settings.siteToConfigure")}</span>
        <select
          value={siteId}
          onChange={(e) => handleSiteChange(e.target.value)}
          className={`${fieldClass} sm:max-w-xs`}
        >
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    ) : null;

  const saveButton = (className: string) => (
    <button type="submit" disabled={saving} className={className}>
      {saving ? t("common.saving") : saved ? t("common.saved") : t("common.save")}
    </button>
  );

  const setters = {
    setWelcomeMessage,
    setTone,
    setLanguage,
    setCtaUrl,
    setCtaLabel,
    setWhatsappNumber,
    setContactPhone,
    setContactEmail,
    setPrimaryColor,
    setHeaderTitleColor,
    setHeaderFont,
    setLogoUrl,
  };

  useEffect(() => {
    if (organization) setOrgName(organization.name);
  }, [organization]);

  useEffect(() => {
    if (!sites.length) return;
    const activeId = siteId && sites.some((s) => s.id === siteId) ? siteId : sites[0].id;
    if (activeId !== siteId) setSiteId(activeId);
    const site = sites.find((s) => s.id === activeId) ?? sites[0];
    applySiteConfig(site.agent_config ?? {}, site.whatsapp_number, defaultWelcome, setters);
    setWelcomeTouched(
      Boolean(site.agent_config?.welcome_customized) &&
        !isGenericWelcomeMessage(site.agent_config?.welcome_message)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites, siteId, defaultWelcome]);

  function handleSiteChange(id: string) {
    setSiteId(id);
    const site = sites.find((s) => s.id === id);
    if (site) {
      applySiteConfig(site.agent_config ?? {}, site.whatsapp_number, defaultWelcome, setters);
      setWelcomeTouched(
        Boolean(site.agent_config?.welcome_customized) &&
          !isGenericWelcomeMessage(site.agent_config?.welcome_message)
      );
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!organization) return;

    const trimmedName = orgName.trim();
    if (!trimmedName) {
      setError(t("dashboard.settings.orgNameRequired"));
      return;
    }

    setSaving(true);
    setError(null);

    const orgRes = await fetch("/api/organization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedName }),
    });

    if (!orgRes.ok) {
      const data = await orgRes.json();
      setError(data.error ?? t("dashboard.settings.orgUpdateFailed"));
      setSaving(false);
      return;
    }

    if (siteId) {
      const site = sites.find((s) => s.id === siteId);
      const prev = site?.agent_config ?? {};
      const trimmedWelcome = welcomeMessage.trim();
      const welcomeCustomized =
        welcomeTouched &&
        trimmedWelcome.length > 0 &&
        !isGenericWelcomeMessage(trimmedWelcome);
      const agentConfig: AgentConfig = {
        ...prev,
        welcome_message: welcomeCustomized ? welcomeMessage.trim() : null,
        welcome_customized: welcomeCustomized,
        welcome_message_lang: welcomeCustomized ? language : null,
        tone,
        language,
        cta_url: ctaUrl || null,
        cta_label: ctaLabel || undefined,
        primary_color: primaryColor,
        header_title_color: headerTitleColor,
        header_font: headerFont,
        logo_url: logoUrl || null,
        contact_whatsapp: whatsappNumber || null,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
      };

      const res = await fetch(`/api/sites/${siteId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_config: agentConfig,
          whatsapp_number: whatsappNumber || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t("dashboard.settings.saveFailed"));
        setSaving(false);
        return;
      }

    }

    await refresh({ silent: true });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !siteId) return;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/sites/${siteId}/logo`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? t("dashboard.settings.uploadFailed"));
        return;
      }
      setLogoUrl(data.logo_url ?? "");
      await refresh({ silent: true });
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  }

  if (orgLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-40 rounded bg-slate-200" />
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-md bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-[max(4rem,env(safe-area-inset-bottom))] md:pb-0">
      <section className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{t("dashboard.settings.title")}</h1>
        <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">{t("dashboard.settings.subtitle")}</p>
        <StatGrid items={settingsStatItems} equalCells className="mt-2 w-full" />
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSave} className="space-y-3">
        <div className="sticky top-0 z-20 -mx-3 border-b border-slate-200/80 bg-slate-50/95 px-3 py-2 backdrop-blur-sm sm:static sm:mx-0 sm:rounded-lg sm:border sm:border-slate-200 sm:bg-white sm:px-3 sm:py-2.5 sm:backdrop-blur-none">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <DashboardTabs
              tabs={settingsTabs}
              active={activeTab}
              onChange={setActiveTab}
              className="min-w-0 flex-1"
            />
            {saveButton(
              "hidden shrink-0 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 sm:inline-flex"
            )}
          </div>
          {activeTab !== "account" && siteSelector ? (
            <div className="mt-2 border-t border-slate-100 pt-2">{siteSelector}</div>
          ) : null}
        </div>

        {activeTab === "account" && (
          <DashboardPanel title={t("dashboard.settings.account")}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t("common.email")}</label>
                <input value={email} disabled className={fieldDisabledClass} />
              </div>
              <div>
                <label htmlFor="org-name" className={labelClass}>
                  {t("dashboard.settings.orgName")}
                </label>
                <input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={t("dashboard.settings.orgNamePlaceholder")}
                  maxLength={120}
                  required
                  className={fieldClass}
                />
                <p className="mt-1 text-xs text-slate-400">{t("dashboard.settings.orgNameHint")}</p>
              </div>
            </div>
          </DashboardPanel>
        )}

        {sites.length === 0 ? (
          activeTab !== "account" && (
            <DashboardPanel title={t("dashboard.settings.noSitesTitle")}>
              <p className="text-sm text-amber-800">{t("dashboard.settings.noSitesBody")}</p>
            </DashboardPanel>
          )
        ) : (
          <>
            {activeTab === "contacts" && (
              <DashboardPanel
                title={t("dashboard.settings.quickContacts")}
                description={t("dashboard.settings.quickContactsHint")}
                action={
                  !proContacts ? (
                    <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                      {t("dashboard.settings.planPro")}
                    </span>
                  ) : undefined
                }
              >
                {!proContacts && (
                  <p className="mb-3 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs text-brand-800">
                    {t("dashboard.settings.proOnlyHint")}
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={labelClass}>{t("dashboard.settings.whatsapp")}</label>
                    <input
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+33612345678"
                      disabled={!proContacts}
                      className={proContacts ? fieldClass : fieldDisabledClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("dashboard.settings.phoneCall")}</label>
                    <input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+33612345678"
                      disabled={!proContacts}
                      className={proContacts ? fieldClass : fieldDisabledClass}
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className={labelClass}>{t("dashboard.settings.contactEmail")}</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contact@entreprise.com"
                      disabled={!proContacts}
                      className={proContacts ? fieldClass : fieldDisabledClass}
                    />
                  </div>
                </div>
              </DashboardPanel>
            )}

            {activeTab === "widget" && (
              <DashboardPanel
                title={t("dashboard.settings.widgetAppearance")}
                description={t("dashboard.settings.widgetAppearanceHint")}
              >
                {!starterBranding ? (
                  <PlanUpgradePanel
                    requiredPlan="starter"
                    titleKey="dashboard.plans.logoTitle"
                    bodyKey="dashboard.plans.logoBody"
                  />
                ) : null}
                <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start">
                  <div className="min-w-0 flex-1">
                    <label className={labelClass}>{t("dashboard.settings.companyLogo")}</label>
                    <div className="mt-2 flex items-center gap-3">
                      {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoUrl}
                          alt={t("dashboard.settings.logo")}
                          className="h-12 w-12 rounded-lg border border-slate-200 object-contain bg-white"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                          —
                        </div>
                      )}
                      <label
                        className={
                          starterBranding
                            ? "cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            : "cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-400"
                        }
                      >
                        {logoUploading ? t("dashboard.settings.uploading") : t("dashboard.settings.chooseImage")}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={logoUploading || !starterBranding}
                        />
                      </label>
                    </div>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder={t("dashboard.settings.logoUrlPlaceholder")}
                      disabled={!starterBranding}
                      className={`${starterBranding ? fieldClass : fieldDisabledClass} mt-2 text-xs`}
                    />
                  </div>
                  <div className="grid w-full gap-4 sm:grid-cols-2 lg:max-w-md">
                    <div>
                      <label className={labelClass}>{t("dashboard.settings.headerBgColor")}</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-10 w-12 cursor-pointer rounded border border-slate-200"
                        />
                        <input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-28 rounded-lg border border-slate-200 px-2 py-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>{t("dashboard.settings.headerNameColor")}</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          value={headerTitleColor}
                          onChange={(e) => setHeaderTitleColor(e.target.value)}
                          className="h-10 w-12 cursor-pointer rounded border border-slate-200"
                        />
                        <input
                          value={headerTitleColor}
                          onChange={(e) => setHeaderTitleColor(e.target.value)}
                          className="w-28 rounded-lg border border-slate-200 px-2 py-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="w-full lg:max-w-xs">
                    <label className={labelClass}>{t("dashboard.settings.headerFontLabel")}</label>
                    <select
                      value={headerFont}
                      onChange={(e) => setHeaderFont(e.target.value)}
                      className={fieldClass}
                    >
                      {HEADER_FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {t(`dashboard.settings.fonts.${f.key}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div
                  className="mt-4 flex items-center gap-3 rounded-lg px-4 py-3"
                  style={{ background: primaryColor, fontFamily: headerFont }}
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" className="h-8 w-8 rounded object-contain bg-white/10" />
                  ) : null}
                  <span className="text-sm font-semibold" style={{ color: headerTitleColor }}>
                    {orgName || t("dashboard.settings.yourCompany")}
                  </span>
                </div>
              </DashboardPanel>
            )}

            {activeTab === "agent" && (
              <DashboardPanel title={t("dashboard.settings.agentIa")}>
                <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3 ring-1 ring-slate-100">
                  <label className={labelClass} htmlFor="welcome-message">
                    {t("dashboard.settings.welcomeMessage")}
                  </label>
                  <textarea
                    id="welcome-message"
                    value={welcomeMessage}
                    onChange={(e) => {
                      setWelcomeTouched(true);
                      setWelcomeMessage(e.target.value);
                    }}
                    placeholder={defaultWelcome}
                    rows={8}
                    className={`${fieldClass} mt-2 max-h-64 min-h-[8.5rem] resize-y overflow-y-auto leading-relaxed font-normal`}
                  />
                  <p className="mt-2 text-xs text-slate-500">{t("dashboard.settings.welcomeHint")}</p>
                  {!welcomeTouched ? (
                    <p className="mt-1 text-xs text-brand-700">{t("dashboard.settings.welcomeAutoHint")}</p>
                  ) : null}
                </div>

                <WelcomeMessagePreview
                  message={welcomeMessage}
                  fallback={defaultWelcome}
                  primaryColor={primaryColor}
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>{t("dashboard.settings.tone")}</label>
                    <select value={tone} onChange={(e) => setTone(e.target.value)} className={fieldClass}>
                      {TONE_VALUES.map((toneValue) => (
                        <option key={toneValue} value={toneValue}>
                          {t(`dashboard.settings.tones.${toneValue}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t("dashboard.settings.language")}</label>
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        if (!welcomeTouched || isGenericWelcomeMessage(welcomeMessage)) {
                          setWelcomeMessage("");
                          setWelcomeTouched(false);
                        }
                      }}
                      className={fieldClass}
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      {t("dashboard.settings.ctaUrl")}
                      {!proContacts && (
                        <span className="ml-1 font-normal text-brand-600">
                          {t("dashboard.settings.ctaUrlPro")}
                        </span>
                      )}
                    </label>
                    <input
                      type="url"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="https://monsite.com/contact"
                      disabled={!proContacts}
                      className={proContacts ? fieldClass : fieldDisabledClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("dashboard.settings.ctaLabel")}</label>
                    <input
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      placeholder={t("dashboard.settings.ctaPlaceholder")}
                      disabled={!proContacts}
                      className={proContacts ? fieldClass : fieldDisabledClass}
                    />
                  </div>
                </div>
              </DashboardPanel>
            )}
          </>
        )}

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:hidden">
          {saveButton(
            "flex w-full items-center justify-center rounded-md bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          )}
        </div>
      </form>
    </div>
  );
}
