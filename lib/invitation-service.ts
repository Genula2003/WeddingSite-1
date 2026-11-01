import { randomBytes, createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from './supabase/admin';
import { getSupabaseEnvConfig } from './supabase/env';
import type {
  InvitationRecord,
  GuestRecord,
  RsvpRecord,
  InvitationEventRecord,
  InvitationWithDetails,
  PublicInvitationData,
  InvitationEventType,
  InvitationStatus,
  AttendanceStatus,
} from './supabase/types';

export function generateSecureToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

export function buildInvitationUrl(token: string, baseUrl?: string): string {
  const config = getSupabaseEnvConfig();
  const base = (baseUrl || config.siteUrl).replace(/\/+$/, '');
  return `${base}/invite/${token}`;
}

export async function createInvitation(params: {
  fullName: string;
  householdName?: string | null;
  email?: string | null;
  phone?: string | null;
  preferredLanguage?: string | null;
  privateNotes?: string | null;
  maxAttendees: number;
  expiresAt?: string | null;
  createdById?: string | null;
  baseUrl?: string | null;
  client?: SupabaseClient;
}) {
  const adminClient = params.client || createAdminClient();
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);

  const cleanName = params.fullName.trim();
  if (!cleanName) {
    throw new Error('Guest full name is required');
  }

  const seats = Math.max(1, Math.min(20, Number(params.maxAttendees) || 1));

  const { data: guest, error: guestError } = await adminClient
    .from('guests')
    .insert({
      full_name: cleanName,
      household_name: params.householdName?.trim() || null,
      email: params.email?.trim() || null,
      phone: params.phone?.trim() || null,
      preferred_language: params.preferredLanguage?.trim() || 'en',
      private_notes: params.privateNotes?.trim() || null,
    })
    .select('*')
    .single();

  if (guestError || !guest) {
    const errorMsg = guestError?.message || 'Failed to create guest record';
    if (errorMsg.includes('row-level security')) {
      throw new Error(
        'Database Row-Level Security blocked this operation. Please configure SUPABASE_SERVICE_ROLE_KEY in your .env.local file or check table RLS policies.'
      );
    }
    throw new Error(errorMsg);
  }

  const { data: invitation, error: invError } = await adminClient
    .from('invitations')
    .insert({
      guest_id: guest.id,
      token_hash: tokenHash,
      status: 'generated',
      max_attendees: seats,
      expires_at: params.expiresAt || null,
      created_by: params.createdById || null,
    })
    .select('*')
    .single();

  if (invError || !invitation) {
    await adminClient.from('guests').delete().eq('id', guest.id);
    throw new Error(invError?.message || 'Failed to create invitation record');
  }

  await adminClient.from('invitation_events').insert({
    invitation_id: invitation.id,
    event_type: 'created',
    created_by: params.createdById || null,
    metadata: {
      max_attendees: seats,
      guest_name: cleanName,
    },
  });

  return {
    rawToken,
    invitationUrl: buildInvitationUrl(rawToken, params.baseUrl || undefined),
    invitation: invitation as InvitationRecord,
    guest: guest as GuestRecord,
  };
}

