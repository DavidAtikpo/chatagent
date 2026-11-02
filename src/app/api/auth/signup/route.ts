import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { queryOne } from "@/lib/db";
import { setupAccountForUser } from "@/lib/setup-account-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    const companyName = String(body.companyName ?? body.name ?? "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Mot de passe : 8 caractères minimum" }, { status: 400 });
    }
    if (!companyName) {
      return NextResponse.json({ error: "Nom d'entreprise requis" }, { status: 400 });
    }

    const existing = await queryOne(`SELECT id FROM app_users WHERE email = $1`, [email]);
    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email" }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const user = await queryOne<{ id: string; email: string }>(
      `INSERT INTO app_users (email, password_hash, email_verified_at)
       VALUES ($1, $2, now())
       RETURNING id, email`,
      [email, passwordHash]
    );

    if (!user) {
      return NextResponse.json({ error: "Impossible de créer le compte" }, { status: 500 });
    }

    await setupAccountForUser(user.id, { companyName });

    const token = await createSessionToken({ id: user.id, email: user.email });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
