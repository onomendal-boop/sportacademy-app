import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleFinanceError,
  parseJsonBody,
  validationResponse,
} from '@/lib/finance/routeHelpers';
import {
  createTransaction,
  getTransactions,
} from '@/lib/finance/transactionService';
import { transactionCreateSchema } from '@/lib/validations/finance';

export async function GET() {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  try {
    return NextResponse.json({ data: await getTransactions(user) });
  } catch (error) {
    return handleFinanceError(error, 'Transaksi');
  }
}

export async function POST(request) {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = transactionCreateSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const result = await createTransaction(parsed.data, user);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleFinanceError(error, 'Transaksi');
  }
}
