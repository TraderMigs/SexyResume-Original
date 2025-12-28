/**
 * Script to create the admin user account
 * This should be run once to set up the admin user with the specified credentials
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // Admin credentials
    const adminEmail = 'admin@sexyresume.com';
    const adminPassword = 'Nenuco2124$$'; // Your specified password
    const adminFullName = 'Admin Migs';

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail);

    let userId: string;

    if (existingUser) {
      console.log('Admin user already exists. Updating password...');
      userId = existingUser.id;

      // Update the password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: adminPassword }
      );

      if (updateError) {
        throw updateError;
      }
      console.log('Password updated successfully');
    } else {
      console.log('Creating new admin user...');

      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminFullName
        }
      });

      if (createError) {
        throw createError;
      }

      if (!newUser.user) {
        throw new Error('User creation failed - no user returned');
      }

      userId = newUser.user.id;
      console.log('Admin user created successfully');
    }

    // Ensure user is in admin_users table with proper permissions
    console.log('Setting up admin permissions...');
    const { error: adminError } = await supabase
      .from('admin_users')
      .upsert({
        user_id: userId,
        role: 'super_admin',
        permissions: [
          'admin_access',
          'user_management',
          'audit_access',
          'security_admin',
          'data_purge',
          'system_admin'
        ],
        is_active: true,
        approved_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (adminError) {
      throw adminError;
    }

    console.log('\n✅ Admin user setup completed successfully!');
    console.log('\nAdmin Credentials:');
    console.log('Username: AdminMigs');
    console.log('Email:', adminEmail);
    console.log('Password: [Set as specified]');
    console.log('\nYou can now log in at /admin/login');

  } catch (error: any) {
    console.error('\n❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();
