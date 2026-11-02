import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { trackedLinkUrl } from "@/lib/app-url";
import { queryOne } from "@/lib/db";
import { canCreateProfileType } from "@/lib/plans";
import { jobProfileModeFromMeta, slugFromName, type SiteProfileType } from "@/lib/site-profile";
import { NextResponse } from "next/server";

function newWidgetKey() {
  return `wk_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

const VALID_PROFILE_TYPES: SiteProfileType[] = ["website", "job_search", "other"];

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!isSessionUser(session)) return session;

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const profileTypeRaw = String(body.profileType ?? "website").trim() as SiteProfileType;
    const profileType: SiteProfileType = VALID_PROFILE_TYPES.includes(profileTypeRaw)
      ? profileTypeRaw
      : "website";
    const profileSubtype =
      body.profileSubtype != null ? String(body.profileSubtype).trim() || null : null;
    const profileMeta =
      body.profileMeta && typeof body.profileMeta === "object" ? body.profileMeta : {};

    const noWebsite = profileType !== "website" || Boolean(body.noWebsite);
    const urlRaw = body.url != null ? String(body.url).trim() : "";
    const url = profileType === "website" && !noWebsite ? urlRaw || null : null;
    const businessDescription =
      body.businessDescription != null ? String(body.businessDescription).trim() : null;
    const organizationId = String(body.organizationId ?? "").trim();

    const contact = body.contact && typeof body.contact === "object" ? body.contact : null;

    if (!name || !organizationId) {
      return NextResponse.json({ error: "Nom et organisation requis" }, { status: 400 });
    }
    if (profileType === "website" && !url) {
      return NextResponse.json({ error: "URL du site requise" }, { status: 400 });
    }
    if (profileType !== "website" && (!businessDescription || businessDescription.length < 20)) {
      return NextResponse.json(
        { error: "Description ou contenu du profil insuffisant" },
        { status: 400 }
      );
    }

    const organization = await queryOne<{
      id: string;
      subscription_plan: string;
      subscription_status: string;
    }>(
      `SELECT id, subscription_plan, subscription_status
       FROM organizations WHERE id = $1 AND owner_id = $2`,
      [organizationId, session.id]
    );

    if (!organization) {
      return NextResponse.json({ error: "Organisation non autorisée" }, { status: 403 });
    }

    if (!canCreateProfileType(organization, profileType)) {
      return NextResponse.json(
        {
          error:
            profileType === "website"
              ? "Organisation requise"
              : "Profil réservé au plan Pro (Emploi & Autre)",
          code: "plan_pro_required",
        },
        { status: 403 }
      );
    }

    const crawlStatus = url ? "pending" : "skipped";

    const agentConfig: Record<string, unknown> = {
      profile_type: profileType,
      profile_meta: profileMeta,
    };
    if (profileSubtype) agentConfig.profile_subtype = profileSubtype;
    const eventEnd =
      profileMeta && typeof profileMeta === "object" && "eventEndDate" in profileMeta
        ? String((profileMeta as { eventEndDate?: string }).eventEndDate ?? "").trim()
        : "";
    if (eventEnd) agentConfig.profile_event_end_date = eventEnd.slice(0, 10);
    if (contact?.email) agentConfig.contact_email = String(contact.email).trim();
    if (contact?.phone) agentConfig.contact_phone = String(contact.phone).trim();
    if (contact?.whatsapp) agentConfig.contact_whatsapp = String(contact.whatsapp).trim();

    const site = await queryOne<{
      id: string;
      name: string;
      url: string | null;
      widget_key: string;
      crawl_status: string;
      is_active: boolean;
      organization_id: string;
      business_description: string | null;
    }>(
      `INSERT INTO sites (
         organization_id, name, url, widget_key, crawl_status, business_description, agent_config
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING id, name, url, widget_key, crawl_status, is_active, organization_id, business_description`,
      [
        organizationId,
        name,
        url,
        newWidgetKey(),
        crawlStatus,
        businessDescription,
        JSON.stringify(agentConfig),
      ]
    );

    if (!site) {
      return NextResponse.json({ error: "Impossible de créer le site" }, { status: 500 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    if (url) {
      await fetch(`${apiUrl}/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: site.id }),
      }).catch(() => {});
    }
    const ingestManual =
      profileType !== "website" ||
      Boolean(contact?.email || contact?.phone || contact?.whatsapp);
    if (businessDescription && ingestManual) {
      await fetch(`${apiUrl}/ingest/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: site.id, text: businessDescription }),
      }).catch(() => {});
    }

    let profileComposed = false;
    if (profileType !== "website") {
      const composeRes = await fetch(`${apiUrl}/profiles/compose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: site.id }),
      }).catch(() => null);
      profileComposed = composeRes?.ok ?? false;
    }

    let trackedLink: { slug: string; url: string } | null = null;
    if (profileType === "job_search") {
      const jobMode = jobProfileModeFromMeta(profileMeta as Record<string, unknown>);
      const isRecruitment = jobMode === "recruitment";
      let slug = slugFromName(name) || (isRecruitment ? "recrutement" : "candidat");
      if (slug.length < 3) slug = `${isRecruitment ? "recrutement" : "candidat"}-${slug}`;
      const linkLabel = isRecruitment ? `Recrutement — ${name}` : `Profil — ${name}`;
      let inserted = await queryOne<{ slug: string }>(
        `INSERT INTO traffic_links (site_id, slug, source, label)
         VALUES ($1, $2, 'job_search', $3)
         RETURNING slug`,
        [site.id, slug, linkLabel]
      );
      if (!inserted) {
        const alt = `${slug}-${Date.now().toString(36).slice(-4)}`;
        inserted = await queryOne<{ slug: string }>(
          `INSERT INTO traffic_links (site_id, slug, source, label)
           VALUES ($1, $2, 'job_search', $3)
           RETURNING slug`,
          [site.id, alt, linkLabel]
        );
      }
      if (inserted?.slug) {
        trackedLink = {
          slug: inserted.slug,
          url: trackedLinkUrl(inserted.slug, site.widget_key),
        };
      }
    }

    return NextResponse.json({ site, trackedLink, profileComposed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
