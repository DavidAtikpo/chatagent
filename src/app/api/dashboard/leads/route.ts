import { createAdminClient } from "@/lib/setup-account-server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: organization } = await admin
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!organization) {
      return NextResponse.json({ leads: [] });
    }

    const { searchParams } = new URL(request.url);
    const minScore = Number(searchParams.get("minScore") ?? "0");

    let query = admin
      .from("leads")
      .select("id, score, name, email, phone, country, conversation_id, created_at, sites(name)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (minScore > 0) {
      query = query.gte("score", minScore);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
