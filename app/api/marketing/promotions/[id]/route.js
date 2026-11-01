import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleApiError,
  parseJsonBody,
  validationResponse,
} from '@/lib/api/routeHelpers';
import {
  deletePromotion,
  updatePromotion,
} from '@/lib/marketing/promotionService';
import { promotionSchema } from '@/lib/marketing/marketingValidation';

const MARKETING_ROLES = ['SUPERADMIN', 'OWNER'];

export async function PATCH(request, { params }) {
  const { user, response } = await requireApiUser(MARKETING_ROLES);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = promotionSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const { id } = await params;
    const promotion = await updatePromotion(id, parsed.data, user);
    revalidateTag('promotions', 'max');
    revalidateTag('public-landing', 'max');
    return NextResponse.json({ data: promotion });
  } catch (error) {
    return handleApiError(error, 'Campaign');
  }
}

export async function DELETE(_request, { params }) {
  const { user, response } = await requireApiUser(MARKETING_ROLES);
  if (response) return response;

  try {
    const { id } = await params;
    const result = await deletePromotion(id, user);
    revalidateTag('promotions', 'max');
    revalidateTag('public-landing', 'max');
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error, 'Campaign');
  }
}
