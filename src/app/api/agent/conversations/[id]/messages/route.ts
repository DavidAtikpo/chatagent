import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { sendHumanMessage } from "@/lib/handoff-server";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!isSessionUser(session)) return session;

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  try {
    const message = await sendHumanMessage(session.id, params.id, body.content ?? "");
    return NextResponse.json({ message });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Envoi impossible";
    const status = message.includes("autre") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
