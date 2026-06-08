import { createAdminClient } from "@/lib/setup-account-server";
import { requirePlatformAdmin } from "@/lib/platform-admin-server";
import { NextResponse } from "next/server";

const VALID_PLANS = new Set(["starter", "pro", "agency"]);
const VALID_STATUSES = new Set(["trialing", "active", "past_due", "canceled"]);

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requirePlatformAdmin();
  if (!user) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let body: { subscription_plan?: string; subscription_status?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (body.subscription_plan !== undefined) {
    const plan = body.subscription_plan.toLowerCase();
    if (!VALID_PLANS.has(plan)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }
    updates.subscription_plan = plan;
  }
  if (body.subscription_status !== undefined) {
    const status = body.subscription_status.toLowerCase();
    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    updates.subscription_status = status;
  }
  if (body.name !== undefined && body.name.trim()) {
    updates.name = body.name.trim();
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .update(updates)
    .eq("id", params.id)
    .select("id, name, subscription_plan, subscription_status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ organization: data });
}
