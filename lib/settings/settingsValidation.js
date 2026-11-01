import { z } from 'zod';

const optionalText = (max) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => String(value ?? '').trim())
    .refine((value) => value.length <= max, `Maksimal ${max} karakter`);

const optionalEmail = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => String(value ?? '').trim().toLowerCase())
  .refine(
    (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'Format email tidak valid'
  );

const optionalUrl = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => String(value ?? '').trim())
  .refine((value) => {
    if (value === '') return true;

    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) && value.length <= 500;
    } catch {
      return false;
    }
  }, 'Format URL website tidak valid');

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam harus HH:mm');

const percentageSchema = z.coerce
  .number({ error: 'Persentase harus berupa angka' })
  .min(0, 'Persentase minimal 0%')
  .max(100, 'Persentase maksimal 100%');

export const operatingHourSchema = z
  .object({
    day: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']),
    isOpen: z.boolean(),
    openTime: timeSchema,
    closeTime: timeSchema,
  })
  .superRefine((value, context) => {
    if (value.isOpen && value.closeTime <= value.openTime) {
      context.addIssue({
        code: 'custom',
        path: ['closeTime'],
        message: 'Jam tutup harus lebih akhir daripada jam buka',
      });
    }
  });

export const generalSettingsSchema = z.object({
  businessName: z
    .string({ error: 'Nama bisnis wajib diisi' })
    .trim()
    .min(3, 'Nama bisnis minimal 3 karakter')
    .max(120, 'Nama bisnis maksimal 120 karakter'),
  legalName: optionalText(160),
  tagline: optionalText(220),
  email: optionalEmail,
  phone: optionalText(30),
  website: optionalUrl,
  address: optionalText(500),
  timezone: z.enum(['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura']),
  logoDataUrl: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => String(value ?? '').trim())
    .refine(
      (value) =>
        value === '' ||
        (value.startsWith('data:image/') && value.length <= 2_800_000),
      'Logo harus berupa data URL gambar maksimal sekitar 2 MB'
    ),
  logoFileName: optionalText(180),
  operatingHours: z
    .array(operatingHourSchema)
    .length(7, 'Jam operasional harus berisi tujuh hari')
    .superRefine((days, context) => {
      if (new Set(days.map((item) => item.day)).size !== 7) {
        context.addIssue({
          code: 'custom',
          message: 'Setiap hari operasional hanya boleh muncul satu kali',
        });
      }
    }),
});

export const financialSettingsSchema = z.object({
  taxEnabled: z.boolean(),
  taxName: z.string().trim().min(1).max(40),
  taxPercentage: percentageSchema,
  pricesIncludeTax: z.boolean(),
  lateFeeEnabled: z.boolean(),
  lateFeeType: z.enum(['percentage', 'fixed_amount', 'both']),
  lateFeePercentage: percentageSchema,
  lateFeePeriod: z.enum(['day', 'month']),
  lateFeeFixedAmount: z.coerce
    .number({ error: 'Denda tetap harus berupa angka' })
    .int('Denda tetap harus bilangan bulat Rupiah')
    .min(0)
    .max(100_000_000),
  lateFeeGraceDays: z.coerce.number().int().min(0).max(30),
  lateFeeCapPercentage: percentageSchema,
  refundEnabled: z.boolean(),
  refundOver7DaysPercentage: percentageSchema,
  refund3To7DaysPercentage: percentageSchema,
  refundUnder3DaysPercentage: percentageSchema,
  refundAdminFeePercentage: percentageSchema,
  refundProcessingDays: z.coerce.number().int().min(1).max(60),
  refundPolicyNotes: optionalText(1_000),
});

export const notificationTemplateSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[A-Za-z0-9_-]+$/, 'ID template tidak valid'),
    name: z.string().trim().min(3).max(120),
    channel: z.enum(['whatsapp', 'email']),
    eventKey: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .transform((value) => value.toUpperCase().replace(/\s+/g, '_')),
    subject: optionalText(500),
    message: z.string().trim().min(10).max(20_000),
    isActive: z.boolean(),
  })
  .superRefine((template, context) => {
    if (template.channel === 'email' && template.subject.trim().length < 3) {
      context.addIssue({
        code: 'custom',
        path: ['subject'],
        message: 'Subject wajib diisi untuk template email',
      });
    }
  });

export const systemSettingsSchema = z.object({
  version: z.coerce.number().int().min(1).optional(),
  general: generalSettingsSchema,
  financial: financialSettingsSchema,
  notifications: z.object({
    senderName: z.string().trim().min(2).max(120),
    whatsappNumber: optionalText(30),
    emailFrom: optionalEmail,
    templates: z
      .array(notificationTemplateSchema)
      .min(1, 'Minimal satu template notifikasi')
      .max(50, 'Maksimal 50 template notifikasi')
      .superRefine((templates, context) => {
        if (new Set(templates.map((template) => template.id)).size !== templates.length) {
          context.addIssue({
            code: 'custom',
            message: 'ID template tidak boleh duplikat',
          });
        }
      }),
  }),
});
