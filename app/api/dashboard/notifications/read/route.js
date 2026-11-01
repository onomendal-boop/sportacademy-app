import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import { markNotificationsAsRead } from '@/lib/dashboard/notificationService';

export async function POST(request) {
  const { user, response } = await requireApiUser();
  if (response) return response;

  try {
    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.keys)) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Daftar notifikasi yang akan ditandai dibaca tidak valid.',
        },
        { status: 400 }
      );
    }

    const data = await markNotificationsAsRead(user, body.keys);

    return NextResponse.json(
      { data },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[dashboard-notifications:read]', error);
    return NextResponse.json(
      {
        code: 'DASHBOARD_NOTIFICATION_READ_ERROR',
        message: 'Status notifikasi gagal diperbarui. Silakan coba lagi.',
      },
      { status: 500 }
    );
  }
}
