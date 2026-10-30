import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { assertSupabaseConfigured } from './env';

export function createAdminClient() {
  const config = assertSupabaseConfigured();
  if (!config.hasServiceRoleKey) {
    console.warn(
      '[Supabase Admin] WARNING: SUPABASE_SERVICE_ROLE_KEY is missing or invalid in .env.local. Admin operations will fallback to anon key and may be rejected by Row Level Security (RLS) policies.'
    );
  }
  return createSupabaseClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
