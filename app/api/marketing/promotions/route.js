import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleApiError,
  parseJsonBody,
  validationResponse,
} from '@/lib/api/routeHelpers';
import {
  createPromotion,
  getPromotions,
} from '@/lib/marketing/promotionService';
import { promotionSchema } from '@/lib/marketing/marketingValidation';

const MARKETING_ROLES = ['SUPERADMIN', 'OWNER'];

export async function GET() {
  const { user, response } = await requireApiUser(MARKETING_ROLES);
  if (response) return response;

  try {
    return NextResponse.json({ data: await getPromotions(user) });
  } catch (error) {
    return handleApiError(error, 'Campaign');
  }
}

export async function POST(request) {
  const { user, response } = await requireApiUser(MARKETING_ROLES);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = promotionSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const promotion = await createPromotion(parsed.data, user);
    revalidateTag('promotions', 'max');
    revalidateTag('public-landing', 'max');
    return NextResponse.json({ data: promotion }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Campaign');
  }
}
