import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME || 'admin12';
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'welcome123';
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin12@wedding.internal';

  if (!url || !serviceRoleKey) {
    process.stderr.write('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment.\n');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    process.stderr.write(`Failed to list auth users: ${listError.message}\n`);
    process.exit(1);
  }

  let user = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (user) {
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { username, role: 'admin' },
    });

    if (updateError || !updatedUser.user) {
      process.stderr.write(`Failed to update existing user: ${updateError?.message}\n`);
      process.exit(1);
    }
    user = updatedUser.user;
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role: 'admin' },
    });

    if (createError || !newUser.user) {
      process.stderr.write(`Failed to create user: ${createError?.message}\n`);
      process.exit(1);
    }
    user = newUser.user;
  }

  const { error: profileError } = await supabase.from('admin_profiles').upsert(
    {
      id: user.id,
      username,
      role: 'admin',
      must_change_password: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    process.stderr.write(`Failed to upsert admin profile: ${profileError.message}\n`);
    process.exit(1);
  }

  process.stdout.write(`Successfully provisioned administrator account!\nUsername: ${username}\nEmail: ${email}\nInitial Password: ${password}\n`);
}

main().catch((err) => {
  process.stderr.write(`Unexpected error: ${err.message}\n`);
  process.exit(1);
});
