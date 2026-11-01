import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import { handleApiError, parseJsonBody } from '@/lib/api/routeHelpers';
import {
  createDatabaseBackup,
  listDatabaseBackups,
} from '@/lib/settings/backupService';

export async function GET() {
  const { user, response } = await requireApiUser(['SUPERADMIN']);
  if (response) return response;

  try {
    return NextResponse.json({ data: await listDatabaseBackups(user) });
  } catch (error) {
    return handleApiError(error, 'Backup database');
  }
}

export async function POST(request) {
  const { user, response } = await requireApiUser(['SUPERADMIN']);
  if (response) return response;

  const { response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  try {
    const { backup, content } = await createDatabaseBackup(user);

    return new NextResponse(content, {
      status: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${backup.fileName}"`,
        'Content-Length': String(backup.sizeBytes),
        'Cache-Control': 'no-store',
        'X-Backup-Id': backup.id,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Backup database');
  }
}
