import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';
import { getSupabaseEnvConfig } from './supabase/env';
import type { AdminProfile } from './supabase/types';

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function checkRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry) {
    return { allowed: true, retryAfterMs: 0 };
  }

  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.delete(key);
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.firstAttempt);
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true, retryAfterMs: 0 };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(key, { attempts: 1, firstAttempt: now });
  } else {
    entry.attempts += 1;
  }
}

function resetRateLimit(key: string): void {
  loginAttempts.delete(key);
}

export async function loginAdmin(identifier: string, password: string, clientIp: string = 'unknown') {
  const rateLimitKey = `${clientIp}:${identifier.toLowerCase().trim()}`;
  const rateLimit = checkRateLimit(rateLimitKey);

  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.retryAfterMs / 60000);
    return {
      success: false,
      error: `Too many failed login attempts. Please wait ${minutes} minute${minutes === 1 ? '' : 's'} before retrying.`,
      mustChangePassword: false,
    };
  }

  const config = getSupabaseEnvConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.',
      mustChangePassword: false,
    };
  }

  const cleanIdentifier = identifier.trim().toLowerCase();
  let emailToUse = cleanIdentifier;

  if (!cleanIdentifier.includes('@')) {
    if (cleanIdentifier === 'admin12') {
      emailToUse = config.adminEmail;
    } else {
      const adminClient = createAdminClient();
      const { data: profile } = await adminClient
        .from('admin_profiles')
        .select('id, username')
        .eq('username', cleanIdentifier)
        .maybeSingle();

      if (profile) {
        const { data: userResp } = await adminClient.auth.admin.getUserById(profile.id);
        if (userResp?.user?.email) {
          emailToUse = userResp.user.email;
        } else {
          recordFailedAttempt(rateLimitKey);
          return { success: false, error: 'Invalid credentials', mustChangePassword: false };
        }
      } else {
        recordFailedAttempt(rateLimitKey);
        return { success: false, error: 'Invalid credentials', mustChangePassword: false };
      }
    }
  }

  const supabase = await createClient();
  let signInResponse = await supabase.auth.signInWithPassword({
    email: emailToUse,
    password,
  });

  if (signInResponse.error && (password.toLowerCase() === 'welcome123')) {
    const altPassword = password === 'welcome123' ? 'Welcome123' : 'welcome123';
    const retryResult = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: altPassword,
    });
    if (!retryResult.error && retryResult.data.user) {
      signInResponse = retryResult;
    }
  }

  const { data, error } = signInResponse;

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes('email not confirmed')) {
      return {
        success: false,
        error: 'Email not confirmed in Supabase. Please confirm admin12@wedding-invitation.com in Supabase Auth -> Users or run the SQL confirmation snippet in SQL Editor.',
        mustChangePassword: false,
      };
    }
    recordFailedAttempt(rateLimitKey);
    return { success: false, error: 'Invalid credentials', mustChangePassword: false };
  }

  let { data: profile } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile && cleanIdentifier === 'admin12') {
    const { data: inserted } = await supabase
      .from('admin_profiles')
      .insert({
        id: data.user.id,
        username: 'admin12',
        role: 'admin',
        must_change_password: true,
      })
      .select('*')
      .maybeSingle();
    profile = inserted;
  }

  if (!profile && config.hasServiceRoleKey) {
    const adminClient = createAdminClient();
    const { data: adminProfile } = await adminClient
      .from('admin_profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    profile = adminProfile;
  }

  if (!profile || profile.role !== 'admin') {
    await supabase.auth.signOut();
    recordFailedAttempt(rateLimitKey);
    return { success: false, error: 'Unauthorized administrator role', mustChangePassword: false };
  }

  resetRateLimit(rateLimitKey);

  return {
    success: true,
    error: null,
    mustChangePassword: Boolean(profile.must_change_password),
    user: data.user,
    profile: profile as AdminProfile,
  };
}

export async function getAuthenticatedAdmin(): Promise<{ user: any; profile: AdminProfile } | null> {
  const config = getSupabaseEnvConfig();
  if (!config.isConfigured) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    let { data: profile } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!profile && config.hasServiceRoleKey) {
      const adminClient = createAdminClient();
      const { data: adminProfile } = await adminClient
        .from('admin_profiles')
        .select('*')
        .eq('id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      profile = adminProfile;
    }

    if (!profile) {
      return null;
    }

    return { user, profile: profile as AdminProfile };
  } catch {
    return null;
  }
}

export async function changeAdminPassword(newPassword: string): Promise<{ success: boolean; error: string | null }> {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  const authData = await getAuthenticatedAdmin();
  if (!authData) {
    return { success: false, error: 'Not authenticated.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase
    .from('admin_profiles')
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq('id', authData.user.id);

  return { success: true, error: null };
}

export async function logoutAdmin(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
  }
}
