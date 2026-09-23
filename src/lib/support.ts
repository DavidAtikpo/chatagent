import { MOBILE_APP_NAME, SAAS_NAME } from "@/lib/branding";

/** Contact support — override via NEXT_PUBLIC_SUPPORT_EMAIL */
export function getSupportEmail(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  if (fromEnv) return fromEnv;
  return "support@chatagent.app";
}

export function accountDeletionMailto(email: string, details: string): string {
  const support = getSupportEmail();
  const subject = encodeURIComponent(`Demande de suppression de compte — ${SAAS_NAME}`);
  const body = encodeURIComponent(
    `Bonjour,

Je demande la suppression de mon compte ${SAAS_NAME} et des données associées.

E-mail du compte : ${email}

Application concernée :
[ ] ${MOBILE_APP_NAME} (mobile)
[ ] Dashboard web ${SAAS_NAME}

Détails (optionnel) :
${details || "(aucun)"}

Merci.`
  );
  return `mailto:${support}?subject=${subject}&body=${body}`;
}
