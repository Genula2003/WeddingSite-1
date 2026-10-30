import type { Metadata } from 'next';
import Wedding from '@/components/Wedding';
import { resolvePublicInvitation } from '@/lib/invitation-service';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const invitation = await resolvePublicInvitation(token, false);

  if (!invitation || invitation.isRevoked || invitation.isExpired) {
    return {
      title: 'Wedding Invitation | Chathura & Gimasha',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Wedding Invitation for ${invitation.guestName} | Chathura & Gimasha`,
    description: 'Together forever — 03 December 2026',
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await resolvePublicInvitation(token, true);

  if (!invitation) {
    return (
      <main className="invalid-invitation-container">
        <div className="invalid-invitation-card">
          <div className="invalid-eyebrow">WEDDING INVITATION</div>
          <h1 className="invalid-title">Chathura &amp; Gimasha</h1>
          <div className="invalid-flourish">── ♥ ──</div>
          <h2>Invitation Link Not Found</h2>
          <p>
            We could not locate an active invitation matching this link. Please check that the link was copied
            correctly or contact the couple directly.
          </p>
          <a href="/" className="btn">
            Visit Wedding Homepage
          </a>
        </div>
      </main>
    );
  }

  if (invitation.isRevoked) {
    return (
      <main className="invalid-invitation-container">
        <div className="invalid-invitation-card">
          <div className="invalid-eyebrow">WEDDING INVITATION</div>
          <h1 className="invalid-title">Chathura &amp; Gimasha</h1>
          <div className="invalid-flourish">── ♥ ──</div>
          <h2>Invitation Link Inactive</h2>
          <p>
            This personal invitation link has been updated or revoked. If you are expecting an invitation, please
            reach out to Chathura &amp; Gimasha to receive an updated link.
          </p>
          <a href="/" className="btn">
            Visit Wedding Homepage
          </a>
        </div>
      </main>
    );
  }

  if (invitation.isExpired) {
    return (
      <main className="invalid-invitation-container">
        <div className="invalid-invitation-card">
          <div className="invalid-eyebrow">WEDDING INVITATION</div>
          <h1 className="invalid-title">Chathura &amp; Gimasha</h1>
          <div className="invalid-flourish">── ♥ ──</div>
          <h2>Invitation Response Period Ended</h2>
          <p>
            Dear {invitation.guestName}, the RSVP period for this invitation has concluded. For any inquiries, please
            contact the couple directly.
          </p>
          <a href="/" className="btn">
            Visit Wedding Homepage
          </a>
        </div>
      </main>
    );
  }

  return (
    <Wedding
      guest={{
        name: invitation.guestName,
        household: invitation.householdName,
        token,
        seats: invitation.maxAttendees,
        status: invitation.rsvp?.status || 'pending',
        attending_count: invitation.rsvp?.attendeeCount || 1,
        attendee_names: invitation.rsvp?.attendeeNames || [],
        guest_message: invitation.rsvp?.guestMessage || '',
      }}
    />
  );
}
