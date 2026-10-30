import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth-service';
import { createClient } from '@/lib/supabase/server';
import { listInvitations } from '@/lib/invitation-service';
import * as XLSX from 'xlsx';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { invitations } = await listInvitations({ pageSize: 1000, client: supabase });

    const rows = invitations.map((inv) => ({
      'Guest Name': inv.guest?.full_name || '',
      'Household': inv.guest?.household_name || '',
      'Email': inv.guest?.email || '',
      'Phone': inv.guest?.phone || '',
      'Invited Seats': inv.max_attendees,
      'Invitation Status': inv.status,
      'RSVP Status': inv.rsvp?.attendance_status || 'pending',
      'Attending Count': inv.rsvp?.attendee_count || 0,
      'Attendee Names': Array.isArray(inv.rsvp?.attendee_names) ? inv.rsvp.attendee_names.join(', ') : '',
      'Guest Message': inv.rsvp?.guest_message || '',
      'RSVP Date': inv.rsvp?.submitted_at || '',
      'Created Date': inv.created_at,
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Wedding Invitations');

    const acceptedRows = rows.filter((r) => r['RSVP Status'] === 'accepted');
    const acceptedSheet = XLSX.utils.json_to_sheet(acceptedRows);
    XLSX.utils.book_append_sheet(book, acceptedSheet, 'Accepted Guests');

    const buf = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="wedding-guest-invitations.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
