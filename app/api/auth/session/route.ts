import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth-service';
import { getSupabaseEnvConfig } from '@/lib/supabase/env';

export async function GET() {
  const config = getSupabaseEnvConfig();
  if (!config.isConfigured) {
    return NextResponse.json({
      authenticated: false,
      configured: false,
      error: 'Supabase configuration is missing or incomplete.',
    });
  }

  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({
      authenticated: false,
      configured: true,
    });
  }

  return NextResponse.json({
    authenticated: true,
    configured: true,
    mustChangePassword: admin.profile.must_change_password,
    user: {
      id: admin.user.id,
      email: admin.user.email,
    },
    profile: admin.profile,
  });
}