export async function resolvePublicInvitation(
  rawToken: string,
  trackView: boolean = true
): Promise<PublicInvitationData | null> {
  if (!rawToken || typeof rawToken !== 'string') {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const adminClient = createAdminClient();

  const { data: invitation, error: invError } = await adminClient
    .from('invitations')
    .select('*, guest:guests(*), rsvp:rsvps(*)')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (invError || !invitation || !invitation.guest) {
    return null;
  }

  const now = new Date();
  const isRevoked = invitation.status === 'revoked' || Boolean(invitation.revoked_at);
  const isExpired = Boolean(invitation.expires_at && new Date(invitation.expires_at) < now);

  if (trackView && !isRevoked && !isExpired) {
    const lastViewed = invitation.last_viewed_at ? new Date(invitation.last_viewed_at).getTime() : 0;
    const thirtyMinutesMs = 30 * 60 * 1000;

    if (Date.now() - lastViewed > thirtyMinutesMs) {
      const nextStatus: InvitationStatus =
        invitation.status === 'generated' ||
        invitation.status === 'link_copied' ||
        invitation.status === 'share_initiated'
          ? 'viewed'
          : (invitation.status as InvitationStatus);

      await adminClient
        .from('invitations')
        .update({
          status: nextStatus,
          last_viewed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', invitation.id);

      await adminClient.from('invitation_events').insert({
        invitation_id: invitation.id,
        event_type: 'viewed',
        created_by: null,
        metadata: {
          client_time: now.toISOString(),
        },
      });
    }
  }

  const rsvp = invitation.rsvp
    ? {
        status: invitation.rsvp.attendance_status as AttendanceStatus,
        attendeeCount: invitation.rsvp.attendee_count,
        attendeeNames: Array.isArray(invitation.rsvp.attendee_names) ? invitation.rsvp.attendee_names : [],
        guestMessage: invitation.rsvp.guest_message,
      }
    : null;

  return {
    invitationId: invitation.id,
    guestName: invitation.guest.full_name,
    householdName: invitation.guest.household_name,
    maxAttendees: invitation.max_attendees,
    status: invitation.status as InvitationStatus,
    isExpired,
    isRevoked,
    rsvp,
  };
}

export async function submitRsvp(params: {
  rawToken: string;
  attendanceStatus: AttendanceStatus;
  attendeeCount: number;
  attendeeNames?: string[];
  guestMessage?: string | null;
}) {
  const tokenHash = hashToken(params.rawToken);
  const adminClient = createAdminClient();

  const { data: invitation, error } = await adminClient
    .from('invitations')
    .select('*, guest:guests(*), rsvp:rsvps(*)')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !invitation) {
    throw new Error('Invitation not found or link is invalid');
  }

  if (invitation.status === 'revoked' || invitation.revoked_at) {
    throw new Error('This invitation has been revoked and cannot receive RSVP responses.');
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    throw new Error('This invitation has expired.');
  }

  if (!['accepted', 'declined'].includes(params.attendanceStatus)) {
    throw new Error('Invalid attendance response');
  }

  let finalCount = 0;
  if (params.attendanceStatus === 'accepted') {
    finalCount = Math.max(1, Math.min(invitation.max_attendees, Number(params.attendeeCount) || 1));
  }

  const cleanedNames = Array.isArray(params.attendeeNames)
    ? params.attendeeNames.map((n) => String(n).trim().slice(0, 100)).filter(Boolean)
    : [];

  const cleanedMessage = params.guestMessage?.trim().slice(0, 1000) || null;
  const now = new Date().toISOString();

  const existingRsvp = invitation.rsvp;
  let rsvpRecord: RsvpRecord;

  if (existingRsvp) {
    const { data: updated, error: updateError } = await adminClient
      .from('rsvps')
      .update({
        attendance_status: params.attendanceStatus,
        attendee_count: finalCount,
        attendee_names: cleanedNames,
        guest_message: cleanedMessage,
        updated_at: now,
      })
      .eq('id', existingRsvp.id)
      .select('*')
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message || 'Failed to update RSVP');
    }
    rsvpRecord = updated as RsvpRecord;

    await adminClient.from('invitation_events').insert({
      invitation_id: invitation.id,
      event_type: 'rsvp_updated',
      created_by: null,
      metadata: {
        status: params.attendanceStatus,
        attendee_count: finalCount,
      },
    });
  } else {
    const { data: inserted, error: insertError } = await adminClient
      .from('rsvps')
      .insert({
        invitation_id: invitation.id,
        attendance_status: params.attendanceStatus,
        attendee_count: finalCount,
        attendee_names: cleanedNames,
        guest_message: cleanedMessage,
        submitted_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message || 'Failed to submit RSVP');
    }
    rsvpRecord = inserted as RsvpRecord;

    await adminClient.from('invitation_events').insert({
      invitation_id: invitation.id,
      event_type: 'rsvp_submitted',
      created_by: null,
      metadata: {
        status: params.attendanceStatus,
        attendee_count: finalCount,
      },
    });
  }

  if (cleanedMessage) {
    await adminClient.from('guest_wishes').insert({
      invitation_id: invitation.id,
      guest_name: invitation.guest.full_name,
      message: cleanedMessage,
    });
  }

  return rsvpRecord;
}

export async function submitGuestWish(params: { rawToken: string; message: string }) {
  const tokenHash = hashToken(params.rawToken);
  const adminClient = createAdminClient();

  const { data: invitation, error } = await adminClient
    .from('invitations')
    .select('*, guest:guests(*)')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !invitation) {
    throw new Error('Invitation not found');
  }

  const cleanMessage = params.message.trim().slice(0, 1000);
  if (!cleanMessage) {
    throw new Error('Message cannot be empty');
  }

  const { count } = await adminClient
    .from('guest_wishes')
    .select('*', { count: 'exact', head: true })
    .eq('invitation_id', invitation.id);

  if ((count || 0) >= 5) {
    throw new Error('You have reached the maximum number of wishes allowed (5).');
  }

  const { data: wish, error: wishError } = await adminClient
    .from('guest_wishes')
    .insert({
      invitation_id: invitation.id,
      guest_name: invitation.guest.full_name,
      message: cleanMessage,
    })
    .select('*')
    .single();

  if (wishError || !wish) {
    throw new Error(wishError?.message || 'Failed to send wish');
  }

  return wish;
}

