import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth/authService';
import { setSessionCookie } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validations/auth';

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        code: 'INVALID_JSON',
        message: 'Format data login tidak valid.',
      },
      { status: 400 }
    );
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (typeof field === 'string') {
        fieldErrors[field] ??= [];
        fieldErrors[field].push(issue.message);
      }
    }

    return NextResponse.json(
      {
        code: 'VALIDATION_ERROR',
        message: 'Username atau password belum memenuhi ketentuan.',
        fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const result = await authenticateUser(parsed.data);

    if (!result.ok) {
      return NextResponse.json(
        {
          code: result.code,
          message: result.message,
        },
        { status: result.status }
      );
    }

    await setSessionCookie(result.user);

    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error('[POST /api/auth/login]', error);

    return NextResponse.json(
      {
        code: 'LOGIN_FAILED',
        message: 'Login gagal karena gangguan server. Silakan coba lagi.',
      },
      { status: 500 }
    );
  }
}
