import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { canAccessFeature } from './permissions';
import { buildLoginPath } from './redirect';
import { getSession } from './session';

const safeUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  phone: true,
  profileImage: true,
  role: true,
  specialization: true,
  isActive: true,
};

export function toSafeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone ?? null,
    profileImage: user.profileImage ?? null,
    role: user.role,
    specialization: user.specialization ?? null,
  };
}

/**
 * Fungsi server untuk memverifikasi username dan password ke database MySQL.
 * Email tidak digunakan sebagai kredensial login.
 */
export async function authenticateUser({ username, password }) {
  const normalizedUsername = username.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username: normalizedUsername },
    select: {
      ...safeUserSelect,
      password: true,
    },
  });

  if (!user) {
    return {
      ok: false,
      status: 404,
      code: 'USER_NOT_FOUND',
      message: 'Username tidak ditemukan. Periksa kembali username Anda.',
    };
  }

  if (!user.isActive) {
    return {
      ok: false,
      status: 403,
      code: 'ACCOUNT_DISABLED',
      message: 'Akun Anda nonaktif. Silakan hubungi admin.',
    };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return {
      ok: false,
      status: 401,
      code: 'INVALID_PASSWORD',
      message: 'Password salah. Silakan coba lagi.',
    };
  }

  return {
    ok: true,
    user: toSafeUser(user),
  };
}

/**
 * Ambil user dari token cookie, lalu verifikasi kembali ke database.
 * Dengan cara ini akun yang sudah dihapus/nonaktif tidak tetap lolos.
 */
export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: safeUserSelect,
  });

  if (!user || !user.isActive) return null;

  return toSafeUser(user);
}

/**
 * Guard untuk Server Component/layout. User yang belum login selalu
 * diarahkan ke /login, termasuk ketika mengetik URL dashboard langsung.
 */
export async function requireCurrentUser(nextPath = '/dashboard') {
  const user = await getCurrentUser();

  if (!user) {
    redirect(buildLoginPath(nextPath));
  }

  return user;
}

/**
 * Guard halaman per fitur berdasarkan matriks role di permissions.js.
 * Menu sidebar sudah disembunyikan untuk role yang tidak berhak; guard
 * ini adalah lapisan kedua agar URL yang diketik langsung pun ditolak.
 * Role yang tidak berhak diarahkan ke Ringkasan dashboard.
 */
export async function requireFeatureAccess(feature, nextPath = '/dashboard') {
  const user = await requireCurrentUser(nextPath);

  if (!canAccessFeature(user.role, feature)) {
    redirect('/dashboard');
  }

  return user;
}
