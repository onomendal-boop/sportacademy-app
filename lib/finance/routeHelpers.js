import { NextResponse } from 'next/server';
import { getFinanceFieldErrors } from '@/lib/validations/finance';

export class FinanceError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'FinanceError';
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

export function validationResponse(error) {
  const fieldErrors = {};

  for (const [field, message] of Object.entries(
    getFinanceFieldErrors(error)
  )) {
    fieldErrors[field] = [message];
  }

  return NextResponse.json(
    {
      code: 'VALIDATION_ERROR',
      message: 'Data keuangan belum memenuhi ketentuan.',
      fieldErrors,
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

export function handleFinanceError(error, context = 'Data keuangan') {
  if (error instanceof FinanceError) {
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
    const isInvoice = target.includes('invoice');

    return NextResponse.json(
      {
        code: isInvoice ? 'DUPLICATE_INVOICE' : 'DUPLICATE_DATA',
        message: isInvoice
          ? 'Nomor invoice bentrok. Silakan simpan ulang transaksi.'
          : `${context} menghasilkan data unik yang sudah digunakan.`,
      },
      { status: 409 }
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
        message: 'Siswa, paket, langganan, atau tempat latihan terkait tidak ditemukan.',
      },
      { status: 400 }
    );
  }

  console.error(`[Finance: ${context}]`, error);

  return NextResponse.json(
    {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi gangguan saat memproses data keuangan. Silakan coba lagi.',
    },
    { status: 500 }
  );
}
