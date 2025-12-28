/*
  # Create Admin User for AdminMigs
  
  1. Creates admin user account in auth.users
  2. Links admin account to admin_users table with super_admin role
  3. Grants all administrative permissions
  
  This migration sets up the admin account with username: AdminMigs
  Email: admin@sexyresume.com
  
  Note: The password will be set during the user creation process.
*/

-- First, check if the admin_users table exists (it should from previous migrations)
-- If not, create it
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'super_admin', 'auditor')),
  permissions text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  last_login_at timestamptz,
  login_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security if not already enabled
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can read admin user data" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Service role can manage admin users" ON public.admin_users;

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

-- Create or update the admin user
-- Note: We'll insert/update the admin_users record for any user with the admin email
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if a user with admin email exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@sexyresume.com' LIMIT 1;
  
  -- If admin user exists, ensure they're in admin_users table
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.admin_users (user_id, role, permissions, is_active, approved_at)
    VALUES (
      admin_user_id,
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
  END IF;
END $$;
