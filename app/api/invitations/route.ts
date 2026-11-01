import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth-service';
import { createClient } from '@/lib/supabase/server';
import { listInvitations, createInvitation } from '@/lib/invitation-service';
import { resolveRequestBaseUrl } from '@/lib/supabase/env';

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const rsvpStatus = url.searchParams.get('rsvpStatus') || undefined;
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 10;
    const sortByParam = url.searchParams.get('sortBy');
    const sortBy = sortByParam === 'name' ? 'name' : 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const result = await listInvitations({
      search,
      status,
      rsvpStatus,
      page,
      pageSize,
      sortBy,
      sortOrder,
      client: supabase,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve invitations';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const body = await req.json();
    const fullName = String(body.fullName || body.name || '').trim();
    if (!fullName) {
      return NextResponse.json({ error: 'Guest name is required' }, { status: 400 });
    }

    const maxAttendees = Number(body.maxAttendees || body.seats || 1);
    if (!Number.isInteger(maxAttendees) || maxAttendees < 1 || maxAttendees > 20) {
      return NextResponse.json({ error: 'Invited attendees must be between 1 and 20' }, { status: 400 });
    }

    const baseUrl = resolveRequestBaseUrl(req, body.baseUrl);

    const result = await createInvitation({
      fullName,
      householdName: body.householdName ? String(body.householdName).trim() : null,
      email: body.email ? String(body.email).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      preferredLanguage: body.preferredLanguage ? String(body.preferredLanguage).trim() : 'en',
      privateNotes: body.privateNotes ? String(body.privateNotes).trim() : null,
      maxAttendees,
      expiresAt: body.expiresAt ? String(body.expiresAt) : null,
      createdById: admin.user.id,
      baseUrl,
      client: supabase,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create invitation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
