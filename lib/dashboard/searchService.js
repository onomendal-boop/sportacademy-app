import { prisma } from "@/lib/db/prisma";
import {
    canAccessFeature,
    getProgramScope,
    isAdminLevel,
} from "@/lib/auth/permissions";
import {
    DAY_LABELS,
    PROGRAM_CONFIG,
    PROGRAM_VALUES,
} from "@/lib/operational/constants";

const RESULT_LIMIT = 5;

function queryHref(path, params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {
            searchParams.set(key, String(value));
        }
    });

    const query = searchParams.toString();
    return query ? `${path}?${query}` : path;
}

function programLabel(program) {
    return PROGRAM_CONFIG[program]?.title ?? program ?? "-";
}

function inferPrograms(query) {
    const normalized = ` ${query.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
    const programs = [];

    if (
        normalized.includes(" aaa ") ||
        normalized.includes(" sport academy ")
    ) {
        programs.push("AAA");
    }
    if (normalized.includes(" a3 ")) programs.push("A3");
    if (normalized.includes(" swdc ") || normalized.includes(" swimmer ")) {
        programs.push("SWDC");
    }
    if (normalized.includes(" private ")) programs.push("PRIVATE");

    return programs;
}

function inferDays(query) {
    const normalized = query.toLowerCase();
    return Object.entries(DAY_LABELS)
        .filter(([, label]) => normalized.includes(label.toLowerCase()))
        .map(([value]) => value);
}

function scopedSubscriptionWhere(scope) {
    if (!scope) return {};

    return {
        OR: [
            { program: scope },
            { program: "PRIVATE", student: { is: { level: scope } } },
        ],
    };
}

function scopedTransactionWhere(scope) {
    if (!scope) return {};

    return {
        OR: [
            { program: scope },
            { program: "PRIVATE", student: { is: { level: scope } } },
            { program: null, student: { is: { level: scope } } },
        ],
    };
}

async function getStudentProfileId(user) {
    if (user.role !== "STUDENT") return null;

    const profile = await prisma.student.findUnique({
        where: { userId: user.id },
        select: { id: true },
    });

    return profile?.id ?? null;
}

function result(groupKey, groupLabel, type, record, title, subtitle, href) {
    return {
        id: `${type}:${record.id}`,
        groupKey,
        groupLabel,
        type,
        title,
        subtitle,
        href,
    };
}

async function searchStudents(user, query, inferredPrograms, invalidScope) {
    if (invalidScope || !canAccessFeature(user.role, "dataMasterStudents")) {
        return [];
    }

    const scope = getProgramScope(user);
    const inferredLevels = inferredPrograms.filter(
        (program) => program !== "PRIVATE",
    );

    const students = await prisma.student.findMany({
        where: {
            ...(scope ? { level: scope } : {}),
            OR: [
                { name: { contains: query } },
                { parentContact: { contains: query } },
                {
                    user: {
                        is: {
                            OR: [
                                { name: { contains: query } },
                                { username: { contains: query } },
                                { email: { contains: query } },
                            ],
                        },
                    },
                },
                ...(inferredLevels.length > 0
                    ? [{ level: { in: inferredLevels } }]
                    : []),
            ],
        },
        orderBy: { name: "asc" },
        take: RESULT_LIMIT,
        select: {
            id: true,
            name: true,
            age: true,
            level: true,
            status: true,
        },
    });

    return students.map((student) =>
        result(
            "students",
            "Siswa",
            "STUDENT",
            student,
            student.name,
            `${programLabel(student.level)} • ${student.age} tahun • ${student.status}`,
            queryHref("/dashboard/students", { q: student.name }),
        ),
    );
}

async function searchStaff(user, query) {
    if (!canAccessFeature(user.role, "dataMasterStaff")) return [];

    const staff = await prisma.staff.findMany({
        where: {
            OR: [
                { name: { contains: query } },
                { position: { contains: query } },
                { department: { contains: query } },
                { email: { contains: query } },
                { phone: { contains: query } },
            ],
        },
        orderBy: { name: "asc" },
        take: RESULT_LIMIT,
        select: {
            id: true,
            name: true,
            position: true,
            department: true,
            status: true,
        },
    });

    return staff.map((member) =>
        result(
            "staff",
            "Staff",
            "STAFF",
            member,
            member.name,
            `${member.position}${member.department ? ` • ${member.department}` : ""} • ${member.status}`,
            queryHref("/dashboard/data-master/staff", { q: member.name }),
        ),
    );
}

async function searchCoaches(user, query) {
    if (!canAccessFeature(user.role, "dataMasterCoaches")) return [];

    const coaches = await prisma.user.findMany({
        where: {
            role: "COACH",
            OR: [
                { name: { contains: query } },
                { username: { contains: query } },
                { email: { contains: query } },
                { phone: { contains: query } },
                { specialization: { contains: query } },
            ],
        },
        orderBy: { name: "asc" },
        take: RESULT_LIMIT,
        select: {
            id: true,
            name: true,
            specialization: true,
            isActive: true,
        },
    });

    return coaches.map((coach) =>
        result(
            "coaches",
            "Pelatih",
            "COACH",
            coach,
            coach.name,
            `${coach.specialization ?? "Pelatih Renang"} • ${coach.isActive ? "Aktif" : "Nonaktif"}`,
            queryHref("/dashboard/data-master/pelatih", { q: coach.name }),
        ),
    );
}

async function searchVenues(user, query) {
    if (!canAccessFeature(user.role, "dataMasterVenues")) return [];

    const venues = await prisma.pool.findMany({
        where: {
            OR: [
                { name: { contains: query } },
                { location: { contains: query } },
            ],
        },
        orderBy: { name: "asc" },
        take: RESULT_LIMIT,
        select: {
            id: true,
            name: true,
            location: true,
            status: true,
            capacity: true,
        },
    });

    return venues.map((venue) =>
        result(
            "venues",
            "Tempat Latihan",
            "VENUE",
            venue,
            venue.name,
            `${venue.location} • Kapasitas ${venue.capacity} • ${venue.status}`,
            queryHref("/dashboard/data-master/tempat-latihan", {
                q: venue.name,
            }),
        ),
    );
}

async function searchSchedules(user, query, inferredPrograms, invalidScope) {
    if (invalidScope) return [];

    const scope = getProgramScope(user);
    const allowedPrograms = scope ? [scope, "PRIVATE"] : [...PROGRAM_VALUES];
    const inferredDays = inferDays(query);

    const schedules = await prisma.schedule.findMany({
        where: {
            program: { in: allowedPrograms },
            OR: [
                { title: { contains: query } },
                { poolName: { contains: query } },
                { lane: { contains: query } },
                { notes: { contains: query } },
                {
                    trainingVenue: {
                        is: {
                            OR: [
                                { name: { contains: query } },
                                { location: { contains: query } },
                            ],
                        },
                    },
                },
                {
                    assignments: {
                        some: {
                            coach: { is: { name: { contains: query } } },
                        },
                    },
                },
                ...(inferredPrograms.length > 0
                    ? [{ program: { in: inferredPrograms } }]
                    : []),
                ...(inferredDays.length > 0
                    ? [{ dayOfWeek: { in: inferredDays } }]
                    : []),
            ],
        },
        orderBy: [
            { program: "asc" },
            { dayOfWeek: "asc" },
            { startTime: "asc" },
        ],
        take: RESULT_LIMIT,
        select: {
            id: true,
            title: true,
            program: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            poolName: true,
            status: true,
            assignments: {
                where: {
                    slotId: null,
                    status: { in: ["ASSIGNED", "CONFIRMED"] },
                },
                take: 2,
                select: {
                    coach: { select: { name: true } },
                },
            },
        },
    });

    const canOpenOverview = canAccessFeature(user.role, "operationalOverview");

    return schedules.map((schedule) => {
        const coachNames = schedule.assignments
            .map((assignment) => assignment.coach?.name)
            .filter(Boolean)
            .join(", ");
        const href =
            schedule.program !== "PRIVATE" && canOpenOverview
                ? queryHref("/dashboard/operasional/jadwal", {
                      q: schedule.title,
                  })
                : `/dashboard/schedule/${PROGRAM_CONFIG[schedule.program]?.slug ?? "private"}`;

        return result(
            "schedules",
            "Jadwal",
            "SCHEDULE",
            schedule,
            schedule.title,
            `${programLabel(schedule.program)} • ${DAY_LABELS[schedule.dayOfWeek] ?? schedule.dayOfWeek} ${schedule.startTime}–${schedule.endTime} • ${schedule.poolName}${coachNames ? ` • ${coachNames}` : ""}`,
            href,
        );
    });
}

async function searchReports(user, query, studentProfileId, invalidScope) {
    if (invalidScope) return [];

    const scope = getProgramScope(user);
    const ownershipWhere =
        user.role === "STUDENT"
            ? studentProfileId
                ? { studentId: studentProfileId, status: "PUBLISHED" }
                : { id: "__NO_STUDENT_PROFILE__" }
            : {};

    const reports = await prisma.studentReport.findMany({
        where: {
            ...ownershipWhere,
            ...(scope ? { level: scope } : {}),
            OR: [
                { periodLabel: { contains: query } },
                { student: { is: { name: { contains: query } } } },
                { coach: { is: { name: { contains: query } } } },
            ],
        },
        orderBy: { updatedAt: "desc" },
        take: RESULT_LIMIT,
        select: {
            id: true,
            level: true,
            periodLabel: true,
            status: true,
            student: { select: { name: true } },
            coach: { select: { name: true } },
        },
    });

    return reports.map((report) =>
        result(
            "reports",
            "Raport",
            "REPORT",
            report,
            `${report.student?.name ?? "Siswa"} • ${report.periodLabel}`,
            `${programLabel(report.level)} • ${report.status}${report.coach?.name ? ` • ${report.coach.name}` : ""}`,
            queryHref("/dashboard/operasional/raport", {
                q: report.student?.name ?? report.periodLabel,
            }),
        ),
    );
}

async function searchFinance(
    user,
    query,
    inferredPrograms,
    studentProfileId,
    invalidScope,
) {
    if (invalidScope)
        return { packages: [], subscriptions: [], transactions: [] };

    const isBusinessUser = canAccessFeature(user.role, "finance");
    const canOpenPackageCatalog = canAccessFeature(user.role, "marketing");
    const isStudentSelfSearch = user.role === "STUDENT" && studentProfileId;

    if (!isBusinessUser && !isStudentSelfSearch) {
        return { packages: [], subscriptions: [], transactions: [] };
    }

    const scope = getProgramScope(user);
    const packagePrograms = scope ? [scope, "PRIVATE"] : inferredPrograms;

    const [packages, subscriptions, transactions] = await Promise.all([
        isBusinessUser
            ? prisma.package.findMany({
                  where: {
                      ...(scope ? { program: { in: [scope, "PRIVATE"] } } : {}),
                      OR: [
                          { name: { contains: query } },
                          { description: { contains: query } },
                          { poolName: { contains: query } },
                          { durationLabel: { contains: query } },
                          ...(packagePrograms.length > 0
                              ? [{ program: { in: packagePrograms } }]
                              : []),
                      ],
                  },
                  orderBy: [{ program: "asc" }, { price: "asc" }],
                  take: RESULT_LIMIT,
                  select: {
                      id: true,
                      name: true,
                      program: true,
                      durationLabel: true,
                      price: true,
                      isActive: true,
                  },
              })
            : [],
        prisma.subscription.findMany({
            where: {
                ...(isBusinessUser
                    ? scopedSubscriptionWhere(scope)
                    : { studentId: studentProfileId }),
                OR: [
                    { packageName: { contains: query } },
                    { poolName: { contains: query } },
                    { student: { is: { name: { contains: query } } } },
                    ...(inferredPrograms.length > 0
                        ? [{ program: { in: inferredPrograms } }]
                        : []),
                ],
            },
            orderBy: { expiresAt: "desc" },
            take: RESULT_LIMIT,
            select: {
                id: true,
                packageName: true,
                program: true,
                status: true,
                expiresAt: true,
                student: { select: { name: true } },
            },
        }),
        prisma.transaction.findMany({
            where: {
                ...(isBusinessUser
                    ? scopedTransactionWhere(scope)
                    : { studentId: studentProfileId }),
                OR: [
                    { invoiceNumber: { contains: query } },
                    { description: { contains: query } },
                    { referenceNumber: { contains: query } },
                    { poolName: { contains: query } },
                    { student: { is: { name: { contains: query } } } },
                    { package: { is: { name: { contains: query } } } },
                    ...(inferredPrograms.length > 0
                        ? [{ program: { in: inferredPrograms } }]
                        : []),
                ],
            },
            orderBy: { createdAt: "desc" },
            take: RESULT_LIMIT,
            select: {
                id: true,
                invoiceNumber: true,
                description: true,
                amount: true,
                status: true,
                student: { select: { name: true } },
            },
        }),
    ]);

    const financeHref = (target, q) =>
        isBusinessUser
            ? queryHref("/dashboard/finance", {
                  tab:
                      target === "transactions"
                          ? "transactions"
                          : "subscriptions",
                  target,
                  q,
              })
            : "/dashboard/my-package";
    const packageHref = (q) =>
        canOpenPackageCatalog
            ? queryHref("/dashboard/marketing/packages", { q })
            : // Admin Finance dapat menemukan katalog untuk konteks pekerjaan,
              // tetapi diarahkan ke langganan terkait karena katalog dikelola
              // oleh Marketing.
              financeHref("subscriptions", q);

    return {
        packages: packages.map((pkg) =>
            result(
                "packages",
                "Paket",
                "PACKAGE",
                pkg,
                pkg.name,
                `${programLabel(pkg.program)} • ${pkg.durationLabel} • ${pkg.isActive ? "Aktif" : "Nonaktif"}`,
                packageHref(pkg.name),
            ),
        ),
        subscriptions: subscriptions.map((subscription) =>
            result(
                "subscriptions",
                "Langganan",
                "SUBSCRIPTION",
                subscription,
                `${subscription.student?.name ?? "Siswa"} • ${subscription.packageName}`,
                `${programLabel(subscription.program)} • ${subscription.status}`,
                financeHref(
                    "subscriptions",
                    subscription.student?.name ?? subscription.packageName,
                ),
            ),
        ),
        transactions: transactions.map((transaction) =>
            result(
                "transactions",
                "Transaksi",
                "TRANSACTION",
                transaction,
                transaction.invoiceNumber,
                `${transaction.student?.name ?? transaction.description} • ${transaction.status}`,
                financeHref("transactions", transaction.invoiceNumber),
            ),
        ),
    };
}

export async function searchDashboard(user, rawQuery) {
    const query =
        typeof rawQuery === "string" ? rawQuery.trim().slice(0, 80) : "";

    if (!user || query.length < 2) {
        return { query, groups: [], total: 0 };
    }

    const inferredPrograms = inferPrograms(query);
    const scope = getProgramScope(user);
    const invalidScope =
        user.role === "ADMIN" && !scope && isAdminLevel(user.role);
    const studentProfileId = await getStudentProfileId(user);

    const [students, staff, coaches, venues, schedules, reports, finance] =
        await Promise.all([
            searchStudents(user, query, inferredPrograms, invalidScope),
            searchStaff(user, query),
            searchCoaches(user, query),
            searchVenues(user, query),
            searchSchedules(user, query, inferredPrograms, invalidScope),
            searchReports(user, query, studentProfileId, invalidScope),
            searchFinance(
                user,
                query,
                inferredPrograms,
                studentProfileId,
                invalidScope,
            ),
        ]);

    const groupItems = [
        ["students", "Siswa", students],
        ["coaches", "Pelatih", coaches],
        ["staff", "Staff", staff],
        ["venues", "Tempat Latihan", venues],
        ["schedules", "Jadwal", schedules],
        ["reports", "Raport", reports],
        ["packages", "Paket", finance.packages],
        ["subscriptions", "Langganan", finance.subscriptions],
        ["transactions", "Transaksi", finance.transactions],
    ];

    const groups = groupItems
        .filter(([, , items]) => items.length > 0)
        .map(([key, label, items]) => ({ key, label, items }));

    return {
        query,
        groups,
        total: groups.reduce((total, group) => total + group.items.length, 0),
    };
}
