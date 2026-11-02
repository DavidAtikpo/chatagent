import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY manquant");
  }
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}

export function stripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET manquant");
  return secret;
}

export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
