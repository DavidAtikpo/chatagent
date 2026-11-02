import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { setupAccountForUser } from "@/lib/setup-account-server";
import { queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!isSessionUser(session)) return session;

    const body = await request.json();
    const companyName = String(body.companyName ?? "").trim();
    if (!companyName) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    const { organizationId, siteId } = await setupAccountForUser(session.id, {
      companyName,
    });

    const org = await queryOne<{ name: string }>(
      `SELECT name FROM organizations WHERE id = $1`,
      [organizationId]
    );

    return NextResponse.json({
      organizationId,
      siteId,
      organization: { id: organizationId, name: org?.name ?? companyName },
    });
  } catch (err) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : err instanceof Error
          ? err.message
          : "Erreur serveur";

    console.error("[setup-account]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
