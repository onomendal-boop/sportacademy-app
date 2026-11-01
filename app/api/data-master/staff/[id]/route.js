import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleDataMasterError,
  parseJsonBody,
  validationResponse,
} from '@/lib/data-master/routeHelpers';
import { deleteStaff, updateStaff } from '@/lib/data-master/staffService';
import { staffSchema } from '@/lib/validations/dataMaster';

export async function PATCH(request, { params }) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { id } = await params;
  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = staffSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const staff = await updateStaff(id, parsed.data);
    return NextResponse.json({ data: staff });
  } catch (error) {
    return handleDataMasterError(error, 'Staff');
  }
}

export async function DELETE(_request, { params }) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { id } = await params;

  try {
    return NextResponse.json(await deleteStaff(id));
  } catch (error) {
    return handleDataMasterError(error, 'Staff');
  }
}
