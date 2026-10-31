import { NextResponse } from 'next/server';
import { getOperationalFieldErrors } from '@/lib/validations/operational';

export class OperationalError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'OperationalError';
    this.status = status;
    this.code = code;
  }
}

export async function parseJsonBody(request) {
  try {
    return { body: await request.json(), response: null };
  } catch {
    return {
      body: null,
      response: NextResponse.json(
        {
          code: 'INVALID_JSON',
          message: 'Format JSON yang dikirim tidak valid.',
        },
        { status: 400 }
      ),
    };
  }
}

export function validationResponse(
  error,
  message = 'Data jadwal belum memenuhi ketentuan.'
) {
  const fieldErrors = {};

  for (const [field, messageText] of Object.entries(
    getOperationalFieldErrors(error)
  )) {
    fieldErrors[field] = [messageText];
  }

  return NextResponse.json(
    {
      code: 'VALIDATION_ERROR',
      message,
      fieldErrors,
    },
    { status: 400 }
  );
}

export function handleOperationalError(error, context = 'Jadwal') {
  if (error instanceof OperationalError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
      },
      { status: error.status }
    );
  }

  if (error?.code === 'P2025') {
    return NextResponse.json(
      {
        code: 'NOT_FOUND',
        message: `${context} tidak ditemukan.`,
      },
      { status: 404 }
    );
  }

  if (error?.code === 'P2003') {
    return NextResponse.json(
      {
        code: 'INVALID_REFERENCE',
        message: 'Data terkait jadwal tidak ditemukan atau sudah berubah.',
      },
      { status: 400 }
    );
  }

  console.error(`[Operasional: ${context}]`, error);

  return NextResponse.json(
    {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi gangguan saat memproses operasional. Silakan coba lagi.',
    },
    { status: 500 }
  );
}
