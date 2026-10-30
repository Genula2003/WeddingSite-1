import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth-service';
import { getInvitationDetails, recordInvitationEvent, buildInvitationUrl } from '@/lib/invitation-service';
import { sendInvitationEmail } from '@/lib/email-service';

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
    const inv = await getInvitationDetails(id);
    if (!inv || !inv.guest) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const recipient = inv.guest.email?.trim();
    if (!recipient || !recipient.includes('@')) {
      return NextResponse.json({ error: 'Guest does not have a valid email address.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const customMessage = body.customMessage ? String(body.customMessage).trim() : undefined;

    const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/details-${id}`;
    const emailResult = await sendInvitationEmail({
      to: recipient,
      guestName: inv.guest.full_name,
      householdName: inv.guest.household_name,
      maxAttendees: inv.max_attendees,
      invitationUrl: body.invitationUrl || publicUrl,
      customMessage,
    });

    if (!emailResult.success) {
      return NextResponse.json({ error: emailResult.error }, { status: 502 });
    }

    await recordInvitationEvent(
      id,
      'sent',
      {
        channel: 'email',
        provider: 'resend',
        email_id: emailResult.emailId,
        recipient,
      },
      admin.user.id
    );

    return NextResponse.json({ success: true, emailId: emailResult.emailId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send invitation email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
