import { uploadToCloudinary } from "@/lib/cloudinary";
import { queryOne } from "@/lib/db";
import { hasStarterFeatures } from "@/lib/plans";
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

    const orgPlan = await queryOne<{ subscription_plan: string; subscription_status: string }>(
      `SELECT o.subscription_plan, o.subscription_status
       FROM sites s
       JOIN organizations o ON o.id = s.organization_id
       WHERE s.id = $1`,
      [siteId]
    );
    if (!hasStarterFeatures(orgPlan)) {
      return NextResponse.json(
        { error: "Logo réservé au plan Starter ou supérieur", code: "plan_starter_required" },
        { status: 403 }
      );
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
    const buffer = Buffer.from(await file.arrayBuffer());

    const { url: logoUrl } = await uploadToCloudinary(buffer, {
      folder: `yayra/branding/${siteId}`,
      publicId: `logo-${Date.now()}`,
      mimeType: file.type,
    });

    const site = await queryOne<{ agent_config: Record<string, unknown> }>(
      `SELECT agent_config FROM sites WHERE id = $1`,
      [siteId]
    );

    const config = { ...(site?.agent_config ?? {}), logo_url: logoUrl };
    await queryOne(`UPDATE sites SET agent_config = $1::jsonb WHERE id = $2 RETURNING id`, [
      JSON.stringify(config),
      siteId,
    ]);

    return NextResponse.json({ logo_url: logoUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
