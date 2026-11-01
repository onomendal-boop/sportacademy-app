import {
    getProgramScope,
    hasGlobalProgramAccess,
} from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import {
    addDaysToDateKey,
    combineDateKeyAndTime,
    dayOfWeekFromDateKey,
    getWeekDateKeys,
    isDateWithinRange,
    timesOverlap,
} from "./dateUtils";
import {
    isPrismaTransactionConflictError,
    isPrismaUniqueConstraintError,
    OperationalError,
} from "./routeHelpers";
import {
    getAssignmentSelect,
    mapAssignment,
    venueSelect,
} from "./scheduleService";

const ROLE_PRIORITY = {
    LEAD: 0,
    ASSISTANT: 1,
    SUBSTITUTE: 2,
};

const BOOKABLE_SLOT_STATUSES = new Set(["OPEN", "FULL"]);
const TRANSACTION_MAX_ATTEMPTS = 3;

function normalizeWeekStart(dateKey) {
    const dayOfWeek = dayOfWeekFromDateKey(dateKey);
    const mondayIndex = [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
    ].indexOf(dayOfWeek);

    return addDaysToDateKey(dateKey, -mondayIndex);
}

function pickAssignment(assignments = []) {
    return (
        [...assignments].sort(
            (first, second) =>
                (ROLE_PRIORITY[first.role] ?? 99) -
                (ROLE_PRIORITY[second.role] ?? 99),
        )[0] ?? null
    );
}

function mapBooking(booking) {
    return {
        id: booking.id,
        slotId: booking.slotId,
        studentId: booking.studentId,
        studentName: booking.student?.name ?? "",
        studentLevel: booking.student?.level ?? "",
        status: booking.status,
        notes: booking.notes ?? "",
        bookedAt: booking.bookedAt.toISOString(),
    };
}

