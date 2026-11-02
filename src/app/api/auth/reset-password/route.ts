import { hashPassword } from "@/lib/auth/password";
import {
  markPasswordResetTokenUsed,
  verifyPasswordResetToken,
} from "@/lib/auth/reset-token";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "").trim();
    const password = String(body.password ?? "");

    if (!token) {
      return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Mot de passe : 8 caractères minimum" }, { status: 400 });
    }

    const userId = await verifyPasswordResetToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const user = await queryOne<{ id: string; email: string }>(
      `UPDATE app_users SET password_hash = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, email`,
      [passwordHash, userId]
    );

    if (!user) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    await markPasswordResetTokenUsed(token);

    const sessionToken = await createSessionToken({ id: user.id, email: user.email });
    await setSessionCookie(sessionToken);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
