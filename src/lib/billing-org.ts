import { queryOne } from "@/lib/db";
import type { PaidPlan } from "@/lib/billing-config";

export type BillingOrganization = {
  id: string;
  name: string;
  owner_id: string;
  subscription_plan: string;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

export async function getOwnerOrganization(userId: string): Promise<BillingOrganization | null> {
  return queryOne<BillingOrganization>(
    `SELECT id, name, owner_id, subscription_plan, subscription_status,
            stripe_customer_id, stripe_subscription_id
     FROM organizations
     WHERE owner_id = $1
     LIMIT 1`,
    [userId]
  );
}

export async function setOrganizationStripeCustomer(
  orgId: string,
  customerId: string
): Promise<void> {
  await queryOne(`UPDATE organizations SET stripe_customer_id = $1 WHERE id = $2 RETURNING id`, [
    customerId,
    orgId,
  ]);
}

export async function activateOrganizationPlan(
  orgId: string,
  plan: PaidPlan,
  opts: { customerId?: string; subscriptionId?: string; status?: string }
): Promise<void> {
  await queryOne(
    `UPDATE organizations
     SET subscription_plan = $1,
         subscription_status = $2,
         stripe_customer_id = COALESCE($3, stripe_customer_id),
         stripe_subscription_id = COALESCE($4, stripe_subscription_id)
     WHERE id = $5
     RETURNING id`,
    [plan, opts.status ?? "active", opts.customerId ?? null, opts.subscriptionId ?? null, orgId]
  );
}

export async function upsertBillingInvoice(row: {
  organization_id: string;
  stripe_invoice_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  plan: string | null;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
  period_start: Date | null;
  period_end: Date | null;
  paid_at: Date | null;
}): Promise<void> {
  await queryOne(
    `INSERT INTO billing_invoices (
       organization_id, stripe_invoice_id, amount_cents, currency, status, plan,
       invoice_pdf_url, hosted_invoice_url, period_start, period_end, paid_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (stripe_invoice_id) DO UPDATE SET
       status = EXCLUDED.status,
       amount_cents = EXCLUDED.amount_cents,
       invoice_pdf_url = EXCLUDED.invoice_pdf_url,
       hosted_invoice_url = EXCLUDED.hosted_invoice_url,
       paid_at = EXCLUDED.paid_at`,
    [
      row.organization_id,
      row.stripe_invoice_id,
      row.amount_cents,
      row.currency,
      row.status,
      row.plan,
      row.invoice_pdf_url,
      row.hosted_invoice_url,
      row.period_start,
      row.period_end,
      row.paid_at,
    ]
  );
}