function mapOccurrence({ schedule, dateKey, viewer = null }) {
    const slot = (schedule.slots ?? []).find(
        (item) => item.startsAt.toISOString().slice(0, 10) === dateKey,
    );

    const rawBookings = (slot?.bookings ?? []).map(mapBooking);
    const bookedCount =
        rawBookings.length > 0 ? rawBookings.length : (slot?.bookedCount ?? 0);
    const capacity = slot?.capacity ?? schedule.capacity;

    const slotAssignment = pickAssignment(slot?.coachAssignments ?? []);
    const recurringAssignment = pickAssignment(schedule.assignments ?? []);
    // Mapper menerima viewer agar username/email pelatih tidak pernah
    // diserialisasi untuk STUDENT, COACH, atau pemanggil tanpa aktor.
    const effectiveAssignment = slotAssignment
        ? mapAssignment(slotAssignment, "SLOT", viewer)
        : recurringAssignment
          ? mapAssignment(recurringAssignment, "RECURRING", viewer)
          : null;

    // Kapasitas selalu dihitung dari seluruh booking, tetapi identitas
    // siswa hanya dibuka kepada pengelola yang berhak: Superadmin/Owner
    // global, admin pada programnya (Private mengikuti level siswa),
    // pelatih yang ditugaskan pada slot itu, atau siswa pemilik booking.
    const canSeeAllBookings = !viewer || hasGlobalProgramAccess(viewer);
    const viewerProgramScope = getProgramScope(viewer);
    const isAssignedToViewer =
        viewer?.role === "COACH" &&
        Boolean(viewer.userId) &&
        effectiveAssignment?.coachId === viewer.userId;
    const scopedAdminBookings =
        viewer?.role === "ADMIN"
            ? schedule.program === viewerProgramScope
                ? rawBookings
                : schedule.program === "PRIVATE"
                  ? rawBookings.filter(
                        (booking) =>
                            booking.studentLevel === viewerProgramScope,
                    )
                  : []
            : null;
    const visibleBookings =
        canSeeAllBookings || isAssignedToViewer
            ? rawBookings
            : (scopedAdminBookings ??
              (viewer?.role === "STUDENT"
                  ? rawBookings.filter(
                        (booking) => booking.studentId === viewer.studentId,
                    )
                  : []));
    const viewerBooking = viewer?.studentId
        ? (rawBookings.find(
              (booking) => booking.studentId === viewer.studentId,
          ) ?? null)
        : null;

    const startTime = slot
        ? slot.startsAt.toISOString().slice(11, 16)
        : schedule.startTime;
    const endTime = slot
        ? slot.endsAt.toISOString().slice(11, 16)
        : schedule.endTime;

    let slotStatus = slot?.status ?? "OPEN";
    if (slotStatus === "OPEN" && bookedCount >= capacity) slotStatus = "FULL";

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
        trainingVenueId: schedule.trainingVenueId ?? "",
        trainingVenue: schedule.trainingVenue
            ? {
                  id: schedule.trainingVenue.id,
                  name: schedule.trainingVenue.name,
                  location: schedule.trainingVenue.location,
                  status: schedule.trainingVenue.status,
                  imageUrl: schedule.trainingVenue.imageUrl ?? "",
              }
            : null,
        venueName: schedule.trainingVenue?.name ?? schedule.poolName,
        poolName: schedule.poolName,
        lane: schedule.lane ?? "",
        notes: slot?.notes ?? schedule.notes ?? "",
        assignment: effectiveAssignment,
        coach: effectiveAssignment?.coach ?? null,
        coachId: effectiveAssignment?.coachId ?? null,
        coachRole: effectiveAssignment?.role ?? "LEAD",
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

export async function getWeeklyOccurrences({
    program,
    weekStart,
    viewer = null,
}) {
    if (viewer?.role === "ADMIN") {
        const viewerScope = getProgramScope({
            role: viewer.role,
            programScope: viewer.programScope,
        });

        // Admin program hanya membaca kalender program kelompoknya sendiri.
        // Kalender Private tetap dapat dibaca karena slotnya dipakai bersama,
        // tetapi identitas booking di bawah difilter menurut level siswa.
        if (
            !viewerScope ||
            (program !== "PRIVATE" && program !== viewerScope)
        ) {
            throw new OperationalError(
                403,
                "FORBIDDEN_PROGRAM",
                "Akun admin program hanya dapat melihat jadwal programnya sendiri dan slot Private.",
            );
        }
    }

    const assignmentSelect = getAssignmentSelect(viewer);
    const normalizedWeekStart = normalizeWeekStart(weekStart);
    const weekDateKeys = getWeekDateKeys(normalizedWeekStart);
    const rangeStart = combineDateKeyAndTime(normalizedWeekStart, "00:00");
    const rangeEnd = combineDateKeyAndTime(
        addDaysToDateKey(normalizedWeekStart, 7),
        "00:00",
    );

    const schedules = await prisma.schedule.findMany({
        where: {
            status: "ACTIVE",
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
                    status: { in: ["ASSIGNED", "CONFIRMED"] },
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
                            status: { in: ["ASSIGNED", "CONFIRMED"] },
                        },
                        select: assignmentSelect,
                    },
                    bookings: {
                        where: { status: "CONFIRMED" },
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
                        orderBy: { bookedAt: "asc" },
                    },
                },
                orderBy: { startsAt: "asc" },
            },
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }, { title: "asc" }],
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

            if (!isDateWithinRange(dateKey, effectiveStart, effectiveEnd))
                continue;

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
        throw new OperationalError(404, "NOT_FOUND", "Jadwal tidak ditemukan.");
    }

    if (schedule.status !== "ACTIVE") {
        throw new OperationalError(
            409,
            "SCHEDULE_INACTIVE",
            "Jadwal tidak aktif sehingga slot tanggal ini tidak dapat diubah.",
        );
    }

    if (dayOfWeekFromDateKey(dateKey) !== schedule.dayOfWeek) {
        throw new OperationalError(
            400,
            "DATE_DAY_MISMATCH",
            "Tanggal slot tidak sesuai dengan hari jadwal mingguan.",
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
            "DATE_OUT_OF_RANGE",
            "Tanggal slot berada di luar periode jadwal.",
        );
    }

    return schedule;
}

