# Create Admin User - Ultra Simple Steps

## Problem
You're getting "Invalid admin credentials" because the admin user doesn't exist in the database yet.

## Solution - 3 Minutes Setup

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Click on your project (or if it opens automatically, you're already there)

### Step 2: Create User via Authentication UI
1. Look at the left sidebar
2. Click on **"Authentication"**
3. Click **"Users"** tab
4. Click **"Add User"** button (green button, top right)
5. Fill in:
   - **Email:** `admin@sexyresume.com`
   - **Password:** `Nenuco2124$$`
   - ✅ **Check "Auto Confirm Email"** (IMPORTANT!)
6. Click **"Create User"**
7. **COPY THE USER ID** that appears in the list (looks like: a1b2c3d4-5678...)

### Step 3: Grant Admin Permissions
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button
3. Paste this SQL (replace YOUR_USER_ID with the ID you copied):

```sql
INSERT INTO public.admin_users (user_id, role, permissions, is_active, approved_at)
VALUES (
  'YOUR_USER_ID'::uuid,
  'super_admin',
  ARRAY['admin_access','user_management','audit_access','security_admin','data_purge','system_admin'],
  true,
  now()
);
```

4. Click **"Run"** (or press Ctrl+Enter)

### Step 4: Test Login
1. Go to your app
2. Click **"2025"** in the footer
3. Login with:
   - Username: `AdminMigs`
   - Password: `Nenuco2124$$`

Done! 🎉

---

## Quick Troubleshooting

**"Invalid credentials" still?**
- Make sure you checked "Auto Confirm Email" in Step 2
- Verify the password is exactly: `Nenuco2124$$` (capital N)

**"Admin access denied"?**
- Make sure Step 3 SQL ran successfully
- Check you replaced YOUR_USER_ID with the actual ID

**Need the User ID again?**
- Go to Authentication → Users
- Find admin@sexyresume.com in the list
- The ID is in the first column
