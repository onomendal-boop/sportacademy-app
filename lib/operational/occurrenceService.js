import { isAdminLevel } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import {
  addDaysToDateKey,
  combineDateKeyAndTime,
  dayOfWeekFromDateKey,
  getWeekDateKeys,
  isDateWithinRange,
  timesOverlap,
} from './dateUtils';
import { OperationalError } from './routeHelpers';
import {
  assignmentSelect,
  coachSelect,
  mapAssignment,
  venueSelect,
} from './scheduleService';

const ROLE_PRIORITY = {
  LEAD: 0,
  ASSISTANT: 1,
  SUBSTITUTE: 2,
};

function normalizeWeekStart(dateKey) {
  const dayOfWeek = dayOfWeekFromDateKey(dateKey);
  const mondayIndex = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ].indexOf(dayOfWeek);

  return addDaysToDateKey(dateKey, -mondayIndex);
}

function pickAssignment(assignments = []) {
  return [...assignments].sort(
    (first, second) =>
      (ROLE_PRIORITY[first.role] ?? 99) - (ROLE_PRIORITY[second.role] ?? 99)
  )[0] ?? null;
}

function mapBooking(booking) {
  return {
    id: booking.id,
    slotId: booking.slotId,
    studentId: booking.studentId,
    studentName: booking.student?.name ?? '',
    studentLevel: booking.student?.level ?? '',
    status: booking.status,
    notes: booking.notes ?? '',
    bookedAt: booking.bookedAt.toISOString(),
  };
}

function mapOccurrence({ schedule, dateKey, viewer = null }) {
  const slot = (schedule.slots ?? []).find(
    (item) => item.startsAt.toISOString().slice(0, 10) === dateKey
  );

  const rawBookings = (slot?.bookings ?? []).map(mapBooking);
  const bookedCount =
    rawBookings.length > 0 ? rawBookings.length : slot?.bookedCount ?? 0;
  const capacity = slot?.capacity ?? schedule.capacity;

  const slotAssignment = pickAssignment(slot?.coachAssignments ?? []);
  const recurringAssignment = pickAssignment(schedule.assignments ?? []);
  const effectiveAssignment = slotAssignment
    ? mapAssignment(slotAssignment, 'SLOT')
    : recurringAssignment
      ? mapAssignment(recurringAssignment, 'RECURRING')
      : null;

  // Kapasitas selalu dihitung dari seluruh booking, tetapi identitas
  // siswa pada slot Private hanya dibuka kepada pengelola bisnis,
  // pelatih yang ditugaskan pada slot itu, atau siswa pemilik booking.
  const canSeeAllBookings = !viewer || isAdminLevel(viewer.role);
  const isAssignedToViewer =
    viewer?.role === 'COACH' &&
    Boolean(viewer.userId) &&
    effectiveAssignment?.coachId === viewer.userId;
  const visibleBookings =
    canSeeAllBookings || isAssignedToViewer
      ? rawBookings
      : viewer?.role === 'STUDENT'
        ? rawBookings.filter((booking) => booking.studentId === viewer.studentId)
        : [];
  const viewerBooking = viewer?.studentId
    ? (rawBookings.find((booking) => booking.studentId === viewer.studentId) ?? null)
    : null;

  const startTime = slot
    ? slot.startsAt.toISOString().slice(11, 16)
    : schedule.startTime;
  const endTime = slot
    ? slot.endsAt.toISOString().slice(11, 16)
    : schedule.endTime;

  let slotStatus = slot?.status ?? 'OPEN';
  if (slotStatus === 'OPEN' && bookedCount >= capacity) slotStatus = 'FULL';

  return {
    occurrenceId: `${schedule.id}:${dateKey}`,
    scheduleId: schedule.id,
    slotId: slot?.id ?? null,
    date: dateKey,
    dateKey,
    dayOfWeek: schedule.dayOfWeek,
    title: schedule.title,
    groupName: schedule.title,
    program: schedule.program,
    startTime,
    endTime,
    capacity,
    bookedCount,
    remaining: Math.max(0, capacity - bookedCount),
    slotStatus,
    trainingVenueId: schedule.trainingVenueId ?? '',
    trainingVenue: schedule.trainingVenue
      ? {
          id: schedule.trainingVenue.id,
          name: schedule.trainingVenue.name,
          location: schedule.trainingVenue.location,
          status: schedule.trainingVenue.status,
          imageUrl: schedule.trainingVenue.imageUrl ?? '',
        }
      : null,
    venueName: schedule.trainingVenue?.name ?? schedule.poolName,
    poolName: schedule.poolName,
    lane: schedule.lane ?? '',
    notes: slot?.notes ?? schedule.notes ?? '',
    assignment: effectiveAssignment,
    coach: effectiveAssignment?.coach ?? null,
    coachId: effectiveAssignment?.coachId ?? null,
    coachRole: effectiveAssignment?.role ?? 'LEAD',
    bookings: visibleBookings,
    bookedStudent: visibleBookings[0]
      ? {
          id: visibleBookings[0].studentId,
          bookingId: visibleBookings[0].id,
          name: visibleBookings[0].studentName,
          level: visibleBookings[0].studentLevel,
          notes: visibleBookings[0].notes,
        }
      : null,
    isAssignedToViewer,
    hasViewerBooking: Boolean(viewerBooking),
    viewerBookingId: viewerBooking?.id ?? null,
  };
}

