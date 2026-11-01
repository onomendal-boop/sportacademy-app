import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import { createCoach, getCoaches } from '@/lib/data-master/coachService';
import {
  handleDataMasterError,
  parseJsonBody,
  validationResponse,
} from '@/lib/data-master/routeHelpers';
import { coachCreateSchema } from '@/lib/validations/dataMaster';

export async function GET() {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  try {
    return NextResponse.json({ data: await getCoaches() });
  } catch (error) {
    return handleDataMasterError(error, 'Pelatih');
  }
}

export async function POST(request) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = coachCreateSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const coach = await createCoach(parsed.data);
    return NextResponse.json({ data: coach }, { status: 201 });
  } catch (error) {
    return handleDataMasterError(error, 'Pelatih');
  }
}
