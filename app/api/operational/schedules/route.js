import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleOperationalError,
  parseJsonBody,
  validationResponse,
} from '@/lib/operational/routeHelpers';
import {
  createSchedule,
  getSchedules,
} from '@/lib/operational/scheduleService';
import { scheduleSchema } from '@/lib/validations/operational';

export async function GET() {
  const { response } = await requireApiUser();
  if (response) return response;

  try {
    return NextResponse.json({ data: await getSchedules() });
  } catch (error) {
    return handleOperationalError(error, 'Jadwal');
  }
}

export async function POST(request) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const schedule = await createSchedule(parsed.data);
    return NextResponse.json({ data: schedule }, { status: 201 });
  } catch (error) {
    return handleOperationalError(error, 'Jadwal');
  }
}
