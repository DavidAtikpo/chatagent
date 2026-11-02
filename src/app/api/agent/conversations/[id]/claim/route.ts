import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { claimHandoff } from "@/lib/handoff-server";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!isSessionUser(session)) return session;

  try {
    const result = await claimHandoff(session.id, params.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prise en charge impossible";
    const status = message.includes("Déjà") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
