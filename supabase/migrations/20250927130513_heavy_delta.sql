/*
  # Admin and Audit System

  1. New Tables
    - `admin_logs` - Administrative actions and system events
    - `audit_logs` - User action audit trail
    - `data_retention_policies` - Configurable retention rules
    - `purge_jobs` - Track purge job execution

  2. Security
    - Enable RLS on all tables
    - Admin-only access for admin_logs
    - Users can view their own audit logs

  3. Indexes
    - Performance indexes for admin queries and purge operations
*/

-- Admin logs for system administration
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL, -- 'user', 'resume', 'export', 'payment', etc.
  target_id text NOT NULL,
  change_data jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  severity text CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'info',
  created_at timestamptz DEFAULT now()
);

-- Audit logs for user actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  change_data jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL UNIQUE,
  retention_days integer NOT NULL,
  soft_delete boolean DEFAULT true,
  archive_before_delete boolean DEFAULT false,
  archive_storage_bucket text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purge job tracking
CREATE TABLE IF NOT EXISTS public.purge_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL, -- 'exports', 'user_data', 'audit_logs', etc.
  status text CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  target_table text NOT NULL,
  records_processed integer DEFAULT 0,
  records_deleted integer DEFAULT 0,
  records_archived integer DEFAULT 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON public.admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_type ON public.admin_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_severity ON public.admin_logs(severity);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON public.audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON public.audit_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_purge_jobs_status ON public.purge_jobs(status);
CREATE INDEX IF NOT EXISTS idx_purge_jobs_job_type ON public.purge_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_purge_jobs_created_at ON public.purge_jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purge_jobs ENABLE ROW LEVEL SECURITY;

-- Admin logs policies (admin access only)
CREATE POLICY "Service role can manage admin logs"
  ON public.admin_logs
  FOR ALL
  TO service_role
  USING (true);

-- Audit logs policies (users can read their own)
CREATE POLICY "Users can read own audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage audit logs"
  ON public.audit_logs
  FOR ALL
  TO service_role
  USING (true);

-- Data retention policies (read-only for authenticated users)
CREATE POLICY "Users can read retention policies"
  ON public.data_retention_policies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage retention policies"
  ON public.data_retention_policies
  FOR ALL
  TO service_role
  USING (true);

-- Purge jobs (admin access only)
CREATE POLICY "Service role can manage purge jobs"
  ON public.purge_jobs
  FOR ALL
  TO service_role
  USING (true);

-- Insert default retention policies
INSERT INTO public.data_retention_policies (table_name, retention_days, soft_delete, archive_before_delete) VALUES
  ('exports', 1, false, false), -- Delete export files after 24 hours
  ('resumes', 365, true, true), -- Soft delete inactive resumes after 1 year
  ('cover_letters', 365, true, true), -- Soft delete inactive cover letters after 1 year
  ('user_entitlements', 1095, true, false), -- Keep entitlements for 3 years
  ('payment_receipts', 2555, false, true), -- Keep payment records for 7 years (legal requirement)
  ('checkout_sessions', 30, false, false), -- Delete old checkout sessions after 30 days
  ('audit_logs', 1095, false, true), -- Archive audit logs after 3 years
  ('admin_logs', 2555, false, true), -- Archive admin logs after 7 years
  ('analytics_events', 730, false, false), -- Delete analytics after 2 years
  ('cover_letter_telemetry', 365, false, false) -- Delete telemetry after 1 year
ON CONFLICT (table_name) DO NOTHING;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id uuid,
  p_action text,
  p_target_type text,
  p_target_id text,
  p_change_data jsonb DEFAULT '{}',
  p_severity text DEFAULT 'info'
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.admin_logs (
    admin_user_id,
    action,
    target_type,
    target_id,
    change_data,
    severity
  ) VALUES (
    p_admin_user_id,
    p_action,
    p_target_type,
    p_target_id,
    p_change_data,
    p_severity
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user actions
CREATE OR REPLACE FUNCTION public.log_user_action(
  p_user_id uuid,
  p_action text,
  p_target_type text,
  p_target_id text,
  p_change_data jsonb DEFAULT '{}',
  p_session_id text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    target_type,
    target_id,
    change_data,
    session_id
  ) VALUES (
    p_user_id,
    p_action,
    p_target_type,
    p_target_id,
    p_change_data,
    p_session_id
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_admin_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on retention policies
CREATE TRIGGER update_data_retention_policies_updated_at
  BEFORE UPDATE ON public.data_retention_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_admin_updated_at();