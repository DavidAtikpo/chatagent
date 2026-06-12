import { createAdminClient } from "@/lib/setup-account-server";
import { getOwnerSiteIds } from "@/lib/org-server";
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

    const siteIds = await getOwnerSiteIds(user.id);
    if (!siteIds.length) {
      return NextResponse.json({ conversations: [] });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const admin = createAdminClient();
    let query = admin
      .from("conversations")
      .select("id, status, lead_score, page_url, updated_at, sites(name)")
      .in("site_id", siteIds)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversations: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
