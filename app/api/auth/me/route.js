import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/authService';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        code: 'UNAUTHENTICATED',
        message: 'Anda belum login.',
      },
      { status: 401 }
    );
  }

  return NextResponse.json({ user });
}
