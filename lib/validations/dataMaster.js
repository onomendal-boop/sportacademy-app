import { z } from 'zod';
import {
  COACH_SPECIALIZATIONS,
  STAFF_STATUS_VALUES,
  STUDENT_LEVEL_VALUES,
  STUDENT_STATUS_VALUES,
  TRAINING_VENUE_STATUS_VALUES,
} from '@/lib/data-master/constants';

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value ? value : null));

const optionalEmail = z
  .string()
  .trim()
  .max(160)
  .nullable()
  .optional()
  .transform((value) => (value ? value.toLowerCase() : null))
  .refine(
    (value) => value === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'Format email tidak valid'
  );

const requiredEmail = z
  .string({ error: 'Email wajib diisi' })
  .trim()
  .min(1, 'Email wajib diisi')
  .max(160)
  .transform((value) => value.toLowerCase())
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Format email tidak valid');

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .optional()
  .transform((value) => (value ? value : null))
  .refine(
    (value) => value === null || /^https?:\/\//i.test(value),
    'URL gambar harus diawali http:// atau https://'
  );

const optionalDateString = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => (value ? value : null))
  .refine(
    (value) =>
      value === null ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))),
    'Tanggal tidak valid'
  );

export const staffSchema = z.object({
  name: z
    .string({ error: 'Nama staff wajib diisi' })
    .trim()
    .min(3, 'Nama staff minimal 3 karakter')
    .max(100, 'Nama staff maksimal 100 karakter'),
  position: z
    .string({ error: 'Posisi wajib dipilih' })
    .trim()
    .min(2, 'Posisi wajib dipilih')
    .max(80),
  department: optionalText(80),
  email: optionalEmail,
  phone: z
    .string({ error: 'Nomor telepon wajib diisi' })
    .trim()
    .min(8, 'Nomor telepon minimal 8 karakter')
    .max(30)
    .regex(/^[+\d][\d\s-]*$/, 'Nomor telepon hanya boleh berisi angka, spasi, tanda -, atau awalan +'),
  profileImage: optionalUrl,
  status: z.enum(STAFF_STATUS_VALUES).default('ACTIVE'),
  joinedAt: optionalDateString,
});

const coachBaseSchema = {
  name: z
    .string({ error: 'Nama pelatih wajib diisi' })
    .trim()
    .min(3, 'Nama pelatih minimal 3 karakter')
    .max(100),
  username: z
    .string({ error: 'Username wajib diisi' })
    .trim()
    .min(3, 'Username minimal 3 karakter')
    .max(50)
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'Username hanya boleh berisi huruf, angka, titik, strip, atau underscore'
    )
    .transform((value) => value.toLowerCase()),
  email: requiredEmail,
  specialization: z.enum(COACH_SPECIALIZATIONS, {
    error: 'Spesialisasi wajib dipilih',
  }),
  profileImage: optionalUrl,
  isActive: z.boolean().default(true),
};

export const coachCreateSchema = z.object({
  ...coachBaseSchema,
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .max(72, 'Password maksimal 72 karakter')
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : undefined)),
});

export const coachUpdateSchema = z.object({
  ...coachBaseSchema,
  password: z
    .string()
    .min(6, 'Password baru minimal 6 karakter')
    .max(72, 'Password baru maksimal 72 karakter')
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : undefined)),
});

export const trainingVenueSchema = z.object({
  name: z
    .string({ error: 'Nama tempat latihan wajib diisi' })
    .trim()
    .min(3, 'Nama tempat latihan minimal 3 karakter')
    .max(120),
  location: z
    .string({ error: 'Lokasi wajib diisi' })
    .trim()
    .min(2, 'Lokasi wajib diisi')
    .max(160),
  depth: z.coerce
    .number({ error: 'Kedalaman harus berupa angka' })
    .positive('Kedalaman harus lebih dari 0 meter')
    .max(20, 'Kedalaman maksimal 20 meter'),
  capacity: z.coerce
    .number({ error: 'Kapasitas harus berupa angka' })
    .int('Kapasitas harus berupa bilangan bulat')
    .positive('Kapasitas harus lebih dari 0')
    .max(1000, 'Kapasitas maksimal 1000'),
  status: z.enum(TRAINING_VENUE_STATUS_VALUES).default('ACTIVE'),
  imageUrl: optionalUrl,
});

export const studentSchema = z
  .object({
    name: z
      .string({ error: 'Nama siswa wajib diisi' })
      .trim()
      .min(3, 'Nama siswa minimal 3 karakter')
      .max(100, 'Nama siswa maksimal 100 karakter'),
    dateOfBirth: optionalDateString,
    age: z.coerce
      .number({ error: 'Usia wajib diisi berupa angka' })
      .int('Usia harus berupa bilangan bulat')
      .min(3, 'Usia siswa minimal 3 tahun')
      .max(18, 'Usia siswa maksimal 18 tahun'),
    parentContact: z
      .string({ error: 'Kontak ortu/wali wajib diisi' })
      .trim()
      .min(9, 'Kontak ortu/wali minimal 9 karakter')
      .max(30, 'Kontak ortu/wali maksimal 30 karakter')
      .transform((value) => value.replace(/[\s-]/g, ''))
      .refine(
        (value) => /^(?:\+62|62|0)8\d{7,13}$/.test(value),
        'Masukkan nomor WhatsApp Indonesia yang valid, contoh 081234567890'
      ),
    healthHistory: optionalText(500),
    level: z.enum(STUDENT_LEVEL_VALUES, {
      error: 'Level awal wajib dipilih',
    }),
    status: z.enum(STUDENT_STATUS_VALUES).default('PENDING'),
  })
  .superRefine((data, context) => {
    if (data.dateOfBirth) {
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      if (data.dateOfBirth > todayKey) {
        context.addIssue({
          code: 'custom',
          path: ['dateOfBirth'],
          message: 'Tanggal lahir tidak boleh di masa depan',
        });
      }
    }
  });

export function getValidationFieldErrors(error) {
  const fieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === 'string' && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}
