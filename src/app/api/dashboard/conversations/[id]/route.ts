import { createAdminClient } from "@/lib/setup-account-server";
import { getOwnerSiteIds } from "@/lib/org-server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    const admin = createAdminClient();
    const { data: conversation, error: convError } = await admin
      .from("conversations")
      .select(
        "id, site_id, status, lead_score, page_url, qualification_data, created_at, updated_at, sites(name, url), leads(id, name, email, phone, score)"
      )
      .eq("id", params.id)
      .maybeSingle();

    if (convError || !conversation || !siteIds.includes(conversation.site_id)) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    const { site_id: _siteId, ...conv } = conversation;

    const { data: messages, error: msgError } = await admin
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", params.id)
      .order("created_at", { ascending: true });

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    return NextResponse.json({
      conversation: conv,
      messages: messages ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
