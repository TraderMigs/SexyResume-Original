/*
  # Admin Users Security Fix

  1. New Tables
    - `admin_users` - Admin role management and permissions
    - `user_sessions` - Session tracking for security monitoring
    - `parse_reviews` - Enhanced resume parsing review system

  2. Security
    - Enable RLS on all new tables
    - Proper admin role verification
    - Session security monitoring

  3. Critical Fixes
    - Resolves missing admin_users table referenced in existing RLS policies
    - Adds missing tables referenced in codebase
    - Implements proper admin authentication system
*/

-- Admin users table for role management
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'super_admin', 'auditor')),
  permissions text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.users(id),
  approved_at timestamptz,
  last_login_at timestamptz,
  login_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- User sessions for security monitoring
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  last_activity_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Parse reviews for enhanced parsing system
CREATE TABLE IF NOT EXISTS public.parse_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  original_file_name text NOT NULL,
  original_file_url text,
  original_file_type text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]',
  overall_confidence numeric(3,2) DEFAULT 0.0,
  parse_version text DEFAULT '1.0',
  snapshots jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_parse_reviews_user_id ON public.parse_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_parse_reviews_created_at ON public.parse_reviews(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parse_reviews ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "Admins can read admin user data"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() 
      AND au.role IN ('super_admin', 'admin') 
      AND au.is_active = true
    )
  );

CREATE POLICY "Super admins can manage admin users"
  ON public.admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() 
      AND au.role = 'super_admin' 
      AND au.is_active = true
    )
  );

CREATE POLICY "Service role can manage admin users"
  ON public.admin_users
  FOR ALL
  TO service_role
  USING (true);

-- User sessions policies
CREATE POLICY "Users can read own sessions"
  ON public.user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.user_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions"
  ON public.user_sessions
  FOR ALL
  TO service_role
  USING (true);

-- Parse reviews policies
CREATE POLICY "Users can read own parse reviews"
  ON public.parse_reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own parse reviews"
  ON public.parse_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parse reviews"
  ON public.parse_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own parse reviews"
  ON public.parse_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage parse reviews"
  ON public.parse_reviews
  FOR ALL
  TO service_role
  USING (true);

-- Insert default super admin (you'll need to update this with your actual user ID)
-- IMPORTANT: Replace 'your-user-id-here' with your actual Supabase user ID
INSERT INTO public.admin_users (user_id, role, permissions, is_active, approved_at) VALUES
(
  'your-user-id-here'::uuid, -- REPLACE THIS WITH YOUR ACTUAL USER ID
  'super_admin',
  ARRAY[
    'admin_access',
    'user_management', 
    'audit_access',
    'security_admin',
    'data_purge',
    'system_admin'
  ],
  true,
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  approved_at = EXCLUDED.approved_at,
  updated_at = now();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_admin_security_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers for updated_at
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.update_admin_security_updated_at();

CREATE TRIGGER update_parse_reviews_updated_at
  BEFORE UPDATE ON public.parse_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_admin_security_updated_at();

-- Function to track admin login
CREATE OR REPLACE FUNCTION public.track_admin_login(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.admin_users 
  SET 
    last_login_at = now(),
    login_count = login_count + 1,
    updated_at = now()
  WHERE user_id = p_user_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;