import { NextResponse } from 'next/server';
import { getCurrentUser } from './authService';

/**
 * Guard khusus API Route. Berbeda dengan guard halaman, fungsi ini tidak
 * me-redirect, melainkan mengembalikan response JSON 401/403.
 */
export async function requireApiUser(allowedRoles = []) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          code: 'UNAUTHENTICATED',
          message: 'Anda harus login untuk mengakses data ini.',
        },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      response: NextResponse.json(
        {
          code: 'FORBIDDEN',
          message: 'Akun Anda tidak memiliki izin untuk mengakses fitur ini.',
        },
        { status: 403 }
      ),
    };
  }

  return { user, response: null };
}
