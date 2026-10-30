import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin, logoutAdmin } from '@/lib/auth-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body.username || body.identifier || body.email || '').trim();
    const password = String(body.password || '');

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Username/email and password required' }, { status: 400 });
    }

    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    const clientIp = forwardedFor.split(',')[0].trim() || '127.0.0.1';

    const result = await loginAdmin(identifier, password, clientIp);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Authentication failed' }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      success: true,
      mustChangePassword: result.mustChangePassword,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  await logoutAdmin();
  return NextResponse.json({ ok: true, success: true });
}
