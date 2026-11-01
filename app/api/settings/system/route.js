import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleApiError,
  parseJsonBody,
  validationResponse,
} from '@/lib/api/routeHelpers';
import {
  getSystemSettings,
  updateSystemSettings,
} from '@/lib/settings/settingsService';
import { systemSettingsSchema } from '@/lib/settings/settingsValidation';

export async function GET() {
  const { response } = await requireApiUser(['SUPERADMIN']);
  if (response) return response;

  try {
    const settings = await getSystemSettings();

    if (!settings) {
      return NextResponse.json(
        {
          code: 'SETTINGS_NOT_SEEDED',
          message:
            'Pengaturan sistem belum tersedia di database. Jalankan migration dan seeder terlebih dahulu.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ data: settings });
  } catch (error) {
    return handleApiError(error, 'Pengaturan sistem');
  }
}

export async function PUT(request) {
  const { user, response } = await requireApiUser(['SUPERADMIN']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = systemSettingsSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const settings = await updateSystemSettings(parsed.data, user);
    revalidateTag('system-settings', 'max');
    revalidateTag('public-landing', 'max');
    return NextResponse.json({ data: settings });
  } catch (error) {
    return handleApiError(error, 'Pengaturan sistem');
  }
}
