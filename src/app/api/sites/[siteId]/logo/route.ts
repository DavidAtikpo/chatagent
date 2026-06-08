import { createAdminClient } from "@/lib/setup-account-server";
import { userOwnsSite } from "@/lib/site-access";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"]);

export async function POST(
  request: Request,
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

    const siteId = params.siteId;
    if (!(await userOwnsSite(user.id, siteId))) {
      return NextResponse.json({ error: "Site non autorisé" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Format image non supporté" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image trop lourde (max 2 Mo)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${siteId}/logo.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage.from("branding").upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      return NextResponse.json(
        {
          error:
            uploadError.message +
            " — exécutez supabase/migrations/006_branding_storage.sql si le bucket n'existe pas.",
        },
        { status: 500 }
      );
    }

    const { data: publicUrl } = admin.storage.from("branding").getPublicUrl(path);

    const { data: site } = await admin
      .from("sites")
      .select("agent_config")
      .eq("id", siteId)
      .single();

    const config = { ...(site?.agent_config ?? {}), logo_url: publicUrl.publicUrl };
    await admin.from("sites").update({ agent_config: config }).eq("id", siteId);

    return NextResponse.json({ logo_url: publicUrl.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
