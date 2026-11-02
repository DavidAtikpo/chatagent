import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { billingApiFetch } from "@/lib/billing-api-proxy";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireSession();
  if (!isSessionUser(session)) return session;

  const res = await billingApiFetch("billing/invoices", { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { detail?: string }).detail ?? "Erreur factures" },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
