import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  deletePackage,
  updatePackage,
} from '@/lib/finance/packageService';
import {
  handleFinanceError,
  parseJsonBody,
  validationResponse,
} from '@/lib/finance/routeHelpers';
import { packageSchema } from '@/lib/validations/finance';

export async function PATCH(request, { params }) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { id } = await params;
  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = packageSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const pkg = await updatePackage(id, parsed.data);
    return NextResponse.json({ data: pkg });
  } catch (error) {
    return handleFinanceError(error, 'Paket');
  }
}

export async function DELETE(_request, { params }) {
  const { response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { id } = await params;

  try {
    return NextResponse.json(await deletePackage(id));
  } catch (error) {
    return handleFinanceError(error, 'Paket');
  }
}
