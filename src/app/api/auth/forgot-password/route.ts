import { createPasswordResetToken } from "@/lib/auth/reset-token";
import { sendPasswordResetEmail } from "@/lib/email/send-reset-password";
import { getAuthBaseUrl } from "@/lib/request-origin";
import { queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let email: string;
  try {
    const body = await request.json();
    email = String(body.email ?? "")
      .trim()
      .toLowerCase();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  try {
    const user = await queryOne<{ id: string; email: string }>(
      `SELECT id, email FROM app_users WHERE email = $1`,
      [email]
    );

    if (user) {
      const raw = await createPasswordResetToken(user.id);
      const baseUrl = getAuthBaseUrl(request);
      const resetUrl = `${baseUrl}/login/reset-password?token=${encodeURIComponent(raw)}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Impossible d'envoyer l'email" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message:
      "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
  });
}