export async function getWeeklyOccurrences({ program, weekStart, viewer = null }) {
  const normalizedWeekStart = normalizeWeekStart(weekStart);
  const weekDateKeys = getWeekDateKeys(normalizedWeekStart);
  const rangeStart = combineDateKeyAndTime(normalizedWeekStart, '00:00');
  const rangeEnd = combineDateKeyAndTime(
    addDaysToDateKey(normalizedWeekStart, 7),
    '00:00'
  );

  const schedules = await prisma.schedule.findMany({
    where: {
      status: 'ACTIVE',
      ...(program ? { program } : {}),
    },
    select: {
      id: true,
      title: true,
      program: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      capacity: true,
      trainingVenueId: true,
      trainingVenue: { select: venueSelect },
      poolName: true,
      lane: true,
      notes: true,
      effectiveStartDate: true,
      effectiveEndDate: true,
      assignments: {
        where: {
          slotId: null,
          status: { in: ['ASSIGNED', 'CONFIRMED'] },
        },
        select: assignmentSelect,
      },
      slots: {
        where: {
          startsAt: {
            gte: rangeStart,
            lt: rangeEnd,
          },
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          capacity: true,
          bookedCount: true,
          status: true,
          notes: true,
          coachAssignments: {
            where: {
              status: { in: ['ASSIGNED', 'CONFIRMED'] },
            },
            select: assignmentSelect,
          },
          bookings: {
            where: { status: 'CONFIRMED' },
            select: {
              id: true,
              slotId: true,
              studentId: true,
              status: true,
              notes: true,
              bookedAt: true,
              student: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                },
              },
            },
            orderBy: { bookedAt: 'asc' },
          },
        },
        orderBy: { startsAt: 'asc' },
      },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }, { title: 'asc' }],
  });

  const occurrences = [];

  for (const schedule of schedules) {
    for (const dateKey of weekDateKeys) {
      if (dayOfWeekFromDateKey(dateKey) !== schedule.dayOfWeek) continue;

      const effectiveStart = schedule.effectiveStartDate
        ? schedule.effectiveStartDate.toISOString().slice(0, 10)
        : null;
      const effectiveEnd = schedule.effectiveEndDate
        ? schedule.effectiveEndDate.toISOString().slice(0, 10)
        : null;

      if (!isDateWithinRange(dateKey, effectiveStart, effectiveEnd)) continue;

      occurrences.push(mapOccurrence({ schedule, dateKey, viewer }));
    }
  }

  return occurrences.sort((first, second) => {
    if (first.dateKey !== second.dateKey) {
      return first.dateKey.localeCompare(second.dateKey);
    }
    if (first.startTime !== second.startTime) {
      return first.startTime.localeCompare(second.startTime);
    }
    return first.title.localeCompare(second.title);
  });
}

