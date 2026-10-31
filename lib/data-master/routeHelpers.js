import { NextResponse } from 'next/server';

export class DataMasterError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'DataMasterError';
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

  for (const issue of error.issues) {
    const field = issue.path[0];

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

function getUniqueTarget(error) {
  const target = error?.meta?.target;

  if (Array.isArray(target)) return target.join(', ');
  if (typeof target === 'string') return target;
  return '';
}

export function handleDataMasterError(error, entityLabel = 'Data') {
  if (error instanceof DataMasterError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
      },
      { status: error.status }
    );
  }

  if (error?.code === 'P2002') {
    const target = getUniqueTarget(error).toLowerCase();
    let fieldLabel = 'data unik';

    if (target.includes('username')) fieldLabel = 'username';
    else if (target.includes('email')) fieldLabel = 'email';
    else if (target.includes('user')) fieldLabel = 'akun user';

    return NextResponse.json(
      {
        code: 'DUPLICATE_DATA',
        message: `${entityLabel} dengan ${fieldLabel} tersebut sudah digunakan.`,
      },
      { status: 409 }
    );
  }

  if (error?.code === 'P2025') {
    return NextResponse.json(
      {
        code: 'NOT_FOUND',
        message: `${entityLabel} tidak ditemukan.`,
      },
      { status: 404 }
    );
  }

  console.error(`[Data Master: ${entityLabel}]`, error);

  return NextResponse.json(
    {
      code: 'INTERNAL_ERROR',
      message: `Terjadi gangguan saat memproses ${entityLabel.toLowerCase()}. Silakan coba lagi.`,
    },
    { status: 500 }
  );
}
