import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleDataMasterError,
  parseJsonBody,
  validationResponse,
} from '@/lib/data-master/routeHelpers';
import { createStaff, getStaff } from '@/lib/data-master/staffService';
import { staffSchema } from '@/lib/validations/dataMaster';

export async function GET() {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  try {
    return NextResponse.json({ data: await getStaff() });
  } catch (error) {
    return handleDataMasterError(error, 'Staff');
  }
}

export async function POST(request) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = staffSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const staff = await createStaff(parsed.data);
    return NextResponse.json({ data: staff }, { status: 201 });
  } catch (error) {
    return handleDataMasterError(error, 'Staff');
  }
}