async function getActiveCoachOrThrow(coachId) {
    const coach = await prisma.user.findFirst({
        where: {
            id: coachId,
            role: "COACH",
            isActive: true,
        },
        select: { id: true },
    });

    if (!coach) {
        throw new OperationalError(
            404,
            "COACH_NOT_FOUND",
            "Pelatih aktif tidak ditemukan.",
        );
    }

    return coach;
}

async function assertCoachAvailableOnDate(schedule, dateKey, coachId) {
    const dayStart = combineDateKeyAndTime(dateKey, "00:00");
    const nextDayStart = combineDateKeyAndTime(
        addDaysToDateKey(dateKey, 1),
        "00:00",
    );

    const candidates = await prisma.schedule.findMany({
        where: {
            id: { not: schedule.id },
            status: "ACTIVE",
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
                    status: { in: ["ASSIGNED", "CONFIRMED"] },
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
                            status: { in: ["ASSIGNED", "CONFIRMED"] },
                        },
                        select: { coachId: true },
                    },
                },
                orderBy: { startsAt: "asc" },
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
                candidate.endTime,
            )
        ) {
            continue;
        }

        const slotAssignments = candidate.slots[0]?.coachAssignments ?? [];
        const effectiveAssignments = slotAssignments.length
            ? slotAssignments
            : candidate.assignments;

        if (
            effectiveAssignments.some(
                (assignment) => assignment.coachId === coachId,
            )
        ) {
            throw new OperationalError(
                409,
                "COACH_DATE_CONFLICT",
                `Pelatih sudah ditugaskan pada jadwal ${candidate.title} di tanggal dan jam yang sama.`,
            );
        }
    }
}

async function findSlotForOccurrenceDate(client, schedule, dateKey, startsAt) {
    const exactSlot = await client.slot.findUnique({
        where: {
            scheduleId_startsAt: {
                scheduleId: schedule.id,
                startsAt,
            },
        },
    });

    if (exactSlot) return exactSlot;

    // Jika jam template pernah berubah, cari slot pada tanggal yang sama
    // agar tidak membuat dua occurrence untuk satu jadwal/tanggal.
    return client.slot.findFirst({
        where: {
            scheduleId: schedule.id,
            startsAt: {
                gte: combineDateKeyAndTime(dateKey, "00:00"),
                lt: combineDateKeyAndTime(
                    addDaysToDateKey(dateKey, 1),
                    "00:00",
                ),
            },
        },
        orderBy: { startsAt: "asc" },
    });
}

async function ensureSlot(client, schedule, dateKey) {
    const startsAt = combineDateKeyAndTime(dateKey, schedule.startTime);
    const endsAt = combineDateKeyAndTime(dateKey, schedule.endTime);

    const existing = await findSlotForOccurrenceDate(
        client,
        schedule,
        dateKey,
        startsAt,
    );

    if (existing) return existing;

    try {
        // Upsert membuat dua request yang bersamaan bertemu pada unique
        // (scheduleId, startsAt) yang sama, bukan sama-sama melakukan create
        // buta. Request yang kalah menerima baris yang sudah dibuat.
        return await client.slot.upsert({
            where: {
                scheduleId_startsAt: {
                    scheduleId: schedule.id,
                    startsAt,
                },
            },
            update: {},
            create: {
                scheduleId: schedule.id,
                startsAt,
                endsAt,
                capacity: schedule.capacity,
                bookedCount: 0,
                status: "OPEN",
            },
        });
    } catch (error) {
        if (!isPrismaUniqueConstraintError(error)) throw error;

        // Sebagian driver/versi Prisma tetap dapat melempar P2002 pada
        // perlombaan upsert. Baca ulang pemenang perlombaan tersebut;
        // jangan mengubah konflik yang dapat dipulihkan ini menjadi 500.
        const concurrentSlot = await findSlotForOccurrenceDate(
            client,
            schedule,
            dateKey,
            startsAt,
        );

        if (concurrentSlot) return concurrentSlot;
        throw error;
    }
}

