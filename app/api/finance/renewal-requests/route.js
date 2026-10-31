import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import { createStudentRenewalRequest } from '@/lib/finance/renewalService';
import {
  handleFinanceError,
  parseJsonBody,
  validationResponse,
} from '@/lib/finance/routeHelpers';
import { renewalRequestSchema } from '@/lib/validations/finance';

// Pengajuan perpanjangan paket khusus akun STUDENT untuk dirinya sendiri.
export async function POST(request) {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'STUDENT']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = renewalRequestSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const result = await createStudentRenewalRequest(user, parsed.data);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleFinanceError(error, 'Perpanjangan paket');
  }
}
