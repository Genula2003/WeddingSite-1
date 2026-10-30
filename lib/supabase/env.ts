export interface SupabaseEnvConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  siteUrl: string;
  adminEmail: string;
  isConfigured: boolean;
  hasServiceRoleKey: boolean;
}

export function getSupabaseEnvConfig(): SupabaseEnvConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin12@wedding-invitation.com';

  const hasServiceRoleKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY.length > 20
  );

  const isConfigured = Boolean(
    url &&
    url.startsWith('https://') &&
    anonKey &&
    anonKey.length > 20
  );

  return {
    url,
    anonKey,
    serviceRoleKey,
    siteUrl,
    adminEmail,
    isConfigured,
    hasServiceRoleKey,
  };
}

export function assertSupabaseConfigured(): SupabaseEnvConfig {
  const config = getSupabaseEnvConfig();
  if (!config.isConfigured) {
    throw new Error(
      'Supabase is not properly configured. Missing or invalid NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }
  return config;
}
