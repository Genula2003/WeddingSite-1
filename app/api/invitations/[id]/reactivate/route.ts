import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth-service';
import { createClient } from '@/lib/supabase/server';
import { reactivateInvitation } from '@/lib/invitation-service';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const supabase = await createClient();
    await reactivateInvitation(id, admin.user.id, supabase);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reactivate invitation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