async function runRetryableOperationalTransaction(callback) {
    let lastError;

    for (let attempt = 0; attempt < TRANSACTION_MAX_ATTEMPTS; attempt += 1) {
        try {
            return await prisma.$transaction(callback, {
                maxWait: 5000,
                timeout: 10000,
            });
        } catch (error) {
            lastError = error;

            const canRetry =
                isPrismaTransactionConflictError(error) ||
                isPrismaUniqueConstraintError(error);

            if (!canRetry || attempt === TRANSACTION_MAX_ATTEMPTS - 1) {
                throw error;
            }
        }
    }

    throw lastError;
}

async function lockSlotForUpdate(tx, slotId) {
    // Locking read ini harus menjadi operasi pertama transaksi booking.
    // Seluruh transaksi yang mengubah isi slot yang sama mengantre pada
    // baris Slot ini, sehingga count->create berikutnya tidak dapat
    // saling mendahului pada snapshot REPEATABLE READ yang sama.
    const rows = await tx.$queryRaw`
    SELECT
      id,
      schedule_id AS scheduleId,
      starts_at AS startsAt,
      ends_at AS endsAt,
      capacity,
      booked_count AS bookedCount,
      status,
      notes
    FROM slots
    WHERE id = ${slotId}
    FOR UPDATE
  `;

    const slot = rows[0];

    if (!slot) {
        throw new OperationalError(
            404,
            "NOT_FOUND",
            "Slot jadwal tidak ditemukan.",
        );
    }

    return {
        ...slot,
        startsAt:
            slot.startsAt instanceof Date
                ? slot.startsAt
                : new Date(slot.startsAt),
        endsAt:
            slot.endsAt instanceof Date ? slot.endsAt : new Date(slot.endsAt),
        capacity: Number(slot.capacity),
        bookedCount: Number(slot.bookedCount),
    };
}

function assertSlotBookable(slot) {
    if (slot.status === "CLOSED") {
        throw new OperationalError(
            409,
            "SLOT_CLOSED",
            "Slot Private pada tanggal ini sudah ditutup dan tidak dapat dibooking.",
        );
    }

    if (slot.status === "CANCELLED") {
        throw new OperationalError(
            409,
            "SLOT_CANCELLED",
            "Slot Private pada tanggal ini sudah dibatalkan dan tidak dapat dibooking.",
        );
    }

    if (!BOOKABLE_SLOT_STATUSES.has(slot.status)) {
        throw new OperationalError(
            409,
            "SLOT_NOT_BOOKABLE",
            "Slot Private pada tanggal ini tidak tersedia untuk dibooking.",
        );
    }
}

async function findOccurrence(scheduleId, dateKey, program, viewer = null) {
    const occurrences = await getWeeklyOccurrences({
        program,
        weekStart: normalizeWeekStart(dateKey),
        viewer,
    });

    return (
        occurrences.find(
            (item) =>
                item.scheduleId === scheduleId && item.dateKey === dateKey,
        ) ?? null
    );
}

function assertOccurrenceProgramAccess(actor, schedule) {
    if (actor?.role !== "ADMIN") return;

    if (schedule.program === "PRIVATE") {
        throw new OperationalError(
            403,
            "FORBIDDEN_PROGRAM",
            "Penugasan pelatih pada template Private dikelola secara global. Admin program memilih pelatih saat membuat booking untuk siswa pada levelnya.",
        );
    }

    if (getProgramScope(actor) !== schedule.program) {
        throw new OperationalError(
            403,
            "FORBIDDEN_PROGRAM",
            "Akun admin program hanya dapat menugaskan pelatih pada jadwal programnya sendiri.",
        );
    }
}

