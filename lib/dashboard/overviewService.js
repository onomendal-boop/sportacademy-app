import { prisma } from '@/lib/db/prisma';
import {
  canAccessFeature,
  getProgramScope,
  isAdminLevel,
} from '@/lib/auth/permissions';
import { getProgramDisplayName } from '@/lib/programs';

const TIME_ZONE = 'Asia/Jakarta';
const ACTIVE_ASSIGNMENT_STATUSES = ['ASSIGNED', 'CONFIRMED'];
const WEEKDAY_TO_ENUM = {
  Mon: 'MONDAY',
  Tue: 'TUESDAY',
  Wed: 'WEDNESDAY',
  Thu: 'THURSDAY',
  Fri: 'FRIDAY',
  Sat: 'SATURDAY',
  Sun: 'SUNDAY',
};

const transactionMethodLabels = {
  CASH: 'Tunai',
  TRANSFER: 'Transfer',
  QRIS: 'QRIS',
};

function addDays(date, days) {
  return new Date(date.getTime() + days * 86_400_000);
}

function getJakartaDateContext(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dateKey = `${values.year}-${values.month}-${values.day}`;

  return {
    dateKey,
    dayOfWeek: WEEKDAY_TO_ENUM[values.weekday] ?? 'MONDAY',
    // Prisma @db.Date disimpan sebagai tanggal UTC dalam aplikasi ini.
    dateOnlyStart: new Date(`${dateKey}T00:00:00.000Z`),
    // Batas waktu nyata untuk kolom DateTime seperti Transaction.paidAt.
    instantStart: new Date(`${dateKey}T00:00:00.000+07:00`),
    monthStart: new Date(`${values.year}-${values.month}-01T00:00:00.000+07:00`),
  };
}

