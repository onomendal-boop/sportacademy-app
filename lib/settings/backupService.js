import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/api/routeHelpers';

const EXPORT_DELEGATES = [
  'user',
  'pool',
  'staff',
  'student',
  'schedule',
  'slot',
  'coachAssignment',
  'booking',
  'studentReport',
  'studentReportItem',
  'package',
  'subscription',
  'transaction',
  'promotion',
  'article',
  'lead',
  'leadActivity',
  'notificationRead',
  'systemSetting',
  'notificationTemplate',
  'programContent',
  'testimonial',
  'faqItem',
];

function assertSuperadmin(actor) {
  if (actor?.role !== 'SUPERADMIN') {
    throw new ApiError(
      403,
      'FORBIDDEN',
      'Hanya Superadmin yang dapat membuat atau mengunduh backup database.'
    );
  }
}

function serializeValue(_key, value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (
    value &&
    typeof value === 'object' &&
    typeof value.toNumber === 'function' &&
    value.constructor?.name === 'Decimal'
  ) {
    return value.toNumber();
  }
  return value;
}

function buildFileName(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const suffix = String(date.getTime()).slice(-4);

  return `aaa-sport-academy-backup-${values.year}${values.month}${values.day}-${values.hour}${values.minute}${values.second}-${suffix}.json`;
}

function mapBackup(record) {
  return {
    id: record.id,
    fileName: record.fileName,
    format: record.format,
    sizeBytes: record.sizeBytes,
    createdAt: record.createdAt?.toISOString?.() ?? record.createdAt,
    createdBy: record.createdBy ?? null,
  };
}

export async function listDatabaseBackups(actor, limit = 20) {
  assertSuperadmin(actor);

  const records = await prisma.databaseBackup.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.min(50, Math.max(1, limit)),
    select: {
      id: true,
      fileName: true,
      format: true,
      sizeBytes: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true, username: true } },
    },
  });

  return records.map(mapBackup);
}

export async function createDatabaseBackup(actor) {
  assertSuperadmin(actor);

  const exportedAt = new Date();
  const tables = {};

  for (const delegateName of EXPORT_DELEGATES) {
    const delegate = prisma[delegateName];

    if (!delegate?.findMany) {
      throw new ApiError(
        503,
        'PRISMA_CLIENT_OUTDATED',
        `Prisma Client belum memiliki delegate ${delegateName}. Jalankan prisma generate setelah migration.`
      );
    }

    tables[delegateName] = await delegate.findMany();
  }

  tables.databaseBackup = await prisma.databaseBackup.findMany({
    select: {
      id: true,
      fileName: true,
      format: true,
      sizeBytes: true,
      createdById: true,
      createdAt: true,
      content: false,
    },
    orderBy: { createdAt: 'asc' },
  });

  const snapshot = {
    application: 'AAA Sport Academy',
    formatVersion: 1,
    exportedAt: exportedAt.toISOString(),
    source: 'MySQL melalui Prisma Client',
    notes:
      'Snapshot JSON berisi record database aktual. Konten file backup lama tidak disalin ulang; hanya metadata backup yang disertakan. Tabel login rate limit yang bersifat sementara tidak diekspor.',
    tables,
  };
  const content = JSON.stringify(snapshot, serializeValue, 2);
  const sizeBytes = new TextEncoder().encode(content).length;

  const record = await prisma.databaseBackup.create({
    data: {
      fileName: buildFileName(exportedAt),
      format: 'JSON',
      sizeBytes,
      content,
      createdById: actor.id,
    },
    select: {
      id: true,
      fileName: true,
      format: true,
      sizeBytes: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true, username: true } },
    },
  });

  return { backup: mapBackup(record), content };
}

export async function getDatabaseBackupFile(actor, id) {
  assertSuperadmin(actor);

  const record = await prisma.databaseBackup.findUnique({
    where: { id },
    select: { id: true, fileName: true, content: true },
  });

  if (!record) {
    throw new ApiError(404, 'NOT_FOUND', 'Backup database tidak ditemukan.');
  }

  return record;
}
