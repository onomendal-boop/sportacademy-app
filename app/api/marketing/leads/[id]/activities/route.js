import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleApiError,
  parseJsonBody,
  validationResponse,
} from '@/lib/api/routeHelpers';
import { addLeadActivity } from '@/lib/marketing/leadService';
import { leadActivitySchema } from '@/lib/marketing/marketingValidation';

const MARKETING_ROLES = ['SUPERADMIN', 'OWNER'];

export async function POST(request, { params }) {
  const { user, response } = await requireApiUser(MARKETING_ROLES);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = leadActivitySchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const { id } = await params;
    return NextResponse.json({
      data: await addLeadActivity(id, parsed.data.note, user),
    });
  } catch (error) {
    return handleApiError(error, 'Aktivitas lead');
  }
}
