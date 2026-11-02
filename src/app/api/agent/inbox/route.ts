import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { fetchAgentInbox } from "@/lib/handoff-server";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireSession();
  if (!isSessionUser(session)) return session;

  try {
    const inbox = await fetchAgentInbox(session.id);
    return NextResponse.json(inbox);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
