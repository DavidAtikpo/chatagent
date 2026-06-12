/** Contact support — override via NEXT_PUBLIC_SUPPORT_EMAIL */
export function getSupportEmail(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  if (fromEnv) return fromEnv;
  return "support@chatagent.app";
}

export function accountDeletionMailto(email: string, details: string): string {
  const support = getSupportEmail();
  const subject = encodeURIComponent("Demande de suppression de compte — ChatAgent");
  const body = encodeURIComponent(
    `Bonjour,

Je demande la suppression de mon compte ChatAgent et des données associées.

E-mail du compte : ${email}

Application concernée :
[ ] ChatAgent Conseiller (mobile)
[ ] Dashboard web ChatAgent

Détails (optionnel) :
${details || "(aucun)"}

Merci.`
  );
  return `mailto:${support}?subject=${subject}&body=${body}`;
}
