import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleDataMasterError,
  parseJsonBody,
  validationResponse,
} from '@/lib/data-master/routeHelpers';
import {
  deleteTrainingVenue,
  updateTrainingVenue,
} from '@/lib/data-master/trainingVenueService';
import { trainingVenueSchema } from '@/lib/validations/dataMaster';

export async function PATCH(request, { params }) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { id } = await params;
  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = trainingVenueSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const venue = await updateTrainingVenue(id, parsed.data);
    return NextResponse.json({ data: venue });
  } catch (error) {
    return handleDataMasterError(error, 'Tempat latihan');
  }
}

export async function DELETE(_request, { params }) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { id } = await params;

  try {
    return NextResponse.json(await deleteTrainingVenue(id));
  } catch (error) {
    return handleDataMasterError(error, 'Tempat latihan');
  }
}
