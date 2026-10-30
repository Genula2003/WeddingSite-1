import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth-service';
import { createClient } from '@/lib/supabase/server';
import { listGuests, createInvitation, updateInvitation, deleteInvitation } from '@/lib/invitation-service';

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || undefined;
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;

    const result = await listGuests({ search, page, pageSize, client: supabase });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve guests';
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
    const fullName = String(body.name || body.fullName || '').trim();
    const seats = Number(body.seats || body.maxAttendees || 1);

    if (!fullName || !Number.isInteger(seats) || seats < 1 || seats > 20) {
      return NextResponse.json({ error: 'Enter a valid name and 1–20 seats' }, { status: 400 });
    }

    const created = await createInvitation({
      fullName,
      householdName: body.householdName || null,
      email: body.email || null,
      phone: body.phone || null,
      privateNotes: body.privateNotes || null,
      maxAttendees: seats,
      createdById: admin.user.id,
      client: supabase,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create guest';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    await updateInvitation(id, {
      maxAttendees: body.seats !== undefined ? Number(body.seats) : undefined,
      guest: {
        fullName: body.name || undefined,
        householdName: body.householdName,
        email: body.email,
        phone: body.phone,
        privateNotes: body.privateNotes,
      },
      client: supabase,
    });

    return NextResponse.json({ ok: true, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update guest';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    await deleteInvitation(id, supabase);
    return NextResponse.json({ ok: true, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete guest';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
