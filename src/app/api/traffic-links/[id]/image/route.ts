import { uploadToCloudinary } from "@/lib/cloudinary";
import { queryOne } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

async function userOwnsLink(userId: string, linkId: string) {
  return queryOne<{ site_id: string; slug: string }>(
    `SELECT tl.site_id, tl.slug
     FROM traffic_links tl
     INNER JOIN sites s ON s.id = tl.site_id
     INNER JOIN organizations o ON o.id = s.organization_id
     WHERE tl.id = $1 AND o.owner_id = $2`,
    [linkId, userId]
  );
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
      return NextResponse.json({ error: "Image trop lourde (max 2 Mo)" }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url: imageUrl } = await uploadToCloudinary(buffer, {
      folder: `yayra/traffic/${link.site_id}`,
      publicId: link.slug,
      mimeType: file.type,
    });

    await queryOne(`UPDATE traffic_links SET image_url = $1 WHERE id = $2 RETURNING id`, [
      imageUrl,
      params.id,
    ]);

    return NextResponse.json({ image_url: imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
