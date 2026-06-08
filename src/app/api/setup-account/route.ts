import { setupAccountForUser } from "@/lib/setup-account-server";
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
    const companyName = String(body.companyName ?? "").trim();
    const siteUrl = String(body.siteUrl ?? "").trim();

    if (!companyName || !siteUrl) {
      return NextResponse.json({ error: "Nom et URL requis" }, { status: 400 });
    }

    await supabase.auth.updateUser({
      data: { company_name: companyName, site_url: siteUrl },
    });

    const { organizationId, siteId } = await setupAccountForUser(
      user.id,
      companyName,
      siteUrl
    );

    return NextResponse.json({
      organizationId,
      siteId,
      organization: { id: organizationId, name: companyName },
    });
  } catch (err) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : err instanceof Error
          ? err.message
          : "Erreur serveur";

    console.error("[setup-account]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
