import { prisma } from '@/lib/db/prisma';
import { timesOverlap } from './dateUtils';
import { OperationalError } from './routeHelpers';

const coachSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  profileImage: true,
  specialization: true,
  isActive: true,
};

const assignmentSelect = {
  id: true,
  scheduleId: true,
  slotId: true,
  coachId: true,
  role: true,
  status: true,
  notes: true,
  coach: {
    select: coachSelect,
  },
};

const venueSelect = {
  id: true,
  name: true,
  location: true,
  depth: true,
  capacity: true,
  status: true,
  imageUrl: true,
};

export const scheduleSelect = {
  id: true,
  title: true,
  program: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  capacity: true,
  trainingVenueId: true,
  trainingVenue: {
    select: venueSelect,
  },
  poolName: true,
  lane: true,
  status: true,
  notes: true,
  effectiveStartDate: true,
  effectiveEndDate: true,
  assignments: {
    where: {
      slotId: null,
      status: { in: ['ASSIGNED', 'CONFIRMED'] },
    },
    select: assignmentSelect,
    orderBy: { role: 'asc' },
  },
  _count: {
    select: {
      slots: true,
      assignments: true,
    },
  },
  createdAt: true,
  updatedAt: true,
};

function mapAssignment(assignment, source = 'RECURRING') {
  if (!assignment) return null;

  return {
    id: assignment.id,
    scheduleId: assignment.scheduleId,
    slotId: assignment.slotId ?? null,
    coachId: assignment.coachId,
    role: assignment.role,
    status: assignment.status,
    notes: assignment.notes ?? '',
    source,
    coach: assignment.coach
      ? {
          id: assignment.coach.id,
          name: assignment.coach.name,
          username: assignment.coach.username,
          email: assignment.coach.email,
          profileImage: assignment.coach.profileImage ?? '',
          specialization: assignment.coach.specialization ?? '',
          isActive: assignment.coach.isActive,
        }
      : null,
  };
}

export function mapSchedule(schedule) {
  const assignments = (schedule.assignments ?? []).map((assignment) =>
    mapAssignment(assignment, 'RECURRING')
  );
  const leadAssignment =
    assignments.find((assignment) => assignment.role === 'LEAD') ??
    assignments[0] ??
    null;

  return {
    id: schedule.id,
    title: schedule.title,
    groupName: schedule.title,
    program: schedule.program,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    capacity: schedule.capacity,
    trainingVenueId: schedule.trainingVenueId ?? '',
    trainingVenue: schedule.trainingVenue
      ? {
          id: schedule.trainingVenue.id,
          name: schedule.trainingVenue.name,
          location: schedule.trainingVenue.location,
          depth: schedule.trainingVenue.depth,
          capacity: schedule.trainingVenue.capacity,
          status: schedule.trainingVenue.status,
          imageUrl: schedule.trainingVenue.imageUrl ?? '',
        }
      : null,
    venueName: schedule.trainingVenue?.name ?? schedule.poolName,
    poolName: schedule.poolName,
    lane: schedule.lane ?? '',
    status: schedule.status,
    notes: schedule.notes ?? '',
    effectiveStartDate: schedule.effectiveStartDate
      ? schedule.effectiveStartDate.toISOString().slice(0, 10)
      : '',
    effectiveEndDate: schedule.effectiveEndDate
      ? schedule.effectiveEndDate.toISOString().slice(0, 10)
      : '',
    assignments,
    leadAssignment,
    leadCoachId: leadAssignment?.coachId ?? '',
    slotCount: schedule._count?.slots ?? schedule.slots?.length ?? 0,
    assignmentCount:
      schedule._count?.assignments ?? schedule.assignments?.length ?? 0,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
  };
}

function toDateOnly(value) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function normalizeLane(value) {
  return String(value ?? '').trim().toLowerCase();
}

function rangesOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  const firstFrom = firstStart || '0000-01-01';
  const firstTo = firstEnd || '9999-12-31';
  const secondFrom = secondStart || '0000-01-01';
  const secondTo = secondEnd || '9999-12-31';

  return firstFrom <= secondTo && secondFrom <= firstTo;
}

async function getVenueOrThrow(trainingVenueId) {
  const venue = await prisma.pool.findUnique({
    where: { id: trainingVenueId },
    select: venueSelect,
  });

  if (!venue) {
    throw new OperationalError(
      404,
      'VENUE_NOT_FOUND',
      'Tempat latihan tidak ditemukan.'
    );
  }

  return venue;
}

