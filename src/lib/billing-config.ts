import type { SubscriptionPlan } from "@/lib/plans";
import type Stripe from "stripe";

export type PaidPlan = Exclude<SubscriptionPlan, "free">;

export const BILLING_PLANS: {
  id: SubscriptionPlan;
  priceUsd: number;
  paid: boolean;
}[] = [
  { id: "free", priceUsd: 0, paid: false },
  { id: "starter", priceUsd: 10, paid: true },
  { id: "pro", priceUsd: 20, paid: true },
  { id: "agency", priceUsd: 40, paid: true },
];

export function planPriceUsd(plan: PaidPlan): number {
  const row = BILLING_PLANS.find((p) => p.id === plan);
  if (!row?.paid) throw new Error(`Plan payant invalide: ${plan}`);
  return row.priceUsd;
}

function planProductName(plan: PaidPlan): string {
  const label = plan.charAt(0).toUpperCase() + plan.slice(1);
  return `Yayra ${label}`;
}

/** Montants définis dans le code — pas de price_… dans .env (comme un checkout classique). */
export function stripePriceDataForPlan(plan: PaidPlan): Stripe.Checkout.SessionCreateParams.LineItem.PriceData {
  return {
    currency: "usd",
    unit_amount: planPriceUsd(plan) * 100,
    recurring: { interval: "month" },
    product_data: {
      name: planProductName(plan),
      metadata: { plan },
    },
  };
}

export function stripeCheckoutLineItem(plan: PaidPlan): Stripe.Checkout.SessionCreateParams.LineItem {
  return {
    quantity: 1,
    price_data: stripePriceDataForPlan(plan),
  };
}

export function planFromMetadata(
  meta: Stripe.Metadata | null | undefined
): PaidPlan | null {
  const plan = meta?.plan?.toLowerCase();
  if (plan === "starter" || plan === "pro" || plan === "agency") return plan;
  return null;
}

/** Repère le plan sur une facture (metadata ou montant USD). */
export function planFromInvoiceLine(
  meta: Stripe.Metadata | null | undefined,
  amountCents: number
): PaidPlan | null {
  const fromMeta = planFromMetadata(meta);
  if (fromMeta) return fromMeta;
  for (const row of BILLING_PLANS) {
    if (row.paid && row.priceUsd * 100 === amountCents) return row.id as PaidPlan;
  }
  return null;
}

export function formatUsd(amountCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}