function getJakartaDateKey(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function toIso(value) {
  return value?.toISOString?.() ?? value ?? null;
}

function scopedSubscriptionWhere(scope) {
  if (!scope) return {};

  return {
    OR: [
      { program: scope },
      { program: 'PRIVATE', student: { level: scope } },
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

function effectiveScheduleWhere(dateOnlyStart) {
  return {
    AND: [
      {
        OR: [
          { effectiveStartDate: null },
          { effectiveStartDate: { lte: dateOnlyStart } },
        ],
      },
      {
        OR: [
          { effectiveEndDate: null },
          { effectiveEndDate: { gte: dateOnlyStart } },
        ],
      },
    ],
  };
}

function mapSchedule(schedule) {
  return {
    id: schedule.id,
    title: schedule.title,
    program: schedule.program,
    programLabel: getProgramDisplayName(schedule.program),
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    capacity: schedule.capacity,
    poolName: schedule.trainingVenue?.name ?? schedule.poolName,
    lane: schedule.lane ?? '',
    coaches: (schedule.assignments ?? [])
      .map((assignment) => assignment.coach?.name)
      .filter(Boolean),
  };
}

async function getBusinessOverview(currentUser, context) {
  const scope = getProgramScope(currentUser);
  const studentWhere = scope ? { level: scope } : {};
  const transactionScopeWhere = scopedTransactionWhere(scope);
  const subscriptionScopeWhere = scopedSubscriptionWhere(scope);
  const sevenDayStart = addDays(context.instantStart, -6);
  const expiryEnd = addDays(context.dateOnlyStart, 8);

  const [
    activeStudentCount,
    pendingStudentCount,
    monthlyRevenue,
    todayRevenue,
    pendingPaymentAggregate,
    expiringSubscriptionCount,
    newLeadCount,
    studentsByLevel,
    trendTransactions,
    expiringSubscriptions,
    recentTransactions,
    todaySchedules,
    latestStudents,
  ] = await Promise.all([
    prisma.student.count({ where: { ...studentWhere, status: 'ACTIVE' } }),
    prisma.student.count({ where: { ...studentWhere, status: 'PENDING' } }),
    prisma.transaction.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: context.monthStart },
        ...transactionScopeWhere,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: context.instantStart },
        ...transactionScopeWhere,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: 'PENDING', ...transactionScopeWhere },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.subscription.count({
      where: {
        status: { in: ['ACTIVE', 'PENDING'] },
        expiresAt: { gte: context.dateOnlyStart, lt: expiryEnd },
        ...subscriptionScopeWhere,
      },
    }),
    canAccessFeature(currentUser.role, 'marketing')
      ? prisma.lead.count({ where: { status: 'NEW' } })
      : 0,
    prisma.student.groupBy({
      by: ['level'],
      where: { ...studentWhere, status: 'ACTIVE' },
      _count: { _all: true },
    }),
    prisma.transaction.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: sevenDayStart },
        ...transactionScopeWhere,
      },
      select: { paidAt: true, amount: true },
      orderBy: { paidAt: 'asc' },
    }),
    prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'PENDING'] },
        expiresAt: { gte: context.dateOnlyStart, lt: expiryEnd },
        ...subscriptionScopeWhere,
      },
      orderBy: [{ expiresAt: 'asc' }, { createdAt: 'desc' }],
      take: 6,
      select: {
        id: true,
        packageName: true,
        program: true,
        expiresAt: true,
        remainingSessions: true,
        status: true,
        student: { select: { name: true } },
      },
    }),
    prisma.transaction.findMany({
      where: transactionScopeWhere,
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      take: 6,
      select: {
        id: true,
        invoiceNumber: true,
        description: true,
        amount: true,
        status: true,
        paymentMethod: true,
        paidAt: true,
        createdAt: true,
        student: { select: { name: true } },
      },
    }),
    prisma.schedule.findMany({
      where: {
        status: 'ACTIVE',
        dayOfWeek: context.dayOfWeek,
        ...(scope ? { program: scope } : {}),
        ...effectiveScheduleWhere(context.dateOnlyStart),
      },
      orderBy: [{ startTime: 'asc' }, { title: 'asc' }],
      take: 6,
      select: {
        id: true,
        title: true,
        program: true,
        startTime: true,
        endTime: true,
        capacity: true,
        poolName: true,
        lane: true,
        trainingVenue: { select: { name: true } },
        assignments: {
          where: {
            slotId: null,
            status: { in: ACTIVE_ASSIGNMENT_STATUSES },
          },
          select: { coach: { select: { name: true } } },
        },
      },
    }),
    prisma.student.findMany({
      where: studentWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        age: true,
        level: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const revenueByDate = new Map();
  trendTransactions.forEach((transaction) => {
    if (!transaction.paidAt) return;
    const dateKey = getJakartaDateKey(transaction.paidAt);
    revenueByDate.set(
      dateKey,
      (revenueByDate.get(dateKey) ?? 0) + transaction.amount
    );
  });

  const revenueTrend = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(context.dateOnlyStart, index - 6);
    const dateKey = date.toISOString().slice(0, 10);

    return {
      dateKey,
      label: new Intl.DateTimeFormat('id-ID', {
        timeZone: 'UTC',
        weekday: 'short',
      }).format(date),
      amount: revenueByDate.get(dateKey) ?? 0,
    };
  });

  const levelCounts = Object.fromEntries(
    studentsByLevel.map((item) => [item.level, item._count._all])
  );

  return {
    scope,
    scopeLabel: scope ? getProgramDisplayName(scope) : 'Semua Program',
    stats: {
      activeStudentCount,
      pendingStudentCount,
      monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
      todayRevenue: todayRevenue._sum.amount ?? 0,
      pendingPaymentCount: pendingPaymentAggregate._count._all ?? 0,
      pendingPaymentAmount: pendingPaymentAggregate._sum.amount ?? 0,
      expiringSubscriptionCount,
      pendingCount: canAccessFeature(currentUser.role, 'marketing') ? newLeadCount : null,
    },
    revenueTrend,
    studentsByLevel: ['AAA', 'A3', 'SWDC'].map((level) => ({
      level,
      label: getProgramDisplayName(level),
      count: levelCounts[level] ?? 0,
    })),
    expiringSubscriptions: expiringSubscriptions.map((subscription) => ({
      id: subscription.id,
      studentName: subscription.student?.name ?? 'Siswa',
      packageName: subscription.packageName,
      programLabel: getProgramDisplayName(subscription.program),
      expiresAt: toIso(subscription.expiresAt),
      remainingSessions: subscription.remainingSessions,
      status: subscription.status,
    })),
    recentTransactions: recentTransactions.map((transaction) => ({
      id: transaction.id,
      invoiceNumber: transaction.invoiceNumber,
      description: transaction.description,
      studentName: transaction.student?.name ?? 'Tanpa siswa',
      amount: transaction.amount,
      status: transaction.status,
      paymentMethodLabel:
        transactionMethodLabels[transaction.paymentMethod] ??
        transaction.paymentMethod,
      occurredAt: toIso(transaction.paidAt ?? transaction.createdAt),
    })),
    todaySchedules: todaySchedules.map(mapSchedule),
    latestStudents: latestStudents.map((student) => ({
      ...student,
      levelLabel: getProgramDisplayName(student.level),
      createdAt: toIso(student.createdAt),
    })),
  };
}

