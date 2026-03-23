-- ============================================================
-- SexyResume: Admin, Promo Codes, Email Capture, Cron
-- ============================================================

-- 1. Add is_admin flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 2. Persistent email capture (survives 24hr account deletion)
CREATE TABLE IF NOT EXISTS captured_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text,
  source text NOT NULL DEFAULT 'signup',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS captured_emails_email_idx ON captured_emails (email);

-- RLS: only service role can read/write
ALTER TABLE captured_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_access_captured_emails" ON captured_emails;
CREATE POLICY "no_public_access_captured_emails"
  ON captured_emails FOR ALL TO public USING (false);

-- 3. Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  max_uses_total integer,
  max_uses_per_email integer NOT NULL DEFAULT 1,
  max_uses_per_ip integer NOT NULL DEFAULT 1,
  times_used integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_code_idx ON promo_codes (UPPER(code));

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_access_promo_codes" ON promo_codes;
CREATE POLICY "no_public_access_promo_codes"
  ON promo_codes FOR ALL TO public USING (false);

-- 4. Promo code usage tracking
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  ip_address text,
  used_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_access_promo_uses" ON promo_code_uses;
CREATE POLICY "no_public_access_promo_uses"
  ON promo_code_uses FOR ALL TO public USING (false);

-- 5. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 6. Schedule daily purge at 2 AM UTC
SELECT cron.schedule(
  'daily-data-purge',
  '0 2 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/data-purge/schedule',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
) ON CONFLICT DO NOTHING;