async function getScheduleForOccurrence(scheduleId, dateKey) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    select: {
      id: true,
      title: true,
      program: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      capacity: true,
      status: true,
      effectiveStartDate: true,
      effectiveEndDate: true,
    },
  });

  if (!schedule) {
    throw new OperationalError(404, 'NOT_FOUND', 'Jadwal tidak ditemukan.');
  }

  if (schedule.status !== 'ACTIVE') {
    throw new OperationalError(
      409,
      'SCHEDULE_INACTIVE',
      'Jadwal tidak aktif sehingga slot tanggal ini tidak dapat diubah.'
    );
  }

  if (dayOfWeekFromDateKey(dateKey) !== schedule.dayOfWeek) {
    throw new OperationalError(
      400,
      'DATE_DAY_MISMATCH',
      'Tanggal slot tidak sesuai dengan hari jadwal mingguan.'
    );
  }

  const effectiveStart = schedule.effectiveStartDate
    ? schedule.effectiveStartDate.toISOString().slice(0, 10)
    : null;
  const effectiveEnd = schedule.effectiveEndDate
    ? schedule.effectiveEndDate.toISOString().slice(0, 10)
    : null;

  if (!isDateWithinRange(dateKey, effectiveStart, effectiveEnd)) {
    throw new OperationalError(
      400,
      'DATE_OUT_OF_RANGE',
      'Tanggal slot berada di luar periode jadwal.'
    );
  }

  return schedule;
}

async function getActiveCoachOrThrow(coachId) {
  const coach = await prisma.user.findFirst({
    where: {
      id: coachId,
      role: 'COACH',
      isActive: true,
    },
    select: coachSelect,
  });

  if (!coach) {
    throw new OperationalError(
      404,
      'COACH_NOT_FOUND',
      'Pelatih aktif tidak ditemukan.'
    );
  }

  return coach;
}

async function assertCoachAvailableOnDate(schedule, dateKey, coachId) {
  const dayStart = combineDateKeyAndTime(dateKey, '00:00');
  const nextDayStart = combineDateKeyAndTime(
    addDaysToDateKey(dateKey, 1),
    '00:00'
  );

  const candidates = await prisma.schedule.findMany({
    where: {
      id: { not: schedule.id },
      status: 'ACTIVE',
      dayOfWeek: schedule.dayOfWeek,
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      effectiveStartDate: true,
      effectiveEndDate: true,
      assignments: {
        where: {
          slotId: null,
          status: { in: ['ASSIGNED', 'CONFIRMED'] },
        },
        select: { coachId: true },
      },
      slots: {
        where: {
          startsAt: {
            gte: dayStart,
            lt: nextDayStart,
          },
        },
        select: {
          coachAssignments: {
            where: {
              status: { in: ['ASSIGNED', 'CONFIRMED'] },
            },
            select: { coachId: true },
          },
        },
        orderBy: { startsAt: 'asc' },
        take: 1,
      },
    },
  });

  for (const candidate of candidates) {
    const effectiveStart = candidate.effectiveStartDate
      ? candidate.effectiveStartDate.toISOString().slice(0, 10)
      : null;
    const effectiveEnd = candidate.effectiveEndDate
      ? candidate.effectiveEndDate.toISOString().slice(0, 10)
      : null;

    if (!isDateWithinRange(dateKey, effectiveStart, effectiveEnd)) continue;

    if (
      !timesOverlap(
        schedule.startTime,
        schedule.endTime,
        candidate.startTime,
        candidate.endTime
      )
    ) {
      continue;
    }

    const slotAssignments = candidate.slots[0]?.coachAssignments ?? [];
    const effectiveAssignments = slotAssignments.length
      ? slotAssignments
      : candidate.assignments;

    if (
      effectiveAssignments.some((assignment) => assignment.coachId === coachId)
    ) {
      throw new OperationalError(
        409,
        'COACH_DATE_CONFLICT',
        `Pelatih sudah ditugaskan pada jadwal ${candidate.title} di tanggal dan jam yang sama.`
      );
    }
  }
}