export async function assignCoachToOccurrence(
    { scheduleId, date, coachId, role },
    actor = null,
) {
    const schedule = await getScheduleForOccurrence(scheduleId, date);
    assertOccurrenceProgramAccess(actor, schedule);
    await getActiveCoachOrThrow(coachId);

    const slot = await ensureSlot(prisma, schedule, date);

    await runRetryableOperationalTransaction(async (tx) => {
        await lockSlotForUpdate(tx, slot.id);

        await tx.coachAssignment.deleteMany({
            where: { slotId: slot.id },
        });

        await tx.coachAssignment.create({
            data: {
                scheduleId: schedule.id,
                slotId: slot.id,
                coachId,
                role,
                status: "ASSIGNED",
            },
        });
    });

    return findOccurrence(
        scheduleId,
        date,
        schedule.program,
        toOccurrenceViewer(actor),
    );
}

export async function removeCoachAssignmentFromOccurrence(
    { scheduleId, date },
    actor = null,
) {
    const schedule = await getScheduleForOccurrence(scheduleId, date);
    assertOccurrenceProgramAccess(actor, schedule);
    const startsAt = combineDateKeyAndTime(date, schedule.startTime);

    const slot = await prisma.slot.findFirst({
        where: {
            scheduleId,
            startsAt: {
                gte: combineDateKeyAndTime(date, "00:00"),
                lt: combineDateKeyAndTime(addDaysToDateKey(date, 1), "00:00"),
            },
        },
        orderBy: { startsAt: "asc" },
    });

    if (slot) {
        await prisma.coachAssignment.deleteMany({
            where: { slotId: slot.id },
        });
    }

    return findOccurrence(
        scheduleId,
        date,
        schedule.program,
        toOccurrenceViewer(actor),
    );
}

function toOccurrenceViewer(actor, studentId = null) {
    if (!actor) return null;

    return {
        role: actor.role,
        userId: actor.id,
        studentId,
        programScope: actor.programScope ?? null,
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
            "STUDENT_PROFILE_NOT_FOUND",
            "Akun Anda belum terhubung ke profil siswa. Hubungi admin akademi.",
        );
    }

    return profile;
}

