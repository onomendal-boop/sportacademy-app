import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  createPackage,
  getPackages,
} from '@/lib/finance/packageService';
import {
  handleFinanceError,
  parseJsonBody,
  validationResponse,
} from '@/lib/finance/routeHelpers';
import { packageSchema } from '@/lib/validations/finance';

export async function GET() {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  try {
    return NextResponse.json({ data: await getPackages() });
  } catch (error) {
    return handleFinanceError(error, 'Paket');
  }
}

export async function POST(request) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = packageSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const pkg = await createPackage(parsed.data);
    return NextResponse.json({ data: pkg }, { status: 201 });
  } catch (error) {
    return handleFinanceError(error, 'Paket');
  }
}