async function getCoachOverview(currentUser, context) {
  const [todaySchedules, assignmentCount, draftReportCount, draftReports, candidateSlots] =
    await Promise.all([
      prisma.schedule.findMany({
        where: {
          status: 'ACTIVE',
          dayOfWeek: context.dayOfWeek,
          ...effectiveScheduleWhere(context.dateOnlyStart),
          assignments: {
            some: {
              slotId: null,
              coachId: currentUser.id,
              status: { in: ACTIVE_ASSIGNMENT_STATUSES },
            },
          },
        },
        orderBy: [{ startTime: 'asc' }, { title: 'asc' }],
        take: 8,
        select: {
          id: true,
          title: true,
          program: true,
          startTime: true,
          endTime: true,
          capacity: true,
          poolName: true,
          lane: true,
          trainingVenue: { select: { name: true } },
          assignments: {
            where: {
              slotId: null,
              status: { in: ACTIVE_ASSIGNMENT_STATUSES },
            },
            select: { coach: { select: { name: true } } },
          },
        },
      }),
      prisma.coachAssignment.count({
        where: {
          slotId: null,
          coachId: currentUser.id,
          status: { in: ACTIVE_ASSIGNMENT_STATUSES },
          schedule: { status: 'ACTIVE' },
        },
      }),
      prisma.studentReport.count({
        where: { coachId: currentUser.id, status: 'DRAFT' },
      }),
      prisma.studentReport.findMany({
        where: { coachId: currentUser.id, status: 'DRAFT' },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          periodLabel: true,
          level: true,
          updatedAt: true,
          student: { select: { name: true } },
        },
      }),
      prisma.slot.findMany({
        where: {
          startsAt: {
            gte: context.dateOnlyStart,
            lt: addDays(context.dateOnlyStart, 30),
          },
          schedule: { program: 'PRIVATE', status: 'ACTIVE' },
          bookings: { some: { status: 'CONFIRMED' } },
        },
        orderBy: { startsAt: 'asc' },
        take: 50,
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          schedule: {
            select: {
              title: true,
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
            select: { student: { select: { name: true } } },
          },
        },
      }),
    ]);

  const upcomingPrivateSessions = candidateSlots
    .filter((slot) => {
      const effectiveAssignments = slot.coachAssignments.length
        ? slot.coachAssignments
        : slot.schedule.assignments;
      return effectiveAssignments.some(
        (assignment) => assignment.coachId === currentUser.id
      );
    })
    .slice(0, 6)
    .map((slot) => ({
      id: slot.id,
      title: slot.schedule.title,
      studentName: slot.bookings[0]?.student?.name ?? 'Siswa Private',
      startsAt: toIso(slot.startsAt),
      endsAt: toIso(slot.endsAt),
      poolName: slot.schedule.poolName,
    }));

  return {
    stats: {
      classesToday: todaySchedules.length,
      activeAssignmentCount: assignmentCount,
      draftReportCount,
      upcomingPrivateCount: upcomingPrivateSessions.length,
    },
    todaySchedules: todaySchedules.map(mapSchedule),
    draftReports: draftReports.map((report) => ({
      id: report.id,
      studentName: report.student?.name ?? 'Siswa',
      periodLabel: report.periodLabel,
      levelLabel: getProgramDisplayName(report.level),
      updatedAt: toIso(report.updatedAt),
    })),
    upcomingPrivateSessions,
  };
}