async function ensureSlot(tx, schedule, dateKey) {
  const startsAt = combineDateKeyAndTime(dateKey, schedule.startTime);
  const endsAt = combineDateKeyAndTime(dateKey, schedule.endTime);

  const existing = await tx.slot.findUnique({
    where: {
      scheduleId_startsAt: {
        scheduleId: schedule.id,
        startsAt,
      },
    },
  });

  if (existing) return existing;

  // Jika jam template pernah berubah, cari slot pada tanggal yang sama
  // agar tidak membuat dua occurrence untuk satu jadwal/tanggal.
  const sameDateSlot = await tx.slot.findFirst({
    where: {
      scheduleId: schedule.id,
      startsAt: {
        gte: combineDateKeyAndTime(dateKey, '00:00'),
        lt: combineDateKeyAndTime(addDaysToDateKey(dateKey, 1), '00:00'),
      },
    },
    orderBy: { startsAt: 'asc' },
  });

  if (sameDateSlot) return sameDateSlot;

  return tx.slot.create({
    data: {
      scheduleId: schedule.id,
      startsAt,
      endsAt,
      capacity: schedule.capacity,
      bookedCount: 0,
      status: 'OPEN',
    },
  });
}

async function findOccurrence(scheduleId, dateKey, program, viewer = null) {
  const occurrences = await getWeeklyOccurrences({
    program,
    weekStart: normalizeWeekStart(dateKey),
    viewer,
  });

  return (
    occurrences.find(
      (item) => item.scheduleId === scheduleId && item.dateKey === dateKey
    ) ?? null
  );
}

export async function assignCoachToOccurrence({ scheduleId, date, coachId, role }) {
  const schedule = await getScheduleForOccurrence(scheduleId, date);
  await getActiveCoachOrThrow(coachId);

  await prisma.$transaction(async (tx) => {
    const slot = await ensureSlot(tx, schedule, date);

    await tx.coachAssignment.deleteMany({
      where: { slotId: slot.id },
    });

    await tx.coachAssignment.create({
      data: {
        scheduleId: schedule.id,
        slotId: slot.id,
        coachId,
        role,
        status: 'ASSIGNED',
      },
    });
  });

  return findOccurrence(scheduleId, date, schedule.program);
}

export async function removeCoachAssignmentFromOccurrence({ scheduleId, date }) {
  const schedule = await getScheduleForOccurrence(scheduleId, date);
  const startsAt = combineDateKeyAndTime(date, schedule.startTime);

  const slot = await prisma.slot.findFirst({
    where: {
      scheduleId,
      startsAt: {
        gte: combineDateKeyAndTime(date, '00:00'),
        lt: combineDateKeyAndTime(addDaysToDateKey(date, 1), '00:00'),
      },
    },
    orderBy: { startsAt: 'asc' },
  });

  if (slot) {
    await prisma.coachAssignment.deleteMany({
      where: { slotId: slot.id },
    });
  }

  return findOccurrence(scheduleId, date, schedule.program);
}

function toOccurrenceViewer(actor, studentId = null) {
  if (!actor) return null;

  return {
    role: actor.role,
    userId: actor.id,
    studentId,
  };
}

async function resolveActorStudentProfile(actor) {
  const profile = await prisma.student.findUnique({
    where: { userId: actor.id },
    select: { id: true, status: true },
  });

  if (!profile) {
    throw new OperationalError(
      404,
      'STUDENT_PROFILE_NOT_FOUND',
      'Akun Anda belum terhubung ke profil siswa. Hubungi admin akademi.'
    );
  }

  return profile;
}

