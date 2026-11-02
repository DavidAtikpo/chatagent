-- Billing: Stripe + invoice history (run after schema.sql)

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer
  ON organizations (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  plan TEXT,
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_org
  ON billing_invoices (organization_id, created_at DESC);
