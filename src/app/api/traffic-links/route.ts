import { buildTrackedLinkStats } from "@/lib/dashboard-data";
import { createAdminClient } from "@/lib/setup-account-server";
import { createClient } from "@/lib/supabase/server";
import {
  isMissingTrafficLinkImageColumn,
  listTrafficLinksForSites,
} from "@/lib/traffic-links-db";
import { NextResponse } from "next/server";

async function getUserOrgSiteIds(userId: string) {
  const admin = createAdminClient();
  const { data: orgs } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_id", userId);

  if (!orgs?.length) return [];

  const orgIds = orgs.map((o) => o.id);
  const { data: sites } = await admin
    .from("sites")
    .select("id")
    .in("organization_id", orgIds);

  return sites?.map((s) => s.id) ?? [];
}

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const siteIds = await getUserOrgSiteIds(user.id);
    if (!siteIds.length) {
      return NextResponse.json({ links: [] });
    }

    const admin = createAdminClient();
    const { data, error } = await listTrafficLinksForSites(admin, siteIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const links = buildTrackedLinkStats(data ?? []);

    return NextResponse.json({ links });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const slug = String(body.slug ?? "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const source = String(body.source ?? "direct_link");
    const label = body.label ? String(body.label) : null;
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;

    if (!siteId || !slug) {
      return NextResponse.json({ error: "Site et slug requis" }, { status: 400 });
    }

    const siteIds = await getUserOrgSiteIds(user.id);
    if (!siteIds.includes(siteId)) {
      return NextResponse.json({ error: "Site non autorisé" }, { status: 403 });
    }

    const admin = createAdminClient();
    const insertPayload: Record<string, unknown> = {
      site_id: siteId,
      slug,
      source,
      label,
      click_count: 0,
    };
    if (imageUrl) insertPayload.image_url = imageUrl;

    let result = await admin
      .from("traffic_links")
      .insert(insertPayload)
      .select("id, slug, source, label, image_url, click_count, created_at, sites(name, widget_key)")
      .single();

    if (result.error && isMissingTrafficLinkImageColumn(result.error)) {
      delete insertPayload.image_url;
      result = await admin
        .from("traffic_links")
        .insert(insertPayload)
        .select("id, slug, source, label, click_count, created_at, sites(name, widget_key)")
        .single();
      if (!result.error && result.data) {
        result = { ...result, data: { ...result.data, image_url: null } };
      }
    }

    const { data, error } = result;
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Ce slug existe déjà pour ce site" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ link: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
