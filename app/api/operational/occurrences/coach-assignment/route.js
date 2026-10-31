import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  assignCoachToOccurrence,
  removeCoachAssignmentFromOccurrence,
} from '@/lib/operational/occurrenceService';
import {
  handleOperationalError,
  parseJsonBody,
  validationResponse,
} from '@/lib/operational/routeHelpers';
import {
  coachAssignmentSchema,
  removeCoachAssignmentSchema,
} from '@/lib/validations/operational';

export async function POST(request) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = coachAssignmentSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const occurrence = await assignCoachToOccurrence(parsed.data);
    return NextResponse.json({ data: occurrence });
  } catch (error) {
    return handleOperationalError(error, 'Penugasan pelatih');
  }
}

export async function DELETE(request) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = removeCoachAssignmentSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const occurrence = await removeCoachAssignmentFromOccurrence(parsed.data);
    return NextResponse.json({ data: occurrence });
  } catch (error) {
    return handleOperationalError(error, 'Penugasan pelatih');
  }
}