export async function listGuestWishes(limit: number = 50) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('guest_wishes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }
  return data;
}

export async function listInvitations(params: {
  search?: string;
  status?: string;
  rsvpStatus?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'name';
  sortOrder?: 'asc' | 'desc';
  client?: SupabaseClient;
}) {
  const adminClient = params.client || createAdminClient();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize || 10));
  const offset = (page - 1) * pageSize;

  let query = adminClient
    .from('invitations')
    .select('*, guest:guests!inner(*), rsvp:rsvps(*)', { count: 'exact' });

  if (params.search) {
    const s = params.search.trim();
    query = query.or(
      `full_name.ilike.%${s}%,household_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`,
      { foreignTable: 'guest' }
    );
  }

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  if (params.rsvpStatus && params.rsvpStatus !== 'all') {
    if (params.rsvpStatus === 'pending') {
      query = query.or('rsvp.is.null,attendance_status.eq.pending', { foreignTable: 'rsvp' });
    } else {
      query = query.eq('rsvp.attendance_status', params.rsvpStatus);
    }
  }

  if (params.sortBy === 'name') {
    query = query.order('full_name', {
      ascending: params.sortOrder === 'asc',
      foreignTable: 'guest',
    });
  } else {
    query = query.order('created_at', {
      ascending: params.sortOrder === 'asc',
    });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return {
    invitations: (data || []) as unknown as InvitationWithDetails[],
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getInvitationDetails(id: string, client?: SupabaseClient): Promise<InvitationWithDetails | null> {
  const adminClient = client || createAdminClient();
  const { data, error } = await adminClient
    .from('invitations')
    .select('*, guest:guests(*), rsvp:rsvps(*), events:invitation_events(*)')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (data.events) {
    data.events.sort(
      (a: InvitationEventRecord, b: InvitationEventRecord) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return data as unknown as InvitationWithDetails;
}

export async function updateInvitation(
  id: string,
  params: {
    maxAttendees?: number;
    expiresAt?: string | null;
    guest?: {
      fullName?: string;
      householdName?: string | null;
      email?: string | null;
      phone?: string | null;
      privateNotes?: string | null;
    };
    client?: SupabaseClient;
  }
) {
  const adminClient = params.client || createAdminClient();
  const { data: inv } = await adminClient.from('invitations').select('guest_id').eq('id', id).single();
  if (!inv) {
    throw new Error('Invitation not found');
  }

  if (params.guest) {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (params.guest.fullName !== undefined) updates.full_name = params.guest.fullName.trim();
    if (params.guest.householdName !== undefined) updates.household_name = params.guest.householdName?.trim() || null;
    if (params.guest.email !== undefined) updates.email = params.guest.email?.trim() || null;
    if (params.guest.phone !== undefined) updates.phone = params.guest.phone?.trim() || null;
    if (params.guest.privateNotes !== undefined) updates.private_notes = params.guest.privateNotes?.trim() || null;

    await adminClient.from('guests').update(updates).eq('id', inv.guest_id);
  }

  const invUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.maxAttendees !== undefined) {
    invUpdates.max_attendees = Math.max(1, Math.min(20, params.maxAttendees));
  }
  if (params.expiresAt !== undefined) {
    invUpdates.expires_at = params.expiresAt;
  }

  const { data: updated, error } = await adminClient
    .from('invitations')
    .update(invUpdates)
    .eq('id', id)
    .select('*, guest:guests(*), rsvp:rsvps(*)')
    .single();

  if (error || !updated) {
    throw new Error(error?.message || 'Failed to update invitation');
  }

  return updated;
}

export async function replaceInvitationToken(
  id: string,
  adminUserId?: string,
  client?: SupabaseClient,
  baseUrl?: string | null
) {
  const adminClient = client || createAdminClient();
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);

  const { data: updated, error } = await adminClient
    .from('invitations')
    .update({
      token_hash: tokenHash,
      status: 'generated',
      revoked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, guest:guests(*)')
    .single();

  if (error || !updated) {
    throw new Error(error?.message || 'Failed to replace token');
  }

  await adminClient.from('invitation_events').insert({
    invitation_id: id,
    event_type: 'token_replaced',
    created_by: adminUserId || null,
    metadata: {
      replaced_at: new Date().toISOString(),
    },
  });

  return {
    rawToken,
    invitationUrl: buildInvitationUrl(rawToken, baseUrl || undefined),
    invitation: updated,
  };
}

export async function recordInvitationEvent(
  invitationId: string,
  eventType: InvitationEventType,
  metadata: Record<string, unknown> = {},
  adminUserId?: string,
  client?: SupabaseClient
) {
  const adminClient = client || createAdminClient();
  await adminClient.from('invitation_events').insert({
    invitation_id: invitationId,
    event_type: eventType,
    created_by: adminUserId || null,
    metadata,
  });

  const statusMap: Partial<Record<InvitationEventType, InvitationStatus>> = {
    link_copied: 'link_copied',
    share_initiated: 'share_initiated',
    sent: 'sent',
    delivered: 'delivered',
    viewed: 'viewed',
    revoked: 'revoked',
  };

  const nextStatus = statusMap[eventType];
  if (nextStatus) {
    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };
    if (eventType === 'revoked') {
      updatePayload.revoked_at = new Date().toISOString();
    }
    await adminClient.from('invitations').update(updatePayload).eq('id', invitationId);
  }
}

export async function revokeInvitation(id: string, adminUserId?: string, client?: SupabaseClient) {
  return recordInvitationEvent(id, 'revoked', {}, adminUserId, client);
}

export async function reactivateInvitation(id: string, adminUserId?: string, client?: SupabaseClient) {
  const adminClient = client || createAdminClient();
  await adminClient
    .from('invitations')
    .update({
      status: 'generated',
      revoked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  await adminClient.from('invitation_events').insert({
    invitation_id: id,
    event_type: 'reactivated',
    created_by: adminUserId || null,
    metadata: {},
  });
}

export async function deleteInvitation(id: string, client?: SupabaseClient) {
  const adminClient = client || createAdminClient();
  const { data: inv } = await adminClient.from('invitations').select('guest_id').eq('id', id).single();
  if (inv?.guest_id) {
    await adminClient.from('guests').delete().eq('id', inv.guest_id);
  } else {
    await adminClient.from('invitations').delete().eq('id', id);
  }
}

export async function listGuests(params: { search?: string; page?: number; pageSize?: number; client?: SupabaseClient }) {
  const adminClient = params.client || createAdminClient();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize || 15));
  const offset = (page - 1) * pageSize;

  let query = adminClient
    .from('guests')
    .select('*, invitations(*, rsvp:rsvps(*))', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (params.search) {
    const s = params.search.trim();
    query = query.or(
      `full_name.ilike.%${s}%,household_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`
    );
  }

  query = query.range(offset, offset + pageSize - 1);
  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return {
    guests: data || [],
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getDashboardStatistics(client?: SupabaseClient) {
  const adminClient = client || createAdminClient();

  const { data: invitations } = await adminClient
    .from('invitations')
    .select('id, status, max_attendees, last_viewed_at, created_at, rsvp:rsvps(attendance_status, attendee_count), guest:guests(full_name)');

  const invList = invitations || [];

  let totalInvitedSeats = 0;
  let totalInvitations = invList.length;
  let invitationsShared = 0;
  let invitationsAwaitingDelivery = 0;
  let invitationsViewed = 0;
  let confirmedAttendance = 0;
  let declinedAttendance = 0;
  let pendingRsvp = 0;
  let totalExpectedAttendees = 0;

  for (const inv of invList) {
    totalInvitedSeats += Number(inv.max_attendees) || 0;

    if (['share_initiated', 'sent', 'delivered', 'viewed'].includes(inv.status)) {
      invitationsShared += 1;
    }
    if (['generated', 'link_copied'].includes(inv.status)) {
      invitationsAwaitingDelivery += 1;
    }
    if (inv.status === 'viewed' || inv.last_viewed_at) {
      invitationsViewed += 1;
    }

    const rsvpArray = Array.isArray(inv.rsvp) ? inv.rsvp : inv.rsvp ? [inv.rsvp] : [];
    const rsvp = rsvpArray[0];

    if (!rsvp || rsvp.attendance_status === 'pending') {
      pendingRsvp += 1;
    } else if (rsvp.attendance_status === 'accepted') {
      confirmedAttendance += 1;
      totalExpectedAttendees += Number(rsvp.attendee_count) || 0;
    } else if (rsvp.attendance_status === 'declined') {
      declinedAttendance += 1;
    }
  }

  const { data: recentEvents } = await adminClient
    .from('invitation_events')
    .select('id, event_type, created_at, metadata, invitation:invitations(guest:guests(full_name))')
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    totalInvitedSeats,
    totalInvitations,
    invitationsShared,
    invitationsAwaitingDelivery,
    invitationsViewed,
    confirmedAttendance,
    declinedAttendance,
    pendingRsvp,
    totalExpectedAttendees,
    recentEvents: recentEvents || [],
  };
}
