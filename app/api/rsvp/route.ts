import { NextRequest, NextResponse } from 'next/server';
import { submitRsvp } from '@/lib/invitation-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || '').trim();
    const status = String(body.status || '').trim();
    const count = Number(body.count || 0);
    const attendeeNames = Array.isArray(body.attendeeNames) ? body.attendeeNames : [];
    const guestMessage = body.guestMessage || body.message || null;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (!['accepted', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'Invalid response status' }, { status: 400 });
    }

    const result = await submitRsvp({
      rawToken: token,
      attendanceStatus: status as 'accepted' | 'declined',
      attendeeCount: count,
      attendeeNames,
      guestMessage,
    });

    return NextResponse.json({ ok: true, success: true, rsvp: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit RSVP';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
