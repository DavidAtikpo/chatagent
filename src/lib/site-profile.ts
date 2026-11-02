export type SiteProfileType = "website" | "job_search" | "other";

export type OtherProfileSubtype =
  | "freelance"
  | "ngo"
  | "event"
  | "real_estate"
  | "artist"
  | "training"
  | "custom";

export type WebsiteContactFields = {
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
};

export function buildWebsiteBootstrap(
  name: string,
  url: string,
  contact: WebsiteContactFields
): { businessDescription: string; hasContactFallback: boolean } {
  const email = contact.contactEmail?.trim();
  const phone = contact.contactPhone?.trim();
  const whatsapp = contact.contactWhatsapp?.trim();
  const hasAny = Boolean(email || phone || whatsapp);

  const lines = [
    `[SITE WEB — ${name}]`,
    "",
    `URL crawlée : ${url}`,
    "",
    "Le contenu principal provient du crawl automatique du site.",
  ];

  if (hasAny) {
    lines.push(
      "",
      "Contacts de secours (si le site n'a pas de page contact ou infos incomplètes après crawl) :"
    );
    if (email) lines.push(`Email : ${email}`);
    if (phone) lines.push(`Téléphone : ${phone}`);
    if (whatsapp) lines.push(`WhatsApp : ${whatsapp}`);
  }

  return { businessDescription: lines.join("\n"), hasContactFallback: hasAny };
}

/** Candidat en recherche d'emploi ou campagne de recrutement (employeur). */
export type JobProfileMode = "candidate" | "recruitment";

export type JobSearchProfileFields = {
  mode: JobProfileMode;
  targetRole: string;
  skillsText: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
};

export type OtherProfileFields = {
  subtype: OtherProfileSubtype;
  offerSummary: string;
  details: string;
  pricing?: string;
  location?: string;
  eventEndDate?: string;
};

export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function buildJobSearchDescription(name: string, f: JobSearchProfileFields): string {
  if (f.mode === "recruitment") {
    return buildJobRecruitmentDescription(name, f);
  }
  return buildJobCandidateDescription(name, f);
}

function buildJobCandidateDescription(name: string, f: JobSearchProfileFields): string {
  const lines = [
    `[PROFIL CANDIDAT — RECHERCHE D'EMPLOI — ${name}]`,
    "",
    "Poste ou type de poste recherché :",
    f.targetRole.trim(),
    "",
    "Compétences et parcours (source candidat) :",
    f.skillsText.trim(),
    "",
    "Consignes pour l'IA Yayra :",
    "- Reformuler ce profil en une présentation professionnelle, claire et attractive pour les recruteurs.",
    "- Mettre en avant les compétences clés et la valeur apportée.",
    "- Rester factuel : ne pas inventer d'expérience ou de diplôme absents du texte ou du CV indexé.",
    "- Inviter le recruteur intéressé à contacter le candidat via les boutons de contact du widget.",
  ];
  if (f.contactEmail?.trim()) lines.push("", `Contact candidat (email) : ${f.contactEmail.trim()}`);
  if (f.contactPhone?.trim()) lines.push(`Contact candidat (téléphone) : ${f.contactPhone.trim()}`);
  if (f.contactWhatsapp?.trim()) lines.push(`Contact candidat (WhatsApp) : ${f.contactWhatsapp.trim()}`);
  return lines.join("\n");
}

function buildJobRecruitmentDescription(name: string, f: JobSearchProfileFields): string {
  const lines = [
    `[CAMPAGNE DE RECRUTEMENT — ${name}]`,
    "",
    "Poste à pourvoir / intitulé :",
    f.targetRole.trim(),
    "",
    "Description du poste, profil recherché, avantages, processus (source employeur) :",
    f.skillsText.trim(),
    "",
    "Consignes pour l'IA Yayra :",
    "- Rédiger une annonce / présentation attractive pour attirer des candidats qualifiés.",
    "- Mettre en avant missions, compétences recherchées, conditions et étapes de candidature.",
    "- Rester factuel : ne pas inventer salaire, avantages ou exigences absents du texte ou des PDF indexés.",
    "- Inviter les candidats intéressés à poser des questions ou à postuler via les boutons de contact du widget.",
  ];
  if (f.contactEmail?.trim()) lines.push("", `Contact recrutement (email) : ${f.contactEmail.trim()}`);
  if (f.contactPhone?.trim()) lines.push(`Contact recrutement (téléphone) : ${f.contactPhone.trim()}`);
  if (f.contactWhatsapp?.trim()) lines.push(`Contact recrutement (WhatsApp) : ${f.contactWhatsapp.trim()}`);
  return lines.join("\n");
}

export function jobProfileModeFromMeta(meta: Record<string, unknown> | undefined): JobProfileMode {
  return meta?.mode === "recruitment" ? "recruitment" : "candidate";
}

const OTHER_SUBTYPE_LABELS: Record<OtherProfileSubtype, string> = {
  freelance: "Freelance / prestataire de services",
  ngo: "Association / ONG / initiative communautaire",
  event: "Événement",
  real_estate: "Immobilier",
  artist: "Artiste / créateur de contenu",
  training: "Formation / cours",
  custom: "Autre projet",
};

export function buildOtherDescription(name: string, f: OtherProfileFields): string {
  const kind = OTHER_SUBTYPE_LABELS[f.subtype] ?? f.subtype;
  const lines = [
    `[PROFIL — ${kind} — ${name}]`,
    "",
    "Résumé de l'offre ou du projet :",
    f.offerSummary.trim(),
    "",
    "Détails :",
    f.details.trim(),
  ];
  if (f.pricing?.trim()) lines.push("", "Tarifs / budget / dons :", f.pricing.trim());
  if (f.location?.trim()) lines.push("", "Lieu :", f.location.trim());
  if (f.subtype === "event" && f.eventEndDate?.trim()) {
    lines.push("", `Date de fin de l'événement (usage temporaire) : ${f.eventEndDate.trim()}`);
  }
  lines.push(
    "",
    "L'assistant aide les visiteurs selon ce type de profil (informations, inscription, contact, sensibilisation)."
  );
  return lines.join("\n");
}
