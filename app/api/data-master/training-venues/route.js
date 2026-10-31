import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleDataMasterError,
  parseJsonBody,
  validationResponse,
} from '@/lib/data-master/routeHelpers';
import {
  createTrainingVenue,
  getTrainingVenues,
} from '@/lib/data-master/trainingVenueService';
import { trainingVenueSchema } from '@/lib/validations/dataMaster';

export async function GET() {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  try {
    return NextResponse.json({ data: await getTrainingVenues() });
  } catch (error) {
    return handleDataMasterError(error, 'Tempat latihan');
  }
}

export async function POST(request) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = trainingVenueSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const venue = await createTrainingVenue(parsed.data);
    return NextResponse.json({ data: venue }, { status: 201 });
  } catch (error) {
    return handleDataMasterError(error, 'Tempat latihan');
  }
}
