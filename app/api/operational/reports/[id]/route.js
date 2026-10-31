import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  deleteReport,
  updateReport,
} from '@/lib/operational/reportService';
import {
  handleOperationalError,
  parseJsonBody,
  validationResponse,
} from '@/lib/operational/routeHelpers';
import { reportSchema } from '@/lib/validations/operational';

export async function PATCH(request, { params }) {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN', 'COACH']);
  if (response) return response;

  const { id } = await params;
  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return validationResponse(
      parsed.error,
      'Data raport belum memenuhi ketentuan.'
    );
  }

  try {
    const report = await updateReport(id, parsed.data, user);
    return NextResponse.json({ data: report });
  } catch (error) {
    return handleOperationalError(error, 'Raport');
  }
}

export async function DELETE(_request, { params }) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { id } = await params;

  try {
    return NextResponse.json(await deleteReport(id));
  } catch (error) {
    return handleOperationalError(error, 'Raport');
  }
}
