"use client";

import { hasProFeatures } from "@/lib/plans";
import { AgentConfig } from "@/lib/dashboard-data";
import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const TONES = [
  { value: "professional", label: "Professionnel" },
  { value: "friendly", label: "Amical" },
  { value: "casual", label: "Décontracté" },
  { value: "formal", label: "Formel" },
];

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
];

const HEADER_FONTS = [
  { value: "system-ui, -apple-system, sans-serif", label: "Systeme (par defaut)" },
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia — serif" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "'Trebuchet MS', sans-serif", label: "Trebuchet MS" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "'Courier New', monospace", label: "Courier — monospace" },
];

function applySiteConfig(
  config: AgentConfig,
  whatsappFromSite: string | null | undefined,
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
  setters.setWelcomeMessage(config.welcome_message ?? "Bonjour ! Comment puis-je vous aider ?");
  setters.setTone(config.tone ?? "professional");
  setters.setLanguage(config.language ?? "fr");
  setters.setCtaUrl(config.cta_url ?? "");
  setters.setCtaLabel(config.cta_label ?? "");
  setters.setWhatsappNumber(config.contact_whatsapp ?? whatsappFromSite ?? "");
  setters.setContactPhone(config.contact_phone ?? "");
  setters.setContactEmail(config.contact_email ?? "");
  setters.setPrimaryColor(config.primary_color ?? "#6366f1");
  setters.setHeaderTitleColor(config.header_title_color ?? "#ffffff");
  setters.setHeaderFont(config.header_font ?? "system-ui, -apple-system, sans-serif");
  setters.setLogoUrl(config.logo_url ?? "");
}

export default function SettingsPage() {
  const { organization, sites, email, loading: orgLoading, refresh } = useOrganization();
  const proContacts = hasProFeatures(organization);
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
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [headerTitleColor, setHeaderTitleColor] = useState("#ffffff");
  const [headerFont, setHeaderFont] = useState("system-ui, -apple-system, sans-serif");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    applySiteConfig(site.agent_config ?? {}, site.whatsapp_number, setters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites, siteId]);

  function handleSiteChange(id: string) {
    setSiteId(id);
    const site = sites.find((s) => s.id === id);
    if (site) applySiteConfig(site.agent_config ?? {}, site.whatsapp_number, setters);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!organization) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    await supabase.from("organizations").update({ name: orgName }).eq("id", organization.id);

    if (siteId) {
      const site = sites.find((s) => s.id === siteId);
      const prev = site?.agent_config ?? {};
      const agentConfig: AgentConfig = {
        ...prev,
        welcome_message: welcomeMessage,
        welcome_customized: true,
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
        setError(data.error ?? "Enregistrement échoué");
        setSaving(false);
        return;
      }

      await refresh({ silent: true });
    }

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
        alert(data.error ?? "Upload echoue");
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
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Paramètres</h1>
      <p className="mt-0.5 text-sm text-slate-600">Configuration de votre compte et de votre agent.</p>

      {error && (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSave} className="mt-3 max-w-2xl space-y-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Compte</h2>
          <div className="mt-3">
            <label className="text-xs text-slate-500">Email</label>
            <input
              value={email}
              disabled
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div className="mt-3">
            <label className="text-xs text-slate-500">Nom de l&apos;entreprise</label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>
        </div>

        {sites.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Aucun site configuré</p>
            <p className="mt-1 text-amber-800">
              Ajoutez d&apos;abord un site dans{" "}
              <a href="/dashboard/sites" className="font-medium underline">
                Sites
              </a>{" "}
              pour configurer l&apos;agent, les contacts et l&apos;apparence du chat.
            </p>
          </div>
        ) : (
          <>
            <div
              className={`rounded-lg border p-4 shadow-sm ${
                proContacts ? "border-emerald-200 bg-white" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">Contacts rapides</h2>
                {!proContacts && (
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                    Plan Pro
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Boutons WhatsApp, Appel et Email en bas du chat (icônes cliquables).
              </p>
              {!proContacts && (
                <p className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                  Réservé au <strong>Plan Pro</strong>. Passez au Pro pour activer WhatsApp, appel et
                  email dans le widget.
                </p>
              )}
              <div className="mt-3">
                <label className="text-xs text-slate-500">Site à configurer</label>
                <select
                  value={siteId}
                  onChange={(e) => handleSiteChange(e.target.value)}
                  disabled={!proContacts}
                  className="mt-1 w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">WhatsApp</label>
                  <input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+33612345678"
                    disabled={!proContacts}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Téléphone (appel)</label>
                  <input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+33612345678"
                    disabled={!proContacts}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@entreprise.com"
                    disabled={!proContacts}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold">Apparence du chat (widget)</h2>
              <p className="mt-1 text-xs text-slate-500">
                Logo, couleurs et police affiches dans l&apos;en-tete du chat sur votre site.
              </p>
              <div className="mt-2 flex flex-wrap items-start gap-4">
                <div>
                  <label className="text-xs text-slate-500">Logo entreprise</label>
                  <div className="mt-2 flex items-center gap-3">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-12 w-12 rounded-lg border border-slate-200 object-contain bg-white"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                        —
                      </div>
                    )}
                    <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      {logoUploading ? "Envoi…" : "Choisir une image"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Ou URL du logo (https://…)"
                    className="mt-2 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-500">Couleur fond header</label>
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
                    <label className="text-xs text-slate-500">Couleur nom entreprise</label>
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
                <div className="w-full max-w-xs">
                  <label className="text-xs text-slate-500">Police du header</label>
                  <select
                    value={headerFont}
                    onChange={(e) => setHeaderFont(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {HEADER_FONTS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
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
                  {orgName || "Votre entreprise"}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold">Agent IA</h2>
              <div className="mt-3">
                <label className="text-xs text-slate-500">Message d&apos;accueil</label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Laissez vide ou générique pour génération auto depuis le site (au re-crawl).
                </p>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-500">Ton</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {TONES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Langue</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-500">
                    URL du CTA (optionnel)
                    {!proContacts && (
                      <span className="ml-1 text-indigo-600">· Plan Pro</span>
                    )}
                  </label>
                  <input
                    type="url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://monsite.com/contact"
                    disabled={!proContacts}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Label du CTA</label>
                  <input
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="S'inscrire"
                    disabled={!proContacts}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : saved ? "Enregistré !" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
