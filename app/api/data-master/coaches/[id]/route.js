import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import { deleteCoach, updateCoach } from '@/lib/data-master/coachService';
import {
  handleDataMasterError,
  parseJsonBody,
  validationResponse,
} from '@/lib/data-master/routeHelpers';
import { coachUpdateSchema } from '@/lib/validations/dataMaster';

export async function PATCH(request, { params }) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { id } = await params;
  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = coachUpdateSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const coach = await updateCoach(id, parsed.data);
    return NextResponse.json({ data: coach });
  } catch (error) {
    return handleDataMasterError(error, 'Pelatih');
  }
}

export async function DELETE(_request, { params }) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { id } = await params;

  try {
    return NextResponse.json(await deleteCoach(id));
  } catch (error) {
    return handleDataMasterError(error, 'Pelatih');
  }
}