async function getCoachOrThrow(coachId) {
  if (!coachId) return null;

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

async function assertNoScheduleConflicts(data, excludeScheduleId = null) {
  if (data.status !== 'ACTIVE') return;

  const candidates = await prisma.schedule.findMany({
    where: {
      dayOfWeek: data.dayOfWeek,
      status: 'ACTIVE',
      ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      trainingVenueId: true,
      lane: true,
      effectiveStartDate: true,
      effectiveEndDate: true,
      assignments: {
        where: {
          slotId: null,
          status: { in: ['ASSIGNED', 'CONFIRMED'] },
        },
        select: { coachId: true },
      },
    },
  });

  for (const candidate of candidates) {
    const datesOverlap = rangesOverlap(
      data.effectiveStartDate,
      data.effectiveEndDate,
      candidate.effectiveStartDate
        ? candidate.effectiveStartDate.toISOString().slice(0, 10)
        : null,
      candidate.effectiveEndDate
        ? candidate.effectiveEndDate.toISOString().slice(0, 10)
        : null
    );

    if (
      !datesOverlap ||
      !timesOverlap(
        data.startTime,
        data.endTime,
        candidate.startTime,
        candidate.endTime
      )
    ) {
      continue;
    }

    const sameVenue =
      data.trainingVenueId &&
      candidate.trainingVenueId === data.trainingVenueId;
    const candidateLane = normalizeLane(candidate.lane);
    const nextLane = normalizeLane(data.lane);
    const sameLane = !candidateLane || !nextLane || candidateLane === nextLane;

    if (sameVenue && sameLane) {
      throw new OperationalError(
        409,
        'SCHEDULE_VENUE_CONFLICT',
        `Tempat latihan dan jalur sudah digunakan oleh jadwal ${candidate.title} pada hari dan jam yang sama.`
      );
    }

    if (
      data.leadCoachId &&
      candidate.assignments.some(
        (assignment) => assignment.coachId === data.leadCoachId
      )
    ) {
      throw new OperationalError(
        409,
        'SCHEDULE_COACH_CONFLICT',
        `Pelatih sudah ditugaskan pada jadwal ${candidate.title} di hari dan jam yang sama.`
      );
    }
  }
}

function toScheduleWriteData(data, venue) {
  return {
    title: data.title,
    program: data.program,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    capacity: data.program === 'PRIVATE' ? 1 : data.capacity,
    trainingVenueId: venue.id,
    poolName: venue.name,
    lane: data.lane,
    status: data.status,
    notes: data.notes,
    effectiveStartDate: toDateOnly(data.effectiveStartDate),
    effectiveEndDate: toDateOnly(data.effectiveEndDate),
  };
}

export async function getSchedules() {
  const schedules = await prisma.schedule.findMany({
    select: scheduleSelect,
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' },
      { program: 'asc' },
      { title: 'asc' },
    ],
  });

  return schedules.map(mapSchedule);
}

export async function createSchedule(data) {
  const venue = await getVenueOrThrow(data.trainingVenueId);

  if (venue.status === 'MAINTENANCE' && data.status === 'ACTIVE') {
    throw new OperationalError(
      409,
      'VENUE_MAINTENANCE',
      'Tempat latihan sedang maintenance dan tidak dapat dipakai jadwal aktif.'
    );
  }

  await getCoachOrThrow(data.leadCoachId);
  await assertNoScheduleConflicts(data);

  const schedule = await prisma.schedule.create({
    data: {
      ...toScheduleWriteData(data, venue),
      ...(data.leadCoachId
        ? {
            assignments: {
              create: {
                coachId: data.leadCoachId,
                role: 'LEAD',
                status: 'ASSIGNED',
              },
            },
          }
        : {}),
    },
    select: scheduleSelect,
  });

  return mapSchedule(schedule);
}

export async function updateSchedule(id, data) {
  const existing = await prisma.schedule.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new OperationalError(404, 'NOT_FOUND', 'Jadwal tidak ditemukan.');
  }

  const venue = await getVenueOrThrow(data.trainingVenueId);

  if (venue.status === 'MAINTENANCE' && data.status === 'ACTIVE') {
    throw new OperationalError(
      409,
      'VENUE_MAINTENANCE',
      'Tempat latihan sedang maintenance dan tidak dapat dipakai jadwal aktif.'
    );
  }

  await getCoachOrThrow(data.leadCoachId);
  await assertNoScheduleConflicts(data, id);

  await prisma.$transaction(async (tx) => {
    await tx.schedule.update({
      where: { id },
      data: toScheduleWriteData(data, venue),
    });

    await tx.coachAssignment.deleteMany({
      where: {
        scheduleId: id,
        slotId: null,
        role: 'LEAD',
      },
    });

    if (data.leadCoachId) {
      await tx.coachAssignment.create({
        data: {
          scheduleId: id,
          coachId: data.leadCoachId,
          role: 'LEAD',
          status: 'ASSIGNED',
        },
      });
    }
  });

  const schedule = await prisma.schedule.findUnique({
    where: { id },
    select: scheduleSelect,
  });

  return mapSchedule(schedule);
}

export async function deleteSchedule(id) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    select: {
      id: true,
      _count: { select: { slots: true } },
    },
  });

  if (!schedule) {
    throw new OperationalError(404, 'NOT_FOUND', 'Jadwal tidak ditemukan.');
  }

  if (schedule._count.slots > 0) {
    throw new OperationalError(
      409,
      'SCHEDULE_HAS_SLOTS',
      'Jadwal sudah memiliki slot/booking sehingga tidak dapat dihapus. Nonaktifkan atau batalkan jadwal sebagai gantinya.'
    );
  }

  await prisma.schedule.delete({ where: { id } });
  return { ok: true };
}

export { assignmentSelect, coachSelect, mapAssignment, venueSelect };