export async function createPrivateBooking(data, actor = null) {
  let { scheduleId, date, studentId, coachId, notes } = data;

  // Siswa hanya boleh membuat booking untuk dirinya sendiri. Nilai
  // studentId dari client selalu ditimpa profil dari session.
  if (actor?.role === 'STUDENT') {
    const profile = await resolveActorStudentProfile(actor);

    if (profile.status !== 'ACTIVE') {
      throw new OperationalError(
        409,
        'STUDENT_INACTIVE',
        'Status siswa Anda tidak aktif sehingga belum dapat membuat booking.'
      );
    }

    studentId = profile.id;
  }

  const schedule = await getScheduleForOccurrence(scheduleId, date);

  if (schedule.program !== 'PRIVATE') {
    throw new OperationalError(
      400,
      'NOT_PRIVATE_SCHEDULE',
      'Booking langsung hanya tersedia untuk jadwal Private pada tahap ini.'
    );
  }

  await getActiveCoachOrThrow(coachId);
  await assertCoachAvailableOnDate(schedule, date, coachId);

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  if (!student) {
    throw new OperationalError(
      404,
      'STUDENT_NOT_FOUND',
      'Siswa aktif tidak ditemukan.'
    );
  }

  const targetStart = combineDateKeyAndTime(date, schedule.startTime);
  const targetEnd = combineDateKeyAndTime(date, schedule.endTime);
  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      studentId,
      status: 'CONFIRMED',
      slot: {
        startsAt: { lt: targetEnd },
        endsAt: { gt: targetStart },
      },
    },
    select: {
      id: true,
      slot: {
        select: {
          schedule: {
            select: { title: true },
          },
        },
      },
    },
  });

  if (overlappingBooking) {
    throw new OperationalError(
      409,
      'STUDENT_BOOKING_CONFLICT',
      `Siswa sudah memiliki booking pada jadwal ${overlappingBooking.slot.schedule.title} di jam yang sama.`
    );
  }

  await prisma.$transaction(async (tx) => {
    const slot = await ensureSlot(tx, schedule, date);

    const confirmedCount = await tx.booking.count({
      where: {
        slotId: slot.id,
        status: 'CONFIRMED',
      },
    });

    if (confirmedCount >= slot.capacity) {
      throw new OperationalError(
        409,
        'SLOT_FULL',
        'Slot Private pada tanggal ini sudah terbooking.'
      );
    }

    const sameStudent = await tx.booking.findFirst({
      where: {
        slotId: slot.id,
        studentId,
        status: 'CONFIRMED',
      },
      select: { id: true },
    });

    if (sameStudent) {
      throw new OperationalError(
        409,
        'STUDENT_ALREADY_BOOKED',
        'Siswa sudah terdaftar pada slot ini.'
      );
    }

    await tx.booking.create({
      data: {
        slotId: slot.id,
        studentId,
        status: 'CONFIRMED',
        notes,
      },
    });

    await tx.coachAssignment.deleteMany({
      where: { slotId: slot.id },
    });

    await tx.coachAssignment.create({
      data: {
        scheduleId: schedule.id,
        slotId: slot.id,
        coachId,
        role: 'LEAD',
        status: 'ASSIGNED',
      },
    });

    const nextBookedCount = confirmedCount + 1;

    await tx.slot.update({
      where: { id: slot.id },
      data: {
        bookedCount: nextBookedCount,
        status: nextBookedCount >= slot.capacity ? 'FULL' : 'OPEN',
      },
    });
  });

  return findOccurrence(
    scheduleId,
    date,
    schedule.program,
    toOccurrenceViewer(actor, studentId)
  );
}

export async function cancelPrivateBooking(bookingId, actor = null) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      studentId: true,
      status: true,
      slot: {
        select: {
          id: true,
          scheduleId: true,
          startsAt: true,
          capacity: true,
          status: true,
          schedule: {
            select: { program: true },
          },
        },
      },
    },
  });

  if (!booking) {
    throw new OperationalError(404, 'NOT_FOUND', 'Booking tidak ditemukan.');
  }

  let viewer = toOccurrenceViewer(actor);

  // Siswa hanya boleh membatalkan booking miliknya sendiri.
  if (actor?.role === 'STUDENT') {
    const profile = await resolveActorStudentProfile(actor);
    viewer = toOccurrenceViewer(actor, profile.id);

    if (booking.studentId !== profile.id) {
      throw new OperationalError(
        403,
        'FORBIDDEN_BOOKING',
        'Anda hanya dapat membatalkan booking milik sendiri.'
      );
    }
  }

  if (booking.status === 'CANCELLED') {
    return findOccurrence(
      booking.slot.scheduleId,
      booking.slot.startsAt.toISOString().slice(0, 10),
      booking.slot.schedule.program,
      viewer
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    const confirmedCount = await tx.booking.count({
      where: {
        slotId: booking.slot.id,
        status: 'CONFIRMED',
      },
    });

    await tx.slot.update({
      where: { id: booking.slot.id },
      data: {
        bookedCount: confirmedCount,
        status:
          booking.slot.status === 'FULL' && confirmedCount < booking.slot.capacity
            ? 'OPEN'
            : booking.slot.status,
      },
    });
  });

  return findOccurrence(
    booking.slot.scheduleId,
    booking.slot.startsAt.toISOString().slice(0, 10),
    booking.slot.schedule.program,
    viewer
  );
}
