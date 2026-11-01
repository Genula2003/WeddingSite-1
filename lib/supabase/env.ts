export interface SupabaseEnvConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  siteUrl: string;
  adminEmail: string;
  isConfigured: boolean;
  hasServiceRoleKey: boolean;
}

export function getBaseSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://www.chathuragimasha.site';
  }
  return (envUrl || 'https://www.chathuragimasha.site').replace(/\/+$/, '');
}

export function resolveRequestBaseUrl(
  req?: Request | { headers: { get(name: string): string | null }; nextUrl?: { origin: string } } | null,
  explicitUrl?: string | null
): string {
  if (explicitUrl && typeof explicitUrl === 'string' && !explicitUrl.includes('localhost') && !explicitUrl.includes('127.0.0.1')) {
    return explicitUrl.replace(/\/+$/, '');
  }

  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/+$/, '');
  }

  if (req && req.headers) {
    const origin = req.headers.get('origin');
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin.replace(/\/+$/, '');
    }

    const forwardedHost = req.headers.get('x-forwarded-host');
    const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
    if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
      return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, '');
    }

    const host = req.headers.get('host');
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
      return `${proto}://${host}`.replace(/\/+$/, '');
    }

    if ('nextUrl' in req && req.nextUrl?.origin && !req.nextUrl.origin.includes('localhost')) {
      return req.nextUrl.origin.replace(/\/+$/, '');
    }
  }

  if (process.env.NODE_ENV !== 'production' && envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  return 'https://www.chathuragimasha.site';
}

export function getSupabaseEnvConfig(): SupabaseEnvConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;
  const siteUrl = getBaseSiteUrl();
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
