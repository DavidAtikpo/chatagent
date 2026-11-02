export type SupportEmailPayload = {
  to: string;
  fromUserEmail: string;
  organizationName: string | null;
  category: string;
  subject: string;
  message: string;
};

export async function sendSupportMessageEmail(payload: SupportEmailPayload): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "Yayra <onboarding@resend.dev>";
  const to = payload.to.trim();

  const orgLine = payload.organizationName
    ? `<p><strong>Organisation :</strong> ${escapeHtml(payload.organizationName)}</p>`
    : "";

  const html = `
    <p>Nouveau message support depuis le dashboard.</p>
    ${orgLine}
    <p><strong>De :</strong> ${escapeHtml(payload.fromUserEmail)}</p>
    <p><strong>Catégorie :</strong> ${escapeHtml(payload.category)}</p>
    <p><strong>Sujet :</strong> ${escapeHtml(payload.subject)}</p>
    <hr />
    <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(payload.message)}</pre>
  `;

  if (!resendKey) {
    console.info("[support] RESEND_API_KEY absent — message enregistré en base uniquement.");
    console.info("[support] Destinataire prévu:", to);
    console.info("[support] Sujet:", payload.subject);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.fromUserEmail,
      subject: `[Support] ${payload.subject}`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Envoi email support échoué: ${body.slice(0, 200)}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
