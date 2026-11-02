import { getSession, type SessionUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function requireSession(): Promise<SessionUser | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return session;
}

export function isSessionUser(value: SessionUser | NextResponse): value is SessionUser {
  return !(value instanceof NextResponse);
}
