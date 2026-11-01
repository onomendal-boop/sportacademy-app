import { NextResponse } from 'next/server';
import {
  handleApiError,
  parseJsonBody,
  validationResponse,
} from '@/lib/api/routeHelpers';
import { createPublicLead } from '@/lib/marketing/leadService';
import { publicLeadCreateSchema } from '@/lib/marketing/marketingValidation';

export async function POST(request) {
  const { body, response } = await parseJsonBody(request);
  if (response) return response;

  const parsed = publicLeadCreateSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const result = await createPublicLead(parsed.data);

    // Jangan mengembalikan detail lead/PII ke endpoint publik. Frontend
    // hanya membutuhkan konfirmasi bahwa submisi diterima.
    return NextResponse.json(
      { data: { accepted: result.accepted } },
      { status: result.duplicate ? 200 : 201 }
    );
  } catch (error) {
    return handleApiError(error, 'Pendaftaran lead');
  }
}
