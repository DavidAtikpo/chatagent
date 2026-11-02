import { userOwnsSite } from "@/lib/site-access";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
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

    const body = await request.json();
    const text = String(body.text ?? "").trim();
    if (text.length < 30) {
      return NextResponse.json(
        { error: "Description trop courte (30 caractères minimum)" },
        { status: 400 }
      );
    }

    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000/api/v1";
    let res: Response;
    try {
      res = await fetch(`${apiUrl}/ingest/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: siteId, text }),
      });
    } catch {
      return NextResponse.json(
        {
          error:
            "API indisponible. Démarrez le backend : cd chatagentapi puis .\\start-api.ps1 (http://localhost:8000)",
        },
        { status: 503 }
      );
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail ?? data.error ?? "Indexation échouée" },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
      );
    }

    return NextResponse.json({ ok: true, embeddings: data.embeddings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
