import { createAdminClient } from "@/lib/setup-account-server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

async function userOwnsLink(userId: string, linkId: string) {
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("traffic_links")
    .select("site_id, slug")
    .eq("id", linkId)
    .maybeSingle();
  if (!link) return null;

  const { data: site } = await admin
    .from("sites")
    .select("organization_id")
    .eq("id", link.site_id)
    .maybeSingle();
  if (!site) return null;

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("id", site.organization_id)
    .eq("owner_id", userId)
    .maybeSingle();

  return org ? link : null;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const link = await userOwnsLink(user.id, params.id);
    if (!link) {
      return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Format image non supporté (PNG, JPG, WebP, GIF)" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image trop lourde (max 2 Mo)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${link.site_id}/traffic/${link.slug}.${ext}`;
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
    const imageUrl = publicUrl.publicUrl;

    const { error: updateError } = await admin
      .from("traffic_links")
      .update({ image_url: imageUrl })
      .eq("id", params.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ image_url: imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
