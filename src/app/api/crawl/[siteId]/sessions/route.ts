import { getBackendApiUrl } from "@/lib/api-backend";
import { userOwnsSite } from "@/lib/site-access";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: { siteId: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!(await userOwnsSite(user.id, params.siteId))) {
      return NextResponse.json({ error: "Site non autorisé" }, { status: 403 });
    }

    const api = getBackendApiUrl();
    const res = await fetch(`${api}/crawl/${params.siteId}/sessions`, {
      method: "POST",
      signal: AbortSignal.timeout(120000),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: text || `Erreur API (${res.status})` }, { status: res.status });
    }

    return NextResponse.json(text ? JSON.parse(text) : { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "API inaccessible";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
