import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/api/routeHelpers';

export const SYSTEM_SETTING_ID = 'default';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const DAY_LABELS = {
  MONDAY: 'Senin',
  TUESDAY: 'Selasa',
  WEDNESDAY: 'Rabu',
  THURSDAY: 'Kamis',
  FRIDAY: 'Jumat',
  SATURDAY: 'Sabtu',
  SUNDAY: 'Minggu',
};

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function mapTemplate(template) {
  return {
    id: template.id,
    name: template.name,
    channel: template.channel === 'EMAIL' ? 'email' : 'whatsapp',
    eventKey: template.eventKey,
    subject: template.subject ?? '',
    message: template.message,
    isActive: template.isActive,
  };
}

export async function getSystemSettingRecord() {
  return prisma.systemSetting.findUnique({
    where: { id: SYSTEM_SETTING_ID },
  });
}

export async function getSystemSettings() {
  const [setting, templates] = await Promise.all([
    getSystemSettingRecord(),
    prisma.notificationTemplate.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
  ]);

  if (!setting) return null;

  const general = asObject(setting.general);
  const financial = asObject(setting.financial);
  const notification = asObject(setting.notification);

  return {
    version: 1,
    general: {
      ...general,
      operatingHours: Array.isArray(general.operatingHours)
        ? general.operatingHours
        : [],
    },
    financial,
    notifications: {
      senderName: notification.senderName ?? '',
      whatsappNumber: notification.whatsappNumber ?? '',
      emailFrom: notification.emailFrom ?? '',
      templates: templates.map(mapTemplate),
    },
    updatedAt: setting.updatedAt?.toISOString?.() ?? setting.updatedAt,
  };
}

export async function updateSystemSettings(data, actor) {
  if (actor?.role !== 'SUPERADMIN') {
    throw new ApiError(
      403,
      'FORBIDDEN',
      'Hanya Superadmin yang dapat mengubah pengaturan sistem.'
    );
  }

  const existing = await getSystemSettingRecord();

  if (!existing) {
    throw new ApiError(
      503,
      'SETTINGS_NOT_SEEDED',
      'Pengaturan sistem belum tersedia di database. Jalankan migration dan seeder terlebih dahulu.'
    );
  }

  const notification = {
    senderName: data.notifications.senderName,
    whatsappNumber: data.notifications.whatsappNumber,
    emailFrom: data.notifications.emailFrom,
  };

  await prisma.$transaction(async (tx) => {
    await tx.systemSetting.update({
      where: { id: SYSTEM_SETTING_ID },
      data: {
        general: data.general,
        financial: data.financial,
        notification,
        updatedById: actor.id,
      },
    });

    const templateIds = data.notifications.templates.map((template) => template.id);

    await tx.notificationTemplate.deleteMany({
      where: { id: { notIn: templateIds } },
    });

    for (const [index, template] of data.notifications.templates.entries()) {
      const templateData = {
        name: template.name,
        channel: template.channel === 'email' ? 'EMAIL' : 'WHATSAPP',
        eventKey: template.eventKey,
        subject: template.subject || null,
        message: template.message,
        isActive: template.isActive,
        sortOrder: index,
      };

      await tx.notificationTemplate.upsert({
        where: { id: template.id },
        update: templateData,
        create: { id: template.id, ...templateData },
      });
    }
  });

  return getSystemSettings();
}

export async function getPublicBusinessSettings() {
  const setting = await getSystemSettingRecord();
  if (!setting) return null;

  return {
    general: asObject(setting.general),
    notification: asObject(setting.notification),
    siteContent: asObject(setting.siteContent),
  };
}

export async function getPaymentReminderSettings() {
  const [setting, template] = await Promise.all([
    getSystemSettingRecord(),
    prisma.notificationTemplate.findFirst({
      where: {
        eventKey: 'PAYMENT_REMINDER',
        channel: 'WHATSAPP',
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      select: { message: true },
    }),
  ]);

  if (!template?.message) return null;

  return {
    businessName: asObject(setting?.general).businessName ?? '',
    messageTemplate: template.message,
  };
}

export async function getTemplatePreviewContext() {
  const now = new Date();
  const [setting, subscription, transaction, lead, promotion, schedule] =
    await Promise.all([
      getSystemSettingRecord(),
      prisma.subscription.findFirst({
        where: { status: { in: ['ACTIVE', 'PENDING'] } },
        orderBy: [{ expiresAt: 'asc' }],
        select: {
          packageName: true,
          price: true,
          poolName: true,
          expiresAt: true,
          remainingSessions: true,
          student: { select: { name: true } },
        },
      }),
      prisma.transaction.findFirst({
        orderBy: [{ createdAt: 'desc' }],
        select: { invoiceNumber: true, amount: true },
      }),
      prisma.lead.findFirst({
        orderBy: [{ createdAt: 'desc' }],
        select: { parentName: true, studentName: true },
      }),
      prisma.promotion.findFirst({
        where: {
          status: 'ACTIVE',
          startsAt: { lte: now },
          endsAt: { gte: now },
          code: { not: null },
        },
        orderBy: [{ endsAt: 'asc' }],
        select: { code: true },
      }),
      prisma.schedule.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          poolName: true,
          assignments: {
            where: {
              slotId: null,
              status: { in: ['ASSIGNED', 'CONFIRMED'] },
            },
            take: 1,
            select: { coach: { select: { name: true } } },
          },
        },
      }),
    ]);

  const general = asObject(setting?.general);
  const scheduleLabel = schedule
    ? `${DAY_LABELS[schedule.dayOfWeek] ?? schedule.dayOfWeek}, ${schedule.startTime}-${schedule.endTime} WIB`
    : '-';

  return {
    nama_siswa: subscription?.student?.name ?? lead?.studentName ?? '-',
    nama_orang_tua: lead?.parentName ?? 'Bapak/Ibu',
    sisa_pertemuan: String(subscription?.remainingSessions ?? '-'),
    nama_paket: subscription?.packageName ?? '-',
    tanggal_jatuh_tempo: subscription?.expiresAt
      ? dateFormatter.format(subscription.expiresAt)
      : '-',
    nominal_tagihan: currencyFormatter.format(
      transaction?.amount ?? subscription?.price ?? 0
    ),
    jadwal_kelas: scheduleLabel,
    nama_kolam: subscription?.poolName ?? schedule?.poolName ?? '-',
    nama_pelatih: schedule?.assignments?.[0]?.coach?.name ?? '-',
    kode_promo: promotion?.code ?? '-',
    nama_bisnis: general.businessName ?? '',
    nomor_invoice: transaction?.invoiceNumber ?? '-',
  };
}

export async function getFinancialPreviewSample() {
  const pendingTransaction = await prisma.transaction.findFirst({
    where: { status: 'PENDING' },
    orderBy: [{ createdAt: 'asc' }],
    select: { amount: true, createdAt: true },
  });

  if (!pendingTransaction) return { amount: 0, lateDays: 0 };

  const lateDays = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(pendingTransaction.createdAt).getTime()) /
        (24 * 60 * 60 * 1000)
    )
  );

  return { amount: pendingTransaction.amount, lateDays };
}
