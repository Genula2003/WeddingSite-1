import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnvConfig } from './env';

export function createClient() {
  const config = getSupabaseEnvConfig();
  return createBrowserClient(config.url, config.anonKey);
}
