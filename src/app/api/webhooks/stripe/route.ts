import type { PaidPlan } from "@/lib/billing-config";
import { planFromInvoiceLine, planFromMetadata } from "@/lib/billing-config";
import { activateOrganizationPlan, upsertBillingInvoice } from "@/lib/billing-org";
import { queryOne } from "@/lib/db";
import { getStripe, stripeWebhookSecret } from "@/lib/stripe-server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

async function orgIdFromCustomer(customerId: string): Promise<string | null> {
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM organizations WHERE stripe_customer_id = $1 LIMIT 1`,
    [customerId]
  );
  return row?.id ?? null;
}

async function applyPlan(
  orgId: string,
  plan: PaidPlan,
  customerId: string,
  subscriptionId: string | null,
  status: string
) {
  await activateOrganizationPlan(orgId, plan, {
    customerId,
    subscriptionId: subscriptionId ?? undefined,
    status: status === "active" || status === "trialing" ? "active" : status,
  });
}

async function syncInvoice(orgId: string, inv: Stripe.Invoice) {
  const line = inv.lines.data[0];
  const amount = inv.amount_paid ?? inv.amount_due ?? line?.amount ?? 0;
  const plan = planFromInvoiceLine(
    line?.price?.metadata ?? line?.metadata ?? inv.metadata,
    amount
  );
  await upsertBillingInvoice({
    organization_id: orgId,
    stripe_invoice_id: inv.id,
    amount_cents: inv.amount_paid ?? inv.amount_due ?? 0,
    currency: inv.currency ?? "usd",
    status: inv.status ?? "unknown",
    plan,
    invoice_pdf_url: inv.invoice_pdf ?? null,
    hosted_invoice_url: inv.hosted_invoice_url ?? null,
    period_start: inv.period_start ? new Date(inv.period_start * 1000) : null,
    period_end: inv.period_end ? new Date(inv.period_end * 1000) : null,
    paid_at: inv.status_transitions?.paid_at
      ? new Date(inv.status_transitions.paid_at * 1000)
      : null,
  });
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const payload = await request.text();
    const sig = request.headers.get("stripe-signature") ?? "";
    const event = stripe.webhooks.constructEvent(payload, sig, stripeWebhookSecret());

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organization_id;
      const plan = session.metadata?.plan as PaidPlan | undefined;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (orgId && plan && customerId) {
        await applyPlan(orgId, plan, customerId, subscriptionId ?? null, "active");
      }
    }

    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const orgId =
        sub.metadata?.organization_id ?? (await orgIdFromCustomer(customerId));
      const plan =
        planFromMetadata(sub.metadata) ??
        planFromMetadata(sub.items.data[0]?.price?.metadata) ??
        (sub.metadata?.plan as PaidPlan | undefined);

      if (orgId && plan) {
        await applyPlan(orgId, plan, customerId, sub.id, sub.status);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const orgId = await orgIdFromCustomer(customerId);
      if (orgId) {
        await queryOne(
          `UPDATE organizations
           SET subscription_status = 'canceled', subscription_plan = 'free', stripe_subscription_id = NULL
           WHERE id = $1 RETURNING id`,
          [orgId]
        );
      }
    }

    if (event.type === "invoice.paid" || event.type === "invoice.finalized") {
      const inv = event.data.object as Stripe.Invoice;
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      if (!customerId) return NextResponse.json({ received: true });
      const orgId = await orgIdFromCustomer(customerId);
      if (orgId) await syncInvoice(orgId, inv);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
