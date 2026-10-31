import { z } from 'zod';
import {
  ASSIGNMENT_ROLE_VALUES,
  DAY_OF_WEEK_VALUES,
  PROGRAM_VALUES,
  REPORT_LEVEL_VALUES,
  REPORT_RECOMMENDATION_VALUES,
  REPORT_STATUS_VALUES,
  SCHEDULE_STATUS_VALUES,
} from '@/lib/operational/constants';
import { timeToMinutes } from '@/lib/operational/dateUtils';

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

const dateKeySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
  .refine(isRealDateKey, 'Tanggal tidak valid');

const optionalDateKey = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => (value ? value : null))
  .refine(
    (value) => value === null || isRealDateKey(value),
    'Tanggal tidak valid'
  );

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam harus HH:mm');

export const scheduleSchema = z
  .object({
    title: z
      .string({ error: 'Nama kelas/jadwal wajib diisi' })
      .trim()
      .min(3, 'Nama kelas/jadwal minimal 3 karakter')
      .max(120),
    program: z.enum(PROGRAM_VALUES, { error: 'Program wajib dipilih' }),
    dayOfWeek: z.enum(DAY_OF_WEEK_VALUES, { error: 'Hari wajib dipilih' }),
    startTime: timeSchema,
    endTime: timeSchema,
    capacity: z.coerce
      .number({ error: 'Kapasitas harus berupa angka' })
      .int('Kapasitas harus berupa bilangan bulat')
      .min(1, 'Kapasitas minimal 1')
      .max(100, 'Kapasitas maksimal 100'),
    trainingVenueId: z
      .string({ error: 'Tempat latihan wajib dipilih' })
      .trim()
      .min(1, 'Tempat latihan wajib dipilih'),
    lane: optionalText(80),
    status: z.enum(SCHEDULE_STATUS_VALUES).default('ACTIVE'),
    notes: optionalText(1000),
    effectiveStartDate: optionalDateKey,
    effectiveEndDate: optionalDateKey,
    leadCoachId: optionalText(100),
  })
  .superRefine((data, context) => {
    const startMinutes = timeToMinutes(data.startTime);
    const endMinutes = timeToMinutes(data.endTime);

    if (
      startMinutes !== null &&
      endMinutes !== null &&
      endMinutes <= startMinutes
    ) {
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'Jam selesai harus setelah jam mulai',
      });
    }

    if (
      data.effectiveStartDate &&
      data.effectiveEndDate &&
      data.effectiveEndDate < data.effectiveStartDate
    ) {
      context.addIssue({
        code: 'custom',
        path: ['effectiveEndDate'],
        message: 'Tanggal berakhir tidak boleh sebelum tanggal mulai',
      });
    }

    if (data.program === 'PRIVATE' && data.capacity !== 1) {
      context.addIssue({
        code: 'custom',
        path: ['capacity'],
        message: 'Kapasitas jadwal Private harus 1 siswa',
      });
    }
  });

export const occurrenceQuerySchema = z.object({
  program: z.enum(PROGRAM_VALUES).optional(),
  weekStart: dateKeySchema,
});

export const coachAssignmentSchema = z.object({
  scheduleId: z.string().trim().min(1, 'Jadwal wajib dipilih'),
  date: dateKeySchema,
  coachId: z.string().trim().min(1, 'Pelatih wajib dipilih'),
  role: z.enum(ASSIGNMENT_ROLE_VALUES).default('LEAD'),
});

export const removeCoachAssignmentSchema = z.object({
  scheduleId: z.string().trim().min(1, 'Jadwal wajib dipilih'),
  date: dateKeySchema,
});

export const privateBookingSchema = z.object({
  scheduleId: z.string().trim().min(1, 'Jadwal wajib dipilih'),
  date: dateKeySchema,
  studentId: z.string().trim().min(1, 'Siswa wajib dipilih'),
  coachId: z.string().trim().min(1, 'Pelatih wajib dipilih'),
  notes: optionalText(300),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().trim().min(1, 'Booking wajib dipilih'),
});

const optionalSessionCount = (label) =>
  z
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
        (Number.isInteger(value) && value >= 0 && value <= 500),
      `${label} harus berupa bilangan bulat 0 sampai 500`
    );

export const reportItemSchema = z.object({
  competency: z
    .string({ error: 'Nama kompetensi wajib diisi' })
    .trim()
    .min(3, 'Nama kompetensi minimal 3 karakter')
    .max(120, 'Nama kompetensi maksimal 120 karakter'),
  score: z.coerce
    .number({ error: 'Skor kompetensi wajib dipilih' })
    .int('Skor harus berupa bilangan bulat')
    .min(1, 'Skor minimal 1')
    .max(5, 'Skor maksimal 5'),
  note: optionalText(300),
});

export const reportSchema = z
  .object({
    studentId: z
      .string({ error: 'Siswa wajib dipilih' })
      .trim()
      .min(1, 'Siswa wajib dipilih'),
    coachId: optionalText(100),
    level: z.enum(REPORT_LEVEL_VALUES, { error: 'Level wajib dipilih' }),
    periodLabel: z
      .string({ error: 'Label periode wajib diisi' })
      .trim()
      .min(3, 'Label periode minimal 3 karakter')
      .max(80, 'Label periode maksimal 80 karakter'),
    periodStart: optionalDateKey,
    periodEnd: optionalDateKey,
    sessionsAttended: optionalSessionCount('Sesi hadir'),
    totalSessions: optionalSessionCount('Total sesi'),
    coachNotes: optionalText(2000),
    recommendation: z
      .enum(REPORT_RECOMMENDATION_VALUES)
      .default('STAY'),
    status: z.enum(REPORT_STATUS_VALUES).default('DRAFT'),
    items: z
      .array(reportItemSchema, { error: 'Item kompetensi wajib diisi' })
      .min(1, 'Minimal satu kompetensi harus dinilai')
      .max(20, 'Maksimal 20 kompetensi per raport'),
  })
  .superRefine((data, context) => {
    if (
      data.periodStart &&
      data.periodEnd &&
      data.periodEnd < data.periodStart
    ) {
      context.addIssue({
        code: 'custom',
        path: ['periodEnd'],
        message: 'Tanggal akhir periode tidak boleh sebelum tanggal mulai',
      });
    }

    if (
      data.sessionsAttended !== null &&
      data.totalSessions !== null &&
      data.sessionsAttended > data.totalSessions
    ) {
      context.addIssue({
        code: 'custom',
        path: ['sessionsAttended'],
        message: 'Sesi hadir tidak boleh lebih besar dari total sesi',
      });
    }

    const competencyNames = data.items.map((item) =>
      item.competency.trim().toLowerCase()
    );

    if (new Set(competencyNames).size !== competencyNames.length) {
      context.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'Nama kompetensi tidak boleh duplikat dalam satu raport',
      });
    }
  });

export function getOperationalFieldErrors(error) {
  const fieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === 'string' && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}
