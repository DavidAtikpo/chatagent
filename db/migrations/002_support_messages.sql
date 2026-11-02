-- Messages support dashboard → équipe (run after schema.sql)

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  organization_name TEXT,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_created
  ON support_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_messages_user
  ON support_messages (user_id, created_at DESC);
