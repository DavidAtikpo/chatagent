export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "Yayra <onboarding@resend.dev>";

  if (!resendKey) {
    console.info("[password-reset] Lien (dev, RESEND_API_KEY absent):", resetUrl);
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
      subject: "Réinitialiser votre mot de passe Yayra",
      html: `
        <p>Bonjour,</p>
        <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe (valide 24 h) :</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Envoi email échoué: ${body.slice(0, 200)}`);
  }
}
