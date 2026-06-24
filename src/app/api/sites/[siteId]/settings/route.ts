import { createAdminClient } from "@/lib/setup-account-server";
import { isGenericWelcomeMessage } from "@/lib/generic-welcome";
import { hasProFeatures } from "@/lib/plans";
import { userOwnsSite } from "@/lib/site-access";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
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

    const body = await request.json();
    let agentConfig = body.agent_config as Record<string, unknown>;
    let whatsappNumber = body.whatsapp_number ?? null;

    if (!agentConfig || typeof agentConfig !== "object") {
      return NextResponse.json({ error: "agent_config requis" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: siteRow } = await admin
      .from("sites")
      .select("organization_id, agent_config, whatsapp_number")
      .eq("id", siteId)
      .single();

    if (!siteRow?.organization_id) {
      return NextResponse.json({ error: "Site introuvable" }, { status: 404 });
    }

    const { data: org } = await admin
      .from("organizations")
      .select("subscription_plan, subscription_status")
      .eq("id", siteRow.organization_id)
      .single();

    const pro = hasProFeatures(
      org
        ? {
            id: siteRow.organization_id,
            name: "",
            subscription_plan: org.subscription_plan,
            subscription_status: org.subscription_status,
          }
        : null
    );

    if (!pro) {
      const prev = (siteRow.agent_config as Record<string, unknown>) ?? {};
      agentConfig = {
        ...agentConfig,
        contact_whatsapp: prev.contact_whatsapp ?? null,
        contact_phone: prev.contact_phone ?? null,
        contact_email: prev.contact_email ?? null,
        cta_url: prev.cta_url ?? null,
      };
      whatsappNumber = siteRow.whatsapp_number ?? (prev.contact_whatsapp as string) ?? null;
    }

    const prevConfig = (siteRow.agent_config as Record<string, unknown>) ?? {};
    const oldLang = (prevConfig.language as string) ?? "fr";
    const newLang = (agentConfig.language as string) ?? "fr";
    const welcomeCustomized = Boolean(agentConfig.welcome_customized);
    const welcomeMsg = agentConfig.welcome_message as string | null | undefined;

    if (isGenericWelcomeMessage(welcomeMsg)) {
      agentConfig = {
        ...agentConfig,
        welcome_message: null,
        welcome_customized: false,
        welcome_message_lang: null,
      };
    }

    if (newLang !== oldLang) {
      agentConfig = {
        ...agentConfig,
        welcome_intro: null,
        welcome_intro_lang: null,
        welcome_intros: {},
        welcome_message: null,
        welcome_message_lang: null,
        welcome_auto_generated: false,
        welcome_customized: false,
      };
    } else if (!welcomeCustomized) {
      const introLang = (prevConfig.welcome_intro_lang as string) ?? "";
      const msgLang = (prevConfig.welcome_message_lang as string) ?? "";
      if (
        (introLang && introLang !== newLang) ||
        (msgLang && msgLang !== newLang)
      ) {
        agentConfig = {
          ...agentConfig,
          welcome_intro: null,
          welcome_intro_lang: null,
          welcome_intros: {},
          welcome_message: null,
          welcome_message_lang: null,
          welcome_auto_generated: false,
        };
      }
    }

    const { error } = await admin
      .from("sites")
      .update({
        agent_config: agentConfig,
        whatsapp_number: whatsappNumber,
      })
      .eq("id", siteId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pro_contacts: pro });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
