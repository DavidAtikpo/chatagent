import { getBackendApiUrl } from "@/lib/api-backend";
import { userOwnsSite } from "@/lib/site-access";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const siteId = String(body.siteId ?? "");
    if (!siteId) {
      return NextResponse.json({ error: "siteId requis" }, { status: 400 });
    }

    if (!(await userOwnsSite(user.id, siteId))) {
      return NextResponse.json({ error: "Site non autorisé" }, { status: 403 });
    }

    const api = getBackendApiUrl();
    const res = await fetch(`${api}/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_id: siteId }),
      signal: AbortSignal.timeout(90000),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: text || `Erreur API (${res.status})` }, { status: res.status });
    }

    return NextResponse.json(text ? JSON.parse(text) : { ok: true });
  } catch (err) {
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "API trop lente — Render (plan Free) peut mettre ~1 min à démarrer, réessayez"
        : err instanceof Error
          ? err.message
          : "API inaccessible";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
