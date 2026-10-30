import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth-service';
import { createClient } from '@/lib/supabase/server';
import { recordInvitationEvent } from '@/lib/invitation-service';
import type { InvitationEventType } from '@/lib/supabase/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const supabase = await createClient();
    const body = await req.json();
    const eventType = body.eventType as InvitationEventType;
    const validEvents: InvitationEventType[] = ['link_copied', 'share_initiated', 'sent', 'delivered'];

    if (!validEvents.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    await recordInvitationEvent(id, eventType, body.metadata || {}, admin.user.id, supabase);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record event';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
