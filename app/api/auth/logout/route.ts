import { NextResponse } from 'next/server';
import { logoutAdmin } from '@/lib/auth-service';

export async function POST() {
  await logoutAdmin();
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await logoutAdmin();
  return NextResponse.json({ success: true });
}
