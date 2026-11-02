-- Yayra — Neon PostgreSQL (pgvector)
-- Run once: psql $DATABASE_URL -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Auth (replaces Supabase auth.users) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);

-- ─── SaaS core ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  subscription_plan TEXT NOT NULL DEFAULT 'free',
  subscription_status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer
  ON organizations (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT,
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

CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent',
  display_name TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  site_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  widget_key TEXT NOT NULL UNIQUE,
  crawl_status TEXT NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT true,
  whatsapp_number TEXT,
  agent_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  business_description TEXT,
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sites_org ON sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_sites_widget_key ON sites(widget_key);

ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_site_id_fkey
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS site_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  cloudinary_public_id TEXT,
  cloudinary_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  chunk_count INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_documents_site ON site_documents(site_id);

CREATE TABLE IF NOT EXISTS crawled_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  status_code INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, url)
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  chunk_index INT NOT NULL DEFAULT 0,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_site ON knowledge_chunks(site_id);
-- Optional after enough rows: CREATE INDEX ... USING ivfflat (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  fingerprint TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_visitors_site_fingerprint ON visitors (site_id, fingerprint);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  lead_score INT NOT NULL DEFAULT 0,
  qualification_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_url TEXT,
  traffic_link_id UUID,
  handoff_status TEXT,
  handoff_reason TEXT,
  handoff_requested_at TIMESTAMPTZ,
  handoff_reassured_at TIMESTAMPTZ,
  assigned_agent_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_site ON conversations(site_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sender_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  name TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  experience_level TEXT,
  budget_range TEXT,
  availability TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS traffic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'direct_link',
  label TEXT,
  click_count INT NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, slug)
);

CREATE TABLE IF NOT EXISTS widget_click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

-- ─── Vector search (replaces Supabase RPC match_knowledge) ─────────────────

CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_site_id uuid,
  match_count int,
  match_threshold float
)
RETURNS TABLE (
  id uuid,
  content text,
  title text,
  source_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.content,
    k.title,
    k.source_url,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks k
  WHERE k.site_id = match_site_id
    AND k.embedding IS NOT NULL
    AND 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Migrations idempotentes (bases déjà créées avant ces colonnes)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS handoff_reason TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS handoff_requested_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS handoff_reassured_at TIMESTAMPTZ;
