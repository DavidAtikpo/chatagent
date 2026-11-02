import { queryOne } from "@/lib/db";
import { userOwnsSite } from "@/lib/site-access";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ siteId: string; documentId: string }> }
) {
  try {
    const { siteId, documentId } = await params;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!(await userOwnsSite(user.id, siteId))) {
      return NextResponse.json({ error: "Site non autorisé" }, { status: 403 });
    }

    const doc = await queryOne<{ id: string }>(
      `SELECT id FROM site_documents WHERE id = $1 AND site_id = $2`,
      [documentId, siteId]
    );
    if (!doc) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    await queryOne(
      `DELETE FROM knowledge_chunks WHERE site_id = $1 AND source_url = $2`,
      [siteId, `document://${documentId}`]
    );
    await queryOne(`DELETE FROM site_documents WHERE id = $1`, [documentId]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
