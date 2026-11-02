import { isSessionUser, requireSession } from "@/lib/auth/require-session";
import { queryOne, queryRows } from "@/lib/db";
import { expireEventSitesForOrganization } from "@/lib/expire-event-sites";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await requireSession();
    if (!isSessionUser(session)) return session;

    const organization = await queryOne<{
      id: string;
      name: string;
      subscription_plan: string;
      subscription_status: string;
    }>(
      `SELECT id, name, subscription_plan, subscription_status
       FROM organizations
       WHERE owner_id = $1
       LIMIT 1`,
      [session.id]
    );

    if (!organization) {
      return NextResponse.json({ organization: null, sites: [] });
    }

    await expireEventSitesForOrganization(organization.id);

    const sites = await queryRows(
      `SELECT id, name, url, widget_key, crawl_status, is_active, organization_id,
              whatsapp_number, agent_config, business_description
       FROM sites
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [organization.id]
    );

    return NextResponse.json({ organization, sites });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    if (!isSessionUser(session)) return session;

    let body: { name?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
    }

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }
    if (name.length > 120) {
      return NextResponse.json({ error: "Nom trop long (120 caractères max)" }, { status: 400 });
    }

    const organization = await queryOne<{
      id: string;
      name: string;
      subscription_plan: string;
      subscription_status: string;
    }>(
      `UPDATE organizations SET name = $1
       WHERE owner_id = $2
       RETURNING id, name, subscription_plan, subscription_status`,
      [name, session.id]
    );

    if (!organization) {
      return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
