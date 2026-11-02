import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { fetchAgentConversation } from "@/lib/handoff-server";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!isSessionUser(session)) return session;

  try {
    const data = await fetchAgentConversation(session.id, params.id);
    if (!data) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
