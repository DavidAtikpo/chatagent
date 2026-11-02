import { hashPassword, passwordNeedsUpgrade, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    const user = await queryOne<{ id: string; email: string; password_hash: string | null }>(
      `SELECT id, email, password_hash FROM app_users WHERE email = $1`,
      [email]
    );

    if (!user) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
    }
    if (!user.password_hash) {
      return NextResponse.json(
        {
          error:
            "Mot de passe non défini pour ce compte (migration). Utilisez « Mot de passe oublié » pour en choisir un.",
        },
        { status: 401 }
      );
    }
    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
    }

    if (passwordNeedsUpgrade(user.password_hash)) {
      await queryOne(
        `UPDATE app_users SET password_hash = $1, updated_at = now() WHERE id = $2`,
        [hashPassword(password), user.id]
      );
    }

    const token = await createSessionToken({ id: user.id, email: user.email });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
