import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleFinanceError,
  parseJsonBody,
  validationResponse,
} from '@/lib/finance/routeHelpers';
import {
  createSubscription,
  getSubscriptions,
} from '@/lib/finance/subscriptionService';
import { subscriptionSchema } from '@/lib/validations/finance';

export async function GET() {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  try {
    return NextResponse.json({ data: await getSubscriptions(user) });
  } catch (error) {
    return handleFinanceError(error, 'Langganan');
  }
}

export async function POST(request) {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const subscription = await createSubscription(parsed.data, user);
    return NextResponse.json({ data: subscription }, { status: 201 });
  } catch (error) {
    return handleFinanceError(error, 'Langganan');
  }
}
