import { prisma } from '@/lib/db/prisma';
import {
  canAccessFeature,
  getProgramScope,
  isAdminLevel,
} from '@/lib/auth/permissions';
import { PROGRAM_CONFIG } from '@/lib/operational/constants';

const TIME_ZONE = 'Asia/Jakarta';
const MAX_NOTIFICATIONS = 20;
const ACTIVE_ASSIGNMENT_STATUSES = ['ASSIGNED', 'CONFIRMED'];

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const WEEKDAY_TO_ENUM = {
  Mon: 'MONDAY',
  Tue: 'TUESDAY',
  Wed: 'WEDNESDAY',
  Thu: 'THURSDAY',
  Fri: 'FRIDAY',
  Sat: 'SATURDAY',
  Sun: 'SUNDAY',
};

function getJakartaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);

  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    dayOfWeek: WEEKDAY_TO_ENUM[values.weekday] ?? 'MONDAY',
    startUtc: new Date(Date.UTC(year, month - 1, day)),
  };
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function programLabel(program) {
  return PROGRAM_CONFIG[program]?.title ?? program ?? 'Tanpa program';
}

function queryHref(path, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function createNotification(notification) {
  return {
    ...notification,
    occurredAt: notification.occurredAt.toISOString(),
    isRead: false,
  };
}

function scopedSubscriptionWhere(scope) {
  if (!scope) return {};

  return {
    OR: [
      { program: scope },
      { program: 'PRIVATE', student: { is: { level: scope } } },
    ],
  };
}

function scopedTransactionWhere(scope) {
  if (!scope) return {};

  return {
    OR: [
      { program: scope },
      { program: 'PRIVATE', student: { is: { level: scope } } },
      { program: null, student: { is: { level: scope } } },
    ],
  };
}

export async function getNewLeadCount(user) {
  if (!user || !canAccessFeature(user.role, 'marketing')) return 0;

  return prisma.lead.count({
    where: { status: 'NEW' },
  });
}

async function getBusinessNotifications(user, now, jakartaToday) {
  const scope = getProgramScope(user);
  const notifications = [];
  const expiryEnd = addDays(jakartaToday.startUtc, 8);

  const [leads, pendingStudents, pendingTransactions, expiringSubscriptions, draftReports, upcomingBookings] =
    await Promise.all([
      canAccessFeature(user.role, 'marketing')
        ? prisma.lead.findMany({
            where: { status: 'NEW' },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              studentName: true,
              parentName: true,
              program: true,
              source: true,
              createdAt: true,
            },
          })
        : [],
      prisma.student.findMany({
        where: {
          status: 'PENDING',
          ...(scope ? { level: scope } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          level: true,
          createdAt: true,
        },
      }),
      prisma.transaction.findMany({
        where: {
          status: 'PENDING',
          ...scopedTransactionWhere(scope),
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          description: true,
          amount: true,
          createdAt: true,
          student: { select: { name: true } },
        },
      }),
      prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            gte: jakartaToday.startUtc,
            lt: expiryEnd,
          },
          ...scopedSubscriptionWhere(scope),
        },
        orderBy: { expiresAt: 'asc' },
        take: 5,
        select: {
          id: true,
          packageName: true,
          program: true,
          expiresAt: true,
          updatedAt: true,
          student: { select: { name: true } },
        },
      }),
      prisma.studentReport.findMany({
        where: {
          status: 'DRAFT',
          ...(scope ? { level: scope } : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          level: true,
          periodLabel: true,
          updatedAt: true,
          student: { select: { name: true } },
          coach: { select: { name: true } },
        },
      }),
      prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          ...(scope ? { student: { is: { level: scope } } } : {}),
          slot: {
            is: {
              startsAt: { gte: now, lte: addDays(now, 7) },
              schedule: { is: { program: 'PRIVATE' } },
            },
          },
        },
        orderBy: { slot: { startsAt: 'asc' } },
        take: 5,
        select: {
          id: true,
          bookedAt: true,
          student: { select: { name: true, level: true } },
          slot: {
            select: {
              startsAt: true,
              schedule: { select: { title: true, poolName: true } },
            },
          },
        },
      }),
    ]);

  leads.forEach((lead) => {
    notifications.push(
      createNotification({
        key: `lead-new:${lead.id}`,
        type: 'LEAD_NEW',
        title: `Lead baru: ${lead.studentName}`,
        description: `${lead.parentName} • ${programLabel(lead.program)} • ${lead.source}`,
        href: '/dashboard/marketing/leads',
        occurredAt: lead.createdAt,
        priority: 95,
      })
    );
  });

  pendingTransactions.forEach((transaction) => {
    notifications.push(
      createNotification({
        key: `transaction-pending:${transaction.id}`,
        type: 'TRANSACTION_PENDING',
        title: `Pembayaran menunggu • ${currencyFormatter.format(transaction.amount)}`,
        description: `${transaction.invoiceNumber} • ${transaction.student?.name ?? transaction.description}`,
        href: queryHref('/dashboard/finance', {
          tab: 'transactions',
          target: 'transactions',
          q: transaction.invoiceNumber,
        }),
        occurredAt: transaction.createdAt,
        priority: 90,
      })
    );
  });

  expiringSubscriptions.forEach((subscription) => {
    notifications.push(
      createNotification({
        key: `subscription-expiring:${subscription.id}:${subscription.expiresAt.toISOString()}`,
        type: 'SUBSCRIPTION_EXPIRING',
        title: `Paket ${subscription.student?.name ?? 'siswa'} segera berakhir`,
        description: `${subscription.packageName} berakhir ${dateFormatter.format(subscription.expiresAt)} • ${programLabel(subscription.program)}`,
        href: queryHref('/dashboard/finance', {
          tab: 'subscriptions',
          target: 'subscriptions',
          q: subscription.student?.name ?? subscription.packageName,
        }),
        occurredAt: subscription.updatedAt,
        priority: 85,
      })
    );
  });

  pendingStudents.forEach((student) => {
    notifications.push(
      createNotification({
        key: `student-pending:${student.id}`,
        type: 'STUDENT_PENDING',
        title: `Siswa menunggu aktivasi: ${student.name}`,
        description: `Level ${programLabel(student.level)} • status PENDING sejak ${dateFormatter.format(student.createdAt)}`,
        href: queryHref('/dashboard/students', { q: student.name }),
        occurredAt: student.createdAt,
        priority: 80,
      })
    );
  });

  draftReports.forEach((report) => {
    notifications.push(
      createNotification({
        key: `report-draft:${report.id}`,
        type: 'REPORT_DRAFT',
        title: `Draf raport ${report.student?.name ?? 'siswa'}`,
        description: `${report.periodLabel} • ${programLabel(report.level)}${report.coach?.name ? ` • ${report.coach.name}` : ''}`,
        href: queryHref('/dashboard/operasional/raport', {
          q: report.student?.name ?? report.periodLabel,
        }),
        occurredAt: report.updatedAt,
        priority: 75,
      })
    );
  });

  upcomingBookings.forEach((booking) => {
    notifications.push(
      createNotification({
        key: `private-booking:${booking.id}`,
        type: 'PRIVATE_BOOKING',
        title: `Booking Private ${booking.student?.name ?? 'siswa'}`,
        description: `${dateTimeFormatter.format(booking.slot.startsAt)} WIB • ${booking.slot.schedule.poolName}`,
        href: '/dashboard/schedule/private',
        occurredAt: booking.bookedAt,
        priority: 70,
      })
    );
  });

  return notifications;
}

