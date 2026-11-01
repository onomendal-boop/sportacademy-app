import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import { getMyStudentProfile } from '@/lib/auth/profileService';
import { getWeeklyOccurrences } from '@/lib/operational/occurrenceService';
import {
  handleOperationalError,
  validationResponse,
} from '@/lib/operational/routeHelpers';
import { occurrenceQuerySchema } from '@/lib/validations/operational';

export async function GET(request) {
  const { user, response } = await requireApiUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const parsed = occurrenceQuerySchema.safeParse({
    program: searchParams.get('program') ?? undefined,
    weekStart: searchParams.get('weekStart') ?? '',
  });

  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const studentProfile =
      user.role === 'STUDENT' ? await getMyStudentProfile(user.id) : null;
    const occurrences = await getWeeklyOccurrences({
      ...parsed.data,
      viewer: {
        role: user.role,
        userId: user.id,
        studentId: studentProfile?.id ?? null,
        programScope: user.programScope ?? null,
      },
    });
    return NextResponse.json({ data: occurrences });
  } catch (error) {
    return handleOperationalError(error, 'Slot jadwal');
  }
}
