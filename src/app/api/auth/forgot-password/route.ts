import { getAuthBaseUrl } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let email: string;
  try {
    const body = await request.json();
    email = String(body.email ?? "")
      .trim()
      .toLowerCase();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const baseUrl = getAuthBaseUrl(request);
  const redirectTo = `${baseUrl}/auth/callback?next=/login/reset-password`;

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    console.error("[forgot-password]", error.message, { redirectTo, email });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
