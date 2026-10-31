'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { loginRequest } from '@/lib/auth/authClient';
import { getSafeRedirectPath } from '@/lib/auth/redirect';
import { loginSchema } from '@/lib/validations/auth';

/**
 * Semua fungsi form login berada di hook ini:
 * state, validasi, submit API, mapping error, toast, dan redirect.
 * Komponen LoginForm hanya bertugas menampilkan UI.
 */
export default function useLoginForm({ nextPath = '/dashboard' } = {}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const safeNextPath = getSafeRedirectPath(nextPath);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
    mode: 'onBlur',
  });

  async function handleLogin(values) {
    setServerError('');

    const result = await loginRequest(values);

    if (!result.ok) {
      const message =
        result.message ?? 'Login gagal. Periksa kembali data Anda.';

      if (result.fieldErrors?.username?.[0]) {
        setError('username', {
          type: 'server',
          message: result.fieldErrors.username[0],
        });
      }

      if (result.fieldErrors?.password?.[0]) {
        setError('password', {
          type: 'server',
          message: result.fieldErrors.password[0],
        });
      }

      if (result.code === 'USER_NOT_FOUND') {
        setError(
          'username',
          {
            type: 'server',
            message: 'Username tidak ditemukan',
          },
          { shouldFocus: true }
        );
      } else if (
        result.code === 'INVALID_PASSWORD' ||
        result.code === 'WRONG_PASSWORD' ||
        result.status === 401
      ) {
        setError(
          'password',
          {
            type: 'server',
            message: 'Password salah',
          },
          { shouldFocus: true }
        );
      }

      setServerError(message);
      toast.error(message);
      return;
    }

    toast.success(`Selamat datang, ${result.user?.name ?? values.username}!`);

    // replace() mencegah tombol Back kembali ke form login setelah berhasil.
    // refresh() memastikan Server Component membaca cookie session terbaru.
    router.replace(safeNextPath);
    router.refresh();
  }

  return {
    register,
    errors,
    isSubmitting,
    serverError,
    showPassword,
    onTogglePassword: () => setShowPassword((current) => !current),
    onSubmit: handleSubmit(handleLogin),
  };
}
