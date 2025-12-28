/*
  # Admin Security Tables - Debug Version
  
  This migration creates the missing admin_users table that is referenced
  in existing RLS policies but doesn't exist in the database.
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

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

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

-- Insert your user as super admin
INSERT INTO public.admin_users (user_id, role, permissions, is_active, approved_at) VALUES
(
  'e06fdba9-3599-427d-beb0-5b5c2b524f8f'::uuid,
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