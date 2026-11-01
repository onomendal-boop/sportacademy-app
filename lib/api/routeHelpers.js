import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
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

export function getZodFieldErrors(error) {
  const fieldErrors = {};

  for (const issue of error?.issues ?? []) {
    const field = issue.path?.[0];

    if (typeof field === 'string') {
      fieldErrors[field] ??= [];
      fieldErrors[field].push(issue.message);
    }
  }

  return fieldErrors;
}

export function validationResponse(error) {
  return NextResponse.json(
    {
      code: 'VALIDATION_ERROR',
      message: 'Data yang dikirim belum memenuhi ketentuan.',
      fieldErrors: getZodFieldErrors(error),
    },
    { status: 400 }
  );
}

export function handleApiError(error, contextLabel = 'Data') {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.status }
    );
  }

  if (error?.code === 'P2002') {
    return NextResponse.json(
      {
        code: 'DUPLICATE_DATA',
        message: `${contextLabel} dengan data unik tersebut sudah digunakan.`,
      },
      { status: 409 }
    );
  }

  if (error?.code === 'P2025') {
    return NextResponse.json(
      {
        code: 'NOT_FOUND',
        message: `${contextLabel} tidak ditemukan.`,
      },
      { status: 404 }
    );
  }

  console.error(`[API: ${contextLabel}]`, error);

  return NextResponse.json(
    {
      code: 'INTERNAL_ERROR',
      message: `Terjadi gangguan saat memproses ${contextLabel.toLowerCase()}. Silakan coba lagi.`,
    },
    { status: 500 }
  );
}
