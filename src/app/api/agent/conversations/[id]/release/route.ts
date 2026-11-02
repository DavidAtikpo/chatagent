import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { releaseHandoff } from "@/lib/handoff-server";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!isSessionUser(session)) return session;

  try {
    const result = await releaseHandoff(session.id, params.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Libération impossible";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
