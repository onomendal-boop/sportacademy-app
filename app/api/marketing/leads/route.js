import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleApiError,
  parseJsonBody,
  validationResponse,
} from '@/lib/api/routeHelpers';
import { createLead, getLeads } from '@/lib/marketing/leadService';
import { leadCreateSchema } from '@/lib/marketing/marketingValidation';

const MARKETING_ROLES = ['SUPERADMIN', 'OWNER'];

export async function GET() {
  const { user, response } = await requireApiUser(MARKETING_ROLES);
  if (response) return response;

  try {
    return NextResponse.json({ data: await getLeads(user) });
  } catch (error) {
    return handleApiError(error, 'Lead');
  }
}

export async function POST(request) {
  const { user, response } = await requireApiUser(MARKETING_ROLES);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = leadCreateSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const lead = await createLead(parsed.data, user);
    return NextResponse.json({ data: lead }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Lead');
  }
}
