import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleApiError,
  parseJsonBody,
  validationResponse,
} from '@/lib/api/routeHelpers';
import { createPromotionBatch } from '@/lib/marketing/promotionService';
import { promotionSchema } from '@/lib/marketing/marketingValidation';

const batchSchema = z.object({
  items: z.array(promotionSchema).min(1).max(50),
});

export async function POST(request) {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const promotions = await createPromotionBatch(parsed.data.items, user);
    revalidateTag('promotions', 'max');
    revalidateTag('public-landing', 'max');
    return NextResponse.json({ data: promotions }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Batch voucher');
  }
}
