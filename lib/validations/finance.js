import { z } from 'zod';
import {
  PAYMENT_METHOD_VALUES,
  SUBSCRIPTION_STATUS_VALUES,
  TRANSACTION_STATUS_VALUES,
  TRANSACTION_TYPE_VALUES,
} from '@/lib/finance/constants';
import { PROGRAM_VALUES } from '@/lib/operational/constants';

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value ? value : null));

function isRealDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

const dateKeySchema = (label) =>
  z
    .string({ error: `${label} wajib diisi` })
    .trim()
    .min(1, `${label} wajib diisi`)
    .refine(isRealDateKey, `${label} tidak valid`);

const optionalDateKeySchema = (label) =>
  z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((value) => (value ? value : null))
    .refine(
      (value) => value === null || isRealDateKey(value),
      `${label} tidak valid`
    );

const moneySchema = z.coerce
  .number({ error: 'Nominal harus berupa angka' })
  .int('Nominal harus berupa Rupiah penuh tanpa desimal')
  .positive('Nominal harus lebih dari Rp0')
  .max(1_000_000_000, 'Nominal maksimal Rp1.000.000.000');

const positiveIntSchema = (label, max) =>
  z.coerce
    .number({ error: `${label} harus berupa angka` })
    .int(`${label} harus berupa bilangan bulat`)
    .min(1, `${label} minimal 1`)
    .max(max, `${label} maksimal ${max}`);

const optionalSessionCountSchema = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return Number(value);
  })
  .refine(
    (value) =>
      value === null ||
      (Number.isInteger(value) && value >= 1 && value <= 1000),
    'Jumlah sesi harus berupa bilangan bulat 1 sampai 1000'
  );

const optionalRemainingSessionCountSchema = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return Number(value);
  })
  .refine(
    (value) =>
      value === null ||
      (Number.isInteger(value) && value >= 0 && value <= 1000),
    'Sisa sesi harus berupa bilangan bulat 0 sampai 1000'
  );

const referenceRule = (data, context) => {
  if (
    data.status === 'PAID' &&
    data.paymentMethod !== 'CASH' &&
    !data.referenceNumber
  ) {
    context.addIssue({
      code: 'custom',
      path: ['referenceNumber'],
      message: 'Nomor referensi wajib diisi untuk pembayaran non-tunai yang lunas',
    });
  }
};

export const packageSchema = z.object({
  name: z
    .string({ error: 'Nama paket wajib diisi' })
    .trim()
    .min(3, 'Nama paket minimal 3 karakter')
    .max(120, 'Nama paket maksimal 120 karakter'),
  description: optionalText(1000),
  program: z.enum(PROGRAM_VALUES, { error: 'Program wajib dipilih' }),
  price: moneySchema,
  durationLabel: z
    .string({ error: 'Label durasi wajib diisi' })
    .trim()
    .min(2, 'Label durasi minimal 2 karakter')
    .max(80, 'Label durasi maksimal 80 karakter'),
  durationDays: positiveIntSchema('Durasi paket', 3650),
  totalSessions: optionalSessionCountSchema,
  defaultTrainingVenueId: optionalText(100),
  isActive: z.boolean().default(true),
});

export const transactionCreateSchema = z
  .object({
    studentId: z
      .string({ error: 'Siswa wajib dipilih' })
      .trim()
      .min(1, 'Siswa wajib dipilih'),
    packageId: optionalText(100),
    subscriptionId: optionalText(100),
    trainingVenueId: optionalText(100),
    type: z
      .enum(TRANSACTION_TYPE_VALUES, { error: 'Jenis transaksi wajib dipilih' })
      .default('SUBSCRIPTION_PAYMENT'),
    description: optionalText(160),
    amount: moneySchema,
    paymentMethod: z.enum(PAYMENT_METHOD_VALUES, {
      error: 'Metode pembayaran wajib dipilih',
    }),
    status: z.enum(TRANSACTION_STATUS_VALUES).default('PAID'),
    referenceNumber: optionalText(100),
    paymentDate: dateKeySchema('Tanggal transaksi'),
    startDate: optionalDateKeySchema('Tanggal mulai langganan'),
    autoRenew: z.boolean().default(false),
    notes: optionalText(1000),
  })
  .superRefine((data, context) => {
    referenceRule(data, context);

    if (
      ['SUBSCRIPTION_PAYMENT', 'PRIVATE_VOUCHER'].includes(data.type) &&
      !data.packageId &&
      !data.subscriptionId
    ) {
      context.addIssue({
        code: 'custom',
        path: ['packageId'],
        message: 'Paket wajib dipilih untuk pembayaran langganan/voucher',
      });
    }
  });

export const transactionUpdateSchema = z
  .object({
    description: z
      .string({ error: 'Keterangan transaksi wajib diisi' })
      .trim()
      .min(3, 'Keterangan transaksi minimal 3 karakter')
      .max(160, 'Keterangan transaksi maksimal 160 karakter'),
    amount: moneySchema,
    paymentMethod: z.enum(PAYMENT_METHOD_VALUES, {
      error: 'Metode pembayaran wajib dipilih',
    }),
    status: z.enum(TRANSACTION_STATUS_VALUES, {
      error: 'Status transaksi wajib dipilih',
    }),
    referenceNumber: optionalText(100),
    paymentDate: dateKeySchema('Tanggal transaksi'),
    notes: optionalText(1000),
  })
  .superRefine(referenceRule);

export const subscriptionSchema = z
  .object({
    studentId: z
      .string({ error: 'Siswa wajib dipilih' })
      .trim()
      .min(1, 'Siswa wajib dipilih'),
    packageId: optionalText(100),
    trainingVenueId: optionalText(100),
    packageName: z
      .string({ error: 'Nama paket wajib diisi' })
      .trim()
      .min(3, 'Nama paket minimal 3 karakter')
      .max(120, 'Nama paket maksimal 120 karakter'),
    program: z.enum(PROGRAM_VALUES, { error: 'Program wajib dipilih' }),
    price: moneySchema,
    startsAt: dateKeySchema('Tanggal mulai'),
    expiresAt: dateKeySchema('Tanggal berakhir'),
    totalSessions: optionalSessionCountSchema,
    remainingSessions: optionalRemainingSessionCountSchema,
    status: z.enum(SUBSCRIPTION_STATUS_VALUES).default('ACTIVE'),
    autoRenew: z.boolean().default(false),
    notes: optionalText(1000),
  })
  .superRefine((data, context) => {
    if (data.expiresAt < data.startsAt) {
      context.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message: 'Tanggal berakhir tidak boleh sebelum tanggal mulai',
      });
    }

    if (
      data.totalSessions !== null &&
      data.remainingSessions !== null &&
      data.remainingSessions > data.totalSessions
    ) {
      context.addIssue({
        code: 'custom',
        path: ['remainingSessions'],
        message: 'Sisa sesi tidak boleh lebih besar dari total sesi',
      });
    }
  });

export function getFinanceFieldErrors(error) {
  const fieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === 'string' && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

// Pengajuan perpanjangan paket oleh siswa dari halaman Paket Saya.
// Nominal & siswa tidak diterima dari client; keduanya ditentukan server
// (harga katalog paket dan profil siswa dari session).
export const renewalRequestSchema = z.object({
  packageId: z
    .string({ error: 'Paket wajib dipilih' })
    .trim()
    .min(1, 'Paket wajib dipilih'),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES, {
    error: 'Metode pembayaran wajib dipilih',
  }),
});
