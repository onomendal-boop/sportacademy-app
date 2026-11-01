import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import { searchDashboard } from '@/lib/dashboard/searchService';

export async function GET(request) {
  const { user, response } = await requireApiUser();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const data = await searchDashboard(user, searchParams.get('q') ?? '');

    return NextResponse.json(
      { data },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[dashboard-search:get]', error);
    return NextResponse.json(
      {
        code: 'DASHBOARD_SEARCH_ERROR',
        message: 'Pencarian dashboard gagal diproses. Silakan coba lagi.',
      },
      { status: 500 }
    );
  }
}