async function getCoachNotifications(user, now, jakartaToday) {
  const notifications = [];

  const [draftReports, todaySchedules, privateSlots] = await Promise.all([
    prisma.studentReport.findMany({
      where: { status: 'DRAFT', coachId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        level: true,
        periodLabel: true,
        updatedAt: true,
        student: { select: { name: true } },
      },
    }),
    prisma.schedule.findMany({
      where: {
        status: 'ACTIVE',
        dayOfWeek: jakartaToday.dayOfWeek,
        assignments: {
          some: {
            slotId: null,
            coachId: user.id,
            status: { in: ACTIVE_ASSIGNMENT_STATUSES },
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        program: true,
        startTime: true,
        endTime: true,
        poolName: true,
        updatedAt: true,
      },
    }),
    prisma.slot.findMany({
      where: {
        startsAt: { gte: now, lte: addDays(now, 7) },
        schedule: { is: { program: 'PRIVATE', status: 'ACTIVE' } },
        bookings: { some: { status: 'CONFIRMED' } },
      },
      orderBy: { startsAt: 'asc' },
      take: 20,
      select: {
        id: true,
        startsAt: true,
        schedule: {
          select: {
            poolName: true,
            assignments: {
              where: {
                slotId: null,
                status: { in: ACTIVE_ASSIGNMENT_STATUSES },
              },
              select: { coachId: true },
            },
          },
        },
        coachAssignments: {
          where: { status: { in: ACTIVE_ASSIGNMENT_STATUSES } },
          select: { coachId: true },
        },
        bookings: {
          where: { status: 'CONFIRMED' },
          take: 1,
          select: {
            bookedAt: true,
            student: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  draftReports.forEach((report) => {
    notifications.push(
      createNotification({
        key: `report-draft:${report.id}`,
        type: 'REPORT_DRAFT',
        title: `Draf raport ${report.student?.name ?? 'siswa'}`,
        description: `${report.periodLabel} • ${programLabel(report.level)} • belum diterbitkan`,
        href: queryHref('/dashboard/operasional/raport', {
          q: report.student?.name ?? report.periodLabel,
        }),
        occurredAt: report.updatedAt,
        priority: 85,
      })
    );
  });

  todaySchedules.forEach((schedule) => {
    notifications.push(
      createNotification({
        key: `coach-class:${jakartaToday.dateKey}:${schedule.id}`,
        type: 'COACH_CLASS_TODAY',
        title: `Kelas hari ini: ${schedule.title}`,
        description: `${schedule.startTime}–${schedule.endTime} WIB • ${schedule.poolName} • ${programLabel(schedule.program)}`,
        href: `/dashboard/schedule/${PROGRAM_CONFIG[schedule.program]?.slug ?? 'private'}`,
        occurredAt: now,
        priority: 80,
      })
    );
  });

  privateSlots
    .filter((slot) => {
      const effectiveAssignments =
        slot.coachAssignments.length > 0
          ? slot.coachAssignments
          : slot.schedule.assignments;

      return effectiveAssignments.some(
        (assignment) => assignment.coachId === user.id
      );
    })
    .slice(0, 5)
    .forEach((slot) => {
      const booking = slot.bookings[0];
      if (!booking) return;

      notifications.push(
        createNotification({
          key: `coach-private-booking:${slot.id}`,
          type: 'PRIVATE_BOOKING',
          title: `Private dengan ${booking.student?.name ?? 'siswa'}`,
          description: `${dateTimeFormatter.format(slot.startsAt)} WIB • ${slot.schedule.poolName}`,
          href: '/dashboard/schedule/private',
          occurredAt: booking.bookedAt,
          priority: 75,
        })
      );
    });

  return notifications;
}

async function getStudentNotifications(user, now, jakartaToday) {
  const profile = await prisma.student.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true, level: true, status: true, createdAt: true },
  });

  if (!profile) {
    return [
      createNotification({
        key: `student-profile-missing:${user.id}`,
        type: 'SYSTEM',
        title: 'Profil siswa belum terhubung',
        description:
          'Akun login Anda belum terhubung ke data Siswa. Hubungi admin akademi.',
        href: '/dashboard/settings',
        occurredAt: now,
        priority: 100,
      }),
    ];
  }

  const notifications = [];
  const expiryEnd = addDays(jakartaToday.startUtc, 8);
  const publishedSince = addDays(now, -30);

  const [pendingTransactions, packageNotifications, upcomingBookings, publishedReports] =
    await Promise.all([
      prisma.transaction.findMany({
        where: { studentId: profile.id, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          createdAt: true,
        },
      }),
      prisma.subscription.findMany({
        where: {
          studentId: profile.id,
          OR: [
            { status: 'PENDING' },
            {
              status: 'ACTIVE',
              expiresAt: { gte: jakartaToday.startUtc, lt: expiryEnd },
            },
          ],
        },
        orderBy: { expiresAt: 'asc' },
        take: 5,
        select: {
          id: true,
          packageName: true,
          status: true,
          expiresAt: true,
          updatedAt: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          studentId: profile.id,
          status: 'CONFIRMED',
          slot: {
            is: {
              startsAt: { gte: now, lte: addDays(now, 7) },
              schedule: { is: { program: 'PRIVATE' } },
            },
          },
        },
        orderBy: { slot: { startsAt: 'asc' } },
        take: 5,
        select: {
          id: true,
          bookedAt: true,
          slot: {
            select: {
              startsAt: true,
              schedule: { select: { title: true, poolName: true } },
            },
          },
        },
      }),
      prisma.studentReport.findMany({
        where: {
          studentId: profile.id,
          status: 'PUBLISHED',
          publishedAt: { gte: publishedSince },
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          periodLabel: true,
          level: true,
          publishedAt: true,
        },
      }),
    ]);

  if (profile.status === 'PENDING') {
    notifications.push(
      createNotification({
        key: `student-own-pending:${profile.id}`,
        type: 'STUDENT_PENDING',
        title: 'Akun siswa menunggu aktivasi',
        description:
          'Selesaikan pembayaran paket agar status siswa menjadi ACTIVE.',
        href: '/dashboard/my-package',
        occurredAt: profile.createdAt,
        priority: 100,
      })
    );
  }

  pendingTransactions.forEach((transaction) => {
    notifications.push(
      createNotification({
        key: `transaction-pending:${transaction.id}`,
        type: 'TRANSACTION_PENDING',
        title: `Tagihan menunggu • ${currencyFormatter.format(transaction.amount)}`,
        description: `Invoice ${transaction.invoiceNumber}`,
        href: '/dashboard/my-package',
        occurredAt: transaction.createdAt,
        priority: 95,
      })
    );
  });

  packageNotifications.forEach((subscription) => {
    const isPending = subscription.status === 'PENDING';

    notifications.push(
      createNotification({
        key: isPending
          ? `subscription-pending:${subscription.id}`
          : `subscription-expiring:${subscription.id}:${subscription.expiresAt.toISOString()}`,
        type: 'SUBSCRIPTION_EXPIRING',
        title: isPending
          ? `Paket menunggu pembayaran: ${subscription.packageName}`
          : `Paket segera berakhir: ${subscription.packageName}`,
        description: isPending
          ? 'Paket akan aktif setelah pembayaran terverifikasi.'
          : `Berakhir ${dateFormatter.format(subscription.expiresAt)}. Perpanjang agar latihan tidak terputus.`,
        href: '/dashboard/my-package',
        occurredAt: subscription.updatedAt,
        priority: isPending ? 92 : 88,
      })
    );
  });

  upcomingBookings.forEach((booking) => {
    notifications.push(
      createNotification({
        key: `private-booking:${booking.id}`,
        type: 'PRIVATE_BOOKING',
        title: 'Jadwal Private Anda',
        description: `${dateTimeFormatter.format(booking.slot.startsAt)} WIB • ${booking.slot.schedule.poolName}`,
        href: '/dashboard/schedule/private',
        occurredAt: booking.bookedAt,
        priority: 80,
      })
    );
  });

  publishedReports.forEach((report) => {
    notifications.push(
      createNotification({
        key: `report-published:${report.id}:${report.publishedAt?.toISOString() ?? ''}`,
        type: 'REPORT_PUBLISHED',
        title: `Raport ${report.periodLabel} diterbitkan`,
        description: `Lihat hasil evaluasi ${programLabel(report.level)} Anda.`,
        href: queryHref('/dashboard/operasional/raport', {
          q: report.periodLabel,
        }),
        occurredAt: report.publishedAt ?? now,
        priority: 70,
      })
    );
  });

  return notifications;
}

async function buildNotifications(user, now) {
  const jakartaToday = getJakartaToday(now);
  const scope = getProgramScope(user);
  const hasInvalidProgramScope = user.role === 'ADMIN' && !scope;

  if (hasInvalidProgramScope) {
    return [
      createNotification({
        key: `admin-program-scope-missing:${user.id}`,
        type: 'SYSTEM',
        title: 'Program admin belum diatur',
        description:
          'Akun ADMIN ini belum memiliki programScope, sehingga akses Operasional dan Finance dibatasi. Hubungi Superadmin.',
        href: '/dashboard/settings',
        occurredAt: now,
        priority: 100,
      }),
    ];
  }

  if (isAdminLevel(user.role)) {
    return getBusinessNotifications(user, now, jakartaToday);
  }

  if (user.role === 'COACH') {
    return getCoachNotifications(user, now, jakartaToday);
  }

  if (user.role === 'STUDENT') {
    return getStudentNotifications(user, now, jakartaToday);
  }

  return [];
}

export async function getDashboardNotifications(user) {
  const now = new Date();
  const [rawNotifications, newLeadCount] = await Promise.all([
    buildNotifications(user, now),
    getNewLeadCount(user),
  ]);

  const uniqueNotifications = [
    ...new Map(
      rawNotifications.map((notification) => [notification.key, notification])
    ).values(),
  ].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(b.occurredAt) - new Date(a.occurredAt);
  });

  const keys = uniqueNotifications.map((notification) => notification.key);
  const reads =
    keys.length > 0
      ? await prisma.notificationRead.findMany({
          where: {
            userId: user.id,
            notificationKey: { in: keys },
          },
          select: { notificationKey: true },
        })
      : [];

  const readKeys = new Set(reads.map((read) => read.notificationKey));
  const allNotifications = uniqueNotifications.map((notification) => ({
    ...notification,
    isRead: readKeys.has(notification.key),
  }));

  return {
    notifications: allNotifications.slice(0, MAX_NOTIFICATIONS),
    unreadCount: allNotifications.filter((notification) => !notification.isRead).length,
    newLeadCount,
    generatedAt: now.toISOString(),
  };
}

export async function markNotificationsAsRead(user, keys) {
  const normalizedKeys = [
    ...new Set(
      (Array.isArray(keys) ? keys : [])
        .filter((key) => typeof key === 'string')
        .map((key) => key.trim())
        .filter((key) => key.length > 0 && key.length <= 180)
    ),
  ].slice(0, 50);

  if (normalizedKeys.length === 0) {
    return { count: 0, keys: [] };
  }

  const result = await prisma.notificationRead.createMany({
    data: normalizedKeys.map((notificationKey) => ({
      userId: user.id,
      notificationKey,
    })),
    skipDuplicates: true,
  });

  return {
    count: result.count,
    keys: normalizedKeys,
  };
}