async function getStudentOverview(currentUser, context) {
  const student = await prisma.student.findUnique({
    where: { userId: currentUser.id },
    select: {
      id: true,
      name: true,
      age: true,
      level: true,
      status: true,
    },
  });

  if (!student) {
    return {
      profile: null,
      activeSubscription: null,
      upcomingBookings: [],
      levelSchedulesToday: [],
      latestReport: null,
      pendingTransactions: [],
      stats: {
        upcomingBookingCount: 0,
        publishedReportCount: 0,
        pendingPaymentCount: 0,
      },
    };
  }

  const [
    activeSubscription,
    upcomingBookings,
    levelSchedulesToday,
    latestReport,
    publishedReportCount,
    pendingTransactions,
  ] = await Promise.all([
    prisma.subscription.findFirst({
      where: {
        studentId: student.id,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      orderBy: [{ expiresAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        packageName: true,
        program: true,
        startsAt: true,
        expiresAt: true,
        totalSessions: true,
        remainingSessions: true,
        status: true,
        poolName: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        studentId: student.id,
        status: 'CONFIRMED',
        slot: { startsAt: { gte: context.dateOnlyStart } },
      },
      orderBy: { slot: { startsAt: 'asc' } },
      take: 6,
      select: {
        id: true,
        slot: {
          select: {
            startsAt: true,
            endsAt: true,
            schedule: { select: { title: true, poolName: true } },
          },
        },
      },
    }),
    prisma.schedule.findMany({
      where: {
        status: 'ACTIVE',
        program: student.level,
        dayOfWeek: context.dayOfWeek,
        ...effectiveScheduleWhere(context.dateOnlyStart),
      },
      orderBy: { startTime: 'asc' },
      take: 6,
      select: {
        id: true,
        title: true,
        program: true,
        startTime: true,
        endTime: true,
        capacity: true,
        poolName: true,
        lane: true,
        trainingVenue: { select: { name: true } },
        assignments: {
          where: {
            slotId: null,
            status: { in: ACTIVE_ASSIGNMENT_STATUSES },
          },
          select: { coach: { select: { name: true } } },
        },
      },
    }),
    prisma.studentReport.findFirst({
      where: { studentId: student.id, status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        periodLabel: true,
        level: true,
        publishedAt: true,
        recommendation: true,
      },
    }),
    prisma.studentReport.count({
      where: { studentId: student.id, status: 'PUBLISHED' },
    }),
    prisma.transaction.findMany({
      where: { studentId: student.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        description: true,
        amount: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    profile: {
      ...student,
      levelLabel: getProgramDisplayName(student.level),
    },
    activeSubscription: activeSubscription
      ? {
          ...activeSubscription,
          programLabel: getProgramDisplayName(activeSubscription.program),
          startsAt: toIso(activeSubscription.startsAt),
          expiresAt: toIso(activeSubscription.expiresAt),
        }
      : null,
    upcomingBookings: upcomingBookings.map((booking) => ({
      id: booking.id,
      title: booking.slot.schedule.title,
      poolName: booking.slot.schedule.poolName,
      startsAt: toIso(booking.slot.startsAt),
      endsAt: toIso(booking.slot.endsAt),
    })),
    levelSchedulesToday: levelSchedulesToday.map(mapSchedule),
    latestReport: latestReport
      ? {
          ...latestReport,
          levelLabel: getProgramDisplayName(latestReport.level),
          publishedAt: toIso(latestReport.publishedAt),
        }
      : null,
    pendingTransactions: pendingTransactions.map((transaction) => ({
      ...transaction,
      createdAt: toIso(transaction.createdAt),
    })),
    stats: {
      upcomingBookingCount: upcomingBookings.length,
      publishedReportCount,
      pendingPaymentCount: pendingTransactions.length,
    },
  };
}

/**
 * Ringkasan Dashboard selalu dibaca dari MySQL dan disesuaikan dengan role
 * sesi. Tidak ada KPI, jadwal, transaksi, atau daftar siswa contoh di sini.
 */
export async function getDashboardOverview(currentUser) {
  const now = new Date();
  const context = getJakartaDateContext(now);
  const role = currentUser?.role;

  const [business, coach, student] = await Promise.all([
    isAdminLevel(role) ? getBusinessOverview(currentUser, context) : null,
    role === 'COACH' ? getCoachOverview(currentUser, context) : null,
    role === 'STUDENT' ? getStudentOverview(currentUser, context) : null,
  ]);

  return {
    role,
    dateKey: context.dateKey,
    generatedAt: now.toISOString(),
    business,
    coach,
    student,
  };
}
