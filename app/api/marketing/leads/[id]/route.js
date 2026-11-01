import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleApiError,
  parseJsonBody,
  validationResponse,
} from '@/lib/api/routeHelpers';
import { updateLead } from '@/lib/marketing/leadService';
import { leadUpdateSchema } from '@/lib/marketing/marketingValidation';

const MARKETING_ROLES = ['SUPERADMIN', 'OWNER'];

export async function PATCH(request, { params }) {
  const { user, response } = await requireApiUser(MARKETING_ROLES);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = leadUpdateSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const { id } = await params;
    return NextResponse.json({ data: await updateLead(id, parsed.data, user) });
  } catch (error) {
    return handleApiError(error, 'Lead');
  }
}
