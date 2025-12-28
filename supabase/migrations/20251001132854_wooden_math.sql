@@ .. @@
 -- Insert default super admin (you'll need to update this with your actual user ID)
--- IMPORTANT: Replace 'your-user-id-here' with your actual Supabase user ID
+-- IMPORTANT: Updated with actual user ID
 INSERT INTO public.admin_users (user_id, role, permissions, is_active, approved_at) VALUES
 (
-  'your-user-id-here'::uuid, -- REPLACE THIS WITH YOUR ACTUAL USER ID
+  'e06fdba9-3599-427d-beb0-5b5c2b524f8f'::uuid, -- Your actual user ID
   'super_admin',
   ARRAY[
     'admin_access',