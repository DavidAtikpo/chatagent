import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_KEY manquante dans web/.env.local");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function newWidgetKey() {
  return `wk_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

export async function setupAccountForUser(
  userId: string,
  companyName: string,
  siteUrl: string
) {
  const admin = createAdminClient();

  const { data: existingOrg } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  let organizationId = existingOrg?.id;

  if (!organizationId) {
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({ name: companyName, owner_id: userId })
      .select("id")
      .single();

    if (orgError) throw orgError;
    organizationId = org.id;

    await admin.from("organization_members").upsert(
      {
        organization_id: organizationId,
        user_id: userId,
        role: "owner",
        display_name: companyName,
        is_available: true,
      },
      { onConflict: "organization_id,user_id" }
    );
  }

  const { data: existingSites } = await admin
    .from("sites")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1);

  if (existingSites?.[0]) {
    return { organizationId, siteId: existingSites[0].id };
  }

  const { data: site, error: siteError } = await admin
    .from("sites")
    .insert({
      organization_id: organizationId,
      name: companyName,
      url: siteUrl,
      crawl_status: "pending",
      widget_key: newWidgetKey(),
    })
    .select("id")
    .single();

  if (siteError) throw siteError;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  await fetch(`${apiUrl}/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site_id: site.id }),
  }).catch(() => {});

  return { organizationId, siteId: site.id };
}
