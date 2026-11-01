import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import { getDashboardNotifications } from '@/lib/dashboard/notificationService';

export async function GET() {
  const { user, response } = await requireApiUser();
  if (response) return response;

  try {
    const data = await getDashboardNotifications(user);

    return NextResponse.json(
      { data },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[dashboard-notifications:get]', error);
    return NextResponse.json(
      {
        code: 'DASHBOARD_NOTIFICATION_ERROR',
        message: 'Notifikasi gagal dimuat. Silakan coba lagi.',
      },
      { status: 500 }
    );
  }
}
