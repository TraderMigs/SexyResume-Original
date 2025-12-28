# Create Admin User - Quick Guide

## The Issue
You're getting "Invalid admin credentials" because the admin user doesn't exist in Supabase yet.

## Solution - Create the Admin User

You have **two options** to create the admin user:

---

### Option 1: Via Supabase Dashboard (EASIEST - 2 minutes)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `nmssqikffvbsbbfxxdyg`

2. **Create the User**
   - Click **Authentication** in the left sidebar
   - Click **Users** tab
   - Click **Add User** (green button)
   - Fill in:
     ```
     Email: admin@sexyresume.com
     Password: Nenuco2124$$
     Auto Confirm Email: ✅ CHECK THIS BOX
     ```
   - Click **Create User**

3. **Get the User ID**
   - After creating, you'll see the new user in the list
   - Copy the **User ID** (it's a UUID like: `a1b2c3d4-...`)

4. **Grant Admin Permissions**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**
   - Paste this SQL (replace `YOUR_USER_ID_HERE` with the ID you copied):

   ```sql
   INSERT INTO public.admin_users (user_id, role, permissions, is_active, approved_at)
   VALUES (
     'YOUR_USER_ID_HERE'::uuid,  -- ⚠️ REPLACE THIS
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

   - Click **Run** (or press Ctrl+Enter)

5. **Test Login**
   - Go back to your app
   - Click "2025" in the footer
   - Enter:
     - Username: `AdminMigs`
     - Password: `Nenuco2124$$`
   - You should now be logged in! 🎉

---

### Option 2: Via Supabase API (If you have Service Role Key)

If you have your Supabase Service Role Key, you can run this script:

1. **Add Service Role Key to .env**
   ```bash
   echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" >> .env
   ```

2. **Run the script**
   ```bash
   npm run admin:create
   ```

The Service Role Key can be found in:
- Supabase Dashboard → Settings → API → Service Role Key

---

## Quick Test After Setup

1. Open your app
2. Scroll to the footer
3. Click on "2025"
4. Login with:
   - Username: `AdminMigs`
   - Password: `Nenuco2124$$`
5. You should see the admin dashboard!

## Troubleshooting

**Still getting "Invalid admin credentials"?**
- Make sure you checked "Auto Confirm Email" when creating the user
- Verify the email is exactly: `admin@sexyresume.com`
- Verify the password is exactly: `Nenuco2124$$` (capital N, numbers, dollar signs)
- Check that the SQL query ran successfully and inserted the record

**"Admin access denied" error?**
- The user was created but the admin permissions weren't added
- Re-run the SQL query in Step 4
- Make sure you replaced `YOUR_USER_ID_HERE` with the actual user ID

**Need help?**
Check the browser console (F12) for more detailed error messages.

---

## Why This Happens

The admin login page checks two things:
1. Does a user with email `admin@sexyresume.com` exist in `auth.users`?
2. Does that user have a record in `admin_users` table with active permissions?

Both must be true for login to work.
