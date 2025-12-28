# Admin User Setup Instructions

## Overview
This document explains how to set up admin access for your SexyResume application.

## Admin Login Details
- **Username**: `AdminMigs`
- **Email**: `admin@sexyresume.com`
- **Password**: `Nenuco2124$$`

## Accessing Admin Panel
1. **Click the year in the footer** - The "2025" text in the footer is clickable and will take you to the admin login page
2. **Direct URL**: Navigate to `/admin/login` in your browser
3. **After login**: You'll be redirected to `/admin/dashboard`

## Setup Steps

### Step 1: Create the Admin User in Supabase

You need to create the admin user account in your Supabase project:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: `nmssqikffvbsbbfxxdyg`
3. Go to **Authentication** > **Users**
4. Click **Add User** and fill in:
   - Email: `admin@sexyresume.com`
   - Password: `Nenuco2124$$`
   - Auto Confirm Email: ✅ (checked)
5. Click **Create User**
6. Copy the user ID that was created (you'll need this in the next step)

### Step 2: Grant Admin Permissions

After creating the user, you need to add them to the `admin_users` table:

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the following SQL (replace `YOUR_USER_ID_HERE` with the actual user ID from Step 1):

```sql
-- Insert or update admin user with full permissions
INSERT INTO public.admin_users (user_id, role, permissions, is_active, approved_at)
VALUES (
  'YOUR_USER_ID_HERE'::uuid,  -- Replace with the actual user ID
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
```

### Step 3: Test Admin Login

1. Navigate to your application
2. Scroll to the footer and click on "2025"
3. Enter credentials:
   - Username: `AdminMigs`
   - Password: `Nenuco2124$$`
4. You should be redirected to the admin dashboard

## Admin Dashboard Features

Once logged in, you'll have access to:
- **Overview**: System metrics and KPIs
- **Users**: User management and account details
- **Audit Logs**: Security and activity monitoring
- **Security Center**: Threat detection and security events
- **Data Lifecycle**: Data retention and purge management
- **Settings**: System configuration (super admin only)

## Troubleshooting

### "Invalid admin credentials" error
- Make sure the user was created in Supabase Authentication
- Verify the password is exactly: `Nenuco2124$$`
- Check that email confirmation is enabled for the user

### "Admin access denied" error
- Ensure the user was added to the `admin_users` table
- Verify `is_active` is set to `true`
- Check that the user has the `super_admin` role

### Can't see admin options
- Make sure you're logged in with the admin account
- Check browser console for any errors
- Verify the `admin_users` table exists in your database

## Security Notes

- The admin login is separate from regular user authentication
- All admin actions are logged in the audit system
- The username "AdminMigs" is a display name only; authentication uses the email
- Only users in the `admin_users` table with `is_active=true` can access admin features
- Change the default password after first login for better security

## Migration Applied

The following migration has been applied to set up the admin infrastructure:
- `create_admin_user_for_migs` - Creates/updates admin_users table and RLS policies

## Next Steps

After setting up the admin user:
1. Test the login flow
2. Explore the admin dashboard features
3. Consider setting up additional admin users if needed
4. Review security settings and audit logs regularly
