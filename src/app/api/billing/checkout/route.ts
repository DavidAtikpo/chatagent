import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { billingApiFetch } from "@/lib/billing-api-proxy";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSessionUser(session)) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const res = await billingApiFetch("billing/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof data === "object" && data && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : typeof data === "object" && data && "error" in data
          ? String((data as { error: unknown }).error)
          : "Erreur Stripe";
    return NextResponse.json({ error: detail }, { status: res.status });
  }
  return NextResponse.json(data);
}
