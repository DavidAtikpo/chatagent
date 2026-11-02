import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { queryOne } from "@/lib/db";
import { sendSupportMessageEmail } from "@/lib/email/send-support-message";
import { NextResponse } from "next/server";

const CATEGORIES = new Set(["general", "billing", "technical", "account"]);

async function resolveOrganization(userId: string): Promise<{ id: string; name: string } | null> {
  const owned = await queryOne<{ id: string; name: string }>(
    `SELECT id, name FROM organizations WHERE owner_id = $1 LIMIT 1`,
    [userId]
  );
  if (owned) return owned;

  return queryOne<{ id: string; name: string }>(
    `SELECT o.id, o.name
     FROM organizations o
     INNER JOIN organization_members om ON om.organization_id = o.id
     WHERE om.user_id = $1
     LIMIT 1`,
    [userId]
  );
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!isSessionUser(session)) return session;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
    }

    const raw = body as Record<string, unknown>;
    const subject = String(raw.subject ?? "").trim();
    const message = String(raw.message ?? "").trim();
    const category = String(raw.category ?? "general").trim().toLowerCase();

    if (!subject || subject.length > 200) {
      return NextResponse.json({ error: "Sujet invalide (1–200 caractères)" }, { status: 400 });
    }
    if (message.length < 10 || message.length > 8000) {
      return NextResponse.json(
        { error: "Message invalide (10–8000 caractères)" },
        { status: 400 }
      );
    }
    if (!CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
    }

    const org = await resolveOrganization(session.id);
    const teamEmail = process.env.SUPPORT_TEAM_EMAIL?.trim();

    await queryOne<{ id: string }>(
      `INSERT INTO support_messages (
         user_id, organization_id, user_email, organization_name,
         subject, category, message
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        session.id,
        org?.id ?? null,
        session.email,
        org?.name ?? null,
        subject,
        category,
        message,
      ]
    );

    if (teamEmail) {
      await sendSupportMessageEmail({
        to: teamEmail,
        fromUserEmail: session.email,
        organizationName: org?.name ?? null,
        category,
        subject,
        message,
      });
    } else {
      console.info("[support] SUPPORT_TEAM_EMAIL absent — message stocké en base.");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[support]", err);
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
