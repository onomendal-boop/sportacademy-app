import { z } from 'zod';

export function getAuthFieldErrors(error) {
  const fieldErrors = {};

  for (const issue of error?.issues ?? []) {
    const key = issue.path?.[0] ?? 'form';
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }

  return fieldErrors;
}

// Schema dipakai bersama oleh form client dan API server.
export const loginSchema = z.object({
  username: z
    .string({ error: 'Username wajib diisi' })
    .trim()
    .min(3, 'Username minimal 3 karakter')
    .transform((value) => value.toLowerCase()),
  password: z
    .string({ error: 'Password wajib diisi' })
    .min(6, 'Password minimal 6 karakter'),
});

const optionalPhone = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) return null;
    const cleaned = value.replace(/[\s-]/g, '');
    return cleaned === '' ? null : cleaned;
  })
  .refine(
    (value) => value === null || /^(?:\+62|62|0)8\d{7,13}$/.test(value),
    'Masukkan nomor WhatsApp Indonesia yang valid, contoh 081234567890'
  );

// Settings Profil: semua role boleh mengubah data akunnya sendiri.
export const profileUpdateSchema = z.object({
  name: z
    .string({ error: 'Nama wajib diisi' })
    .trim()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z
    .string({ error: 'Email wajib diisi' })
    .trim()
    .toLowerCase()
    .email('Format email tidak valid')
    .max(160, 'Email maksimal 160 karakter'),
  phone: optionalPhone,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: 'Password saat ini wajib diisi' })
      .min(1, 'Password saat ini wajib diisi'),
    newPassword: z
      .string({ error: 'Password baru wajib diisi' })
      .min(8, 'Password baru minimal 8 karakter')
      .max(72, 'Password baru maksimal 72 karakter'),
    confirmPassword: z
      .string({ error: 'Konfirmasi password wajib diisi' })
      .min(1, 'Konfirmasi password wajib diisi'),
  })
  .superRefine((data, context) => {
    if (data.newPassword !== data.confirmPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Konfirmasi password tidak sama dengan password baru',
      });
    }

    if (data.newPassword === data.currentPassword) {
      context.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'Password baru harus berbeda dari password saat ini',
      });
    }
  });
