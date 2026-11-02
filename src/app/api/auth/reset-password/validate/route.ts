import { verifyPasswordResetToken } from "@/lib/auth/reset-token";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ valid: false });
  }
  const userId = await verifyPasswordResetToken(token);
  return NextResponse.json({ valid: Boolean(userId) });
}
