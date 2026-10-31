import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleOperationalError,
  parseJsonBody,
  validationResponse,
} from '@/lib/operational/routeHelpers';
import {
  deleteSchedule,
  updateSchedule,
} from '@/lib/operational/scheduleService';
import { scheduleSchema } from '@/lib/validations/operational';

export async function PATCH(request, { params }) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { id } = await params;
  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const schedule = await updateSchedule(id, parsed.data);
    return NextResponse.json({ data: schedule });
  } catch (error) {
    return handleOperationalError(error, 'Jadwal');
  }
}

export async function DELETE(_request, { params }) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { id } = await params;

  try {
    return NextResponse.json(await deleteSchedule(id));
  } catch (error) {
    return handleOperationalError(error, 'Jadwal');
  }
}
