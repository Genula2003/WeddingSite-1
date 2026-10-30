export type AdminRole = 'admin';

export interface AdminProfile {
  id: string;
  username: string;
  role: AdminRole;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuestRecord {
  id: string;
  full_name: string;
  household_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_language: string | null;
  private_notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export type InvitationStatus =
  | 'generated'
  | 'link_copied'
  | 'share_initiated'
  | 'sent'
  | 'delivered'
  | 'viewed'
  | 'revoked'
  | 'expired';

export interface InvitationRecord {
  id: string;
  guest_id: string;
  token_hash: string;
  status: InvitationStatus;
  max_attendees: number;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  last_viewed_at: string | null;
}

export type AttendanceStatus = 'accepted' | 'declined' | 'pending';

export interface RsvpRecord {
  id: string;
  invitation_id: string;
  attendance_status: AttendanceStatus;
  attendee_count: number;
  attendee_names: string[];
  guest_message: string | null;
  submitted_at: string;
  updated_at: string;
}

export type InvitationEventType =
  | 'created'
  | 'link_copied'
  | 'share_initiated'
  | 'sent'
  | 'delivered'
  | 'viewed'
  | 'rsvp_submitted'
  | 'rsvp_updated'
  | 'token_replaced'
  | 'revoked'
  | 'reactivated';

export interface InvitationEventRecord {
  id: string;
  invitation_id: string;
  event_type: InvitationEventType;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface GuestWishRecord {
  id: string;
  invitation_id: string;
  guest_name: string;
  message: string;
  created_at: string;
}

export interface InvitationWithDetails extends InvitationRecord {
  guest: GuestRecord;
  rsvp: RsvpRecord | null;
  events?: InvitationEventRecord[];
}

export interface PublicInvitationData {
  invitationId: string;
  guestName: string;
  householdName: string | null;
  maxAttendees: number;
  status: InvitationStatus;
  isExpired: boolean;
  isRevoked: boolean;
  rsvp: {
    status: AttendanceStatus;
    attendeeCount: number;
    attendeeNames: string[];
    guestMessage: string | null;
  } | null;
}
