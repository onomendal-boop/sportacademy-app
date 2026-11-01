import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleFinanceError,
  parseJsonBody,
  validationResponse,
} from '@/lib/finance/routeHelpers';
import {
  deleteTransaction,
  updateTransaction,
} from '@/lib/finance/transactionService';
import { transactionUpdateSchema } from '@/lib/validations/finance';

export async function PATCH(request, { params }) {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { id } = await params;
  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = transactionUpdateSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const result = await updateTransaction(id, parsed.data, user);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleFinanceError(error, 'Transaksi');
  }
}

export async function DELETE(_request, { params }) {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { id } = await params;

  try {
    return NextResponse.json(await deleteTransaction(id, user));
  } catch (error) {
    return handleFinanceError(error, 'Transaksi');
  }
}
