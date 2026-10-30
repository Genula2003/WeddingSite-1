import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth-service';
import { submitGuestWish, listGuestWishes } from '@/lib/invitation-service';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const wishes = await listGuestWishes();
    return NextResponse.json(wishes);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve wishes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || '').trim();
    const message = String(body.message || '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (!message || message.length > 1000) {
      return NextResponse.json({ error: 'Message must be between 1 and 1000 characters' }, { status: 400 });
    }

    const wish = await submitGuestWish({ rawToken: token, message });
    return NextResponse.json({ ok: true, success: true, wish });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit wish';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
