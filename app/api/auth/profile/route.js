import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import { updateMyProfile } from '@/lib/auth/profileService';
import {
  getAuthFieldErrors,
  profileUpdateSchema,
} from '@/lib/validations/auth';

export async function PATCH(request) {
  const { user, response } = await requireApiUser();
  if (response) return response;

  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'INVALID_JSON', message: 'Format data yang dikirim tidak valid.' },
      { status: 400 }
    );
  }

  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        code: 'VALIDATION_ERROR',
        message: 'Data profil belum memenuhi ketentuan.',
        fieldErrors: getAuthFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  try {
    const result = await updateMyProfile(user.id, parsed.data);

    if (!result.ok) {
      return NextResponse.json(
        { code: result.code, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error('[Profile] Gagal memperbarui profil:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kendala saat menyimpan profil. Coba lagi beberapa saat.',
      },
      { status: 500 }
    );
  }
}
