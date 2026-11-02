import { NextResponse } from "next/server";

/** Ancien flux Supabase Auth — redirige vers le dashboard ou la connexion. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard/add-profile";
  const session = searchParams.get("code") || searchParams.get("token_hash");
  if (session) {
    return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login`);
}
