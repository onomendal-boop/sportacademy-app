import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import { handleApiError } from '@/lib/api/routeHelpers';
import { getDatabaseBackupFile } from '@/lib/settings/backupService';

export async function GET(_request, { params }) {
  const { user, response } = await requireApiUser(['SUPERADMIN']);
  if (response) return response;

  try {
    const { id } = await params;
    const backup = await getDatabaseBackupFile(user, id);

    return new NextResponse(backup.content, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${backup.fileName}"`,
        'Content-Length': String(new TextEncoder().encode(backup.content).length),
        'Cache-Control': 'no-store',
        'X-Backup-Id': backup.id,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Backup database');
  }
}