export async function createPrivateBooking(data, actor = null) {
    let { scheduleId, date, studentId, coachId, notes } = data;

    // Siswa hanya boleh membuat booking untuk dirinya sendiri. Nilai
    // studentId dari client selalu ditimpa profil dari session.
    if (actor?.role === "STUDENT") {
        const profile = await resolveActorStudentProfile(actor);

        if (profile.status !== "ACTIVE") {
            throw new OperationalError(
                409,
                "STUDENT_INACTIVE",
                "Status siswa Anda tidak aktif sehingga belum dapat membuat booking.",
            );
        }

        studentId = profile.id;
    }

    const schedule = await getScheduleForOccurrence(scheduleId, date);

    if (schedule.program !== "PRIVATE") {
        throw new OperationalError(
            400,
            "NOT_PRIVATE_SCHEDULE",
            "Booking langsung hanya tersedia untuk jadwal Private pada tahap ini.",
        );
    }

    await getActiveCoachOrThrow(coachId);
    await assertCoachAvailableOnDate(schedule, date, coachId);

    const student = await prisma.student.findFirst({
        where: {
            id: studentId,
            status: "ACTIVE",
        },
        select: { id: true, level: true },
    });

    if (!student) {
        throw new OperationalError(
            404,
            "STUDENT_NOT_FOUND",
            "Siswa aktif tidak ditemukan.",
        );
    }

    if (actor?.role === "ADMIN" && getProgramScope(actor) !== student.level) {
        throw new OperationalError(
            403,
            "FORBIDDEN_PROGRAM",
            "Admin program hanya dapat membuat booking Private untuk siswa pada levelnya sendiri.",
        );
    }

    const targetStart = combineDateKeyAndTime(date, schedule.startTime);
    const targetEnd = combineDateKeyAndTime(date, schedule.endTime);
    const overlappingBooking = await prisma.booking.findFirst({
        where: {
            studentId,
            status: "CONFIRMED",
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
            "STUDENT_BOOKING_CONFLICT",
            `Siswa sudah memiliki booking pada jadwal ${overlappingBooking.slot.schedule.title} di jam yang sama.`,
        );
    }

    const ensuredSlot = await ensureSlot(prisma, schedule, date);

    await runRetryableOperationalTransaction(async (tx) => {
        const slot = await lockSlotForUpdate(tx, ensuredSlot.id);
        assertSlotBookable(slot);

        // Count dilakukan sesudah lock baris Slot diperoleh. Transaksi
        // booking/pembatalan lain untuk slot ini harus menunggu lock yang
        // sama, jadi angka ini menjadi dasar reservasi yang atomik.
        const confirmedCount = await tx.booking.count({
            where: {
                slotId: slot.id,
                status: "CONFIRMED",
            },
        });

        if (confirmedCount >= slot.capacity) {
            throw new OperationalError(
                409,
                "SLOT_FULL",
                "Slot Private pada tanggal ini sudah terbooking.",
            );
        }

        const sameStudent = await tx.booking.findFirst({
            where: {
                slotId: slot.id,
                studentId,
                status: "CONFIRMED",
            },
            select: { id: true },
        });

        if (sameStudent) {
            throw new OperationalError(
                409,
                "STUDENT_ALREADY_BOOKED",
                "Siswa sudah terdaftar pada slot ini.",
            );
        }

        await tx.booking.create({
            data: {
                slotId: slot.id,
                studentId,
                status: "CONFIRMED",
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
                role: "LEAD",
                status: "ASSIGNED",
            },
        });

        const nextBookedCount = confirmedCount + 1;

        await tx.slot.update({
            where: { id: slot.id },
            data: {
                bookedCount: nextBookedCount,
                status: nextBookedCount >= slot.capacity ? "FULL" : "OPEN",
            },
        });
    });

    return findOccurrence(
        scheduleId,
        date,
        schedule.program,
        toOccurrenceViewer(actor, studentId),
    );
}

export async function cancelPrivateBooking(bookingId, actor = null) {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
            id: true,
            studentId: true,
            student: {
                select: { level: true },
            },
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
        throw new OperationalError(
            404,
            "NOT_FOUND",
            "Booking tidak ditemukan.",
        );
    }

    let viewer = toOccurrenceViewer(actor);

    if (
        actor?.role === "ADMIN" &&
        getProgramScope(actor) !== booking.student?.level
    ) {
        throw new OperationalError(
            403,
            "FORBIDDEN_PROGRAM",
            "Admin program hanya dapat membatalkan booking Private untuk siswa pada levelnya sendiri.",
        );
    }

    // Siswa hanya boleh membatalkan booking miliknya sendiri.
    if (actor?.role === "STUDENT") {
        const profile = await resolveActorStudentProfile(actor);
        viewer = toOccurrenceViewer(actor, profile.id);

        if (booking.studentId !== profile.id) {
            throw new OperationalError(
                403,
                "FORBIDDEN_BOOKING",
                "Anda hanya dapat membatalkan booking milik sendiri.",
            );
        }
    }

    if (booking.status === "CANCELLED") {
        return findOccurrence(
            booking.slot.scheduleId,
            booking.slot.startsAt.toISOString().slice(0, 10),
            booking.slot.schedule.program,
            viewer,
        );
    }

    await runRetryableOperationalTransaction(async (tx) => {
        const lockedSlot = await lockSlotForUpdate(tx, booking.slot.id);

        const cancelled = await tx.booking.updateMany({
            where: {
                id: bookingId,
                status: { not: "CANCELLED" },
            },
            data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
            },
        });

        if (!cancelled.count) return;

        const confirmedCount = await tx.booking.count({
            where: {
                slotId: lockedSlot.id,
                status: "CONFIRMED",
            },
        });

        await tx.slot.update({
            where: { id: lockedSlot.id },
            data: {
                bookedCount: confirmedCount,
                status:
                    lockedSlot.status === "FULL" &&
                    confirmedCount < lockedSlot.capacity
                        ? "OPEN"
                        : lockedSlot.status,
            },
        });
    });

    return findOccurrence(
        booking.slot.scheduleId,
        booking.slot.startsAt.toISOString().slice(0, 10),
        booking.slot.schedule.program,
        viewer,
    );
}
