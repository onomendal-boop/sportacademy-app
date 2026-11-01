import {
    getProgramScope,
    PERMANENT_DELETE_ROLES,
    REPORT_EDITOR_ROLES,
} from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { NEXT_STUDENT_LEVEL } from "./constants";
import { OperationalError } from "./routeHelpers";

// Service Raport Siswa (Grup Operasional).
// - Satu raport per siswa per label periode (unique di database).
// - Pelatih (COACH) hanya dapat menjadi penilai untuk dirinya sendiri
//   dan hanya dapat mengubah raport yang sudah dinilai oleh dirinya
//   sendiri; role manajemen mengikuti scope program masing-masing.
// - Menerbitkan raport dengan rekomendasi LEVEL_UP menaikkan level siswa
//   satu jenjang (AAA -> A3 -> SWDC) bila level siswa saat ini masih sama
//   dengan level snapshot raport.

const reportInclude = {
    student: {
        select: {
            id: true,
            name: true,
            age: true,
            parentContact: true,
            level: true,
            status: true,
        },
    },
    coach: {
        select: {
            id: true,
            name: true,
            specialization: true,
            profileImage: true,
        },
    },
    items: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    },
};

function toDateKey(value) {
    if (!value) return "";
    return value.toISOString().slice(0, 10);
}

function toDateOnly(value) {
    if (!value) return null;
    return new Date(`${value}T00:00:00.000Z`);
}

export function mapReport(report, promotedToLevel = null) {
    const items = (report.items ?? []).map((item) => ({
        id: item.id,
        competency: item.competency,
        score: item.score,
        note: item.note ?? "",
        sortOrder: item.sortOrder,
    }));

    const averageScore =
        items.length > 0
            ? Math.round(
                  (items.reduce((total, item) => total + item.score, 0) /
                      items.length) *
                      100,
              ) / 100
            : 0;

    const attendancePercent =
        report.sessionsAttended !== null &&
        report.sessionsAttended !== undefined &&
        report.totalSessions
            ? Math.round((report.sessionsAttended / report.totalSessions) * 100)
            : null;

    return {
        id: report.id,
        studentId: report.studentId,
        student: report.student ?? null,
        coachId: report.coachId ?? null,
        coach: report.coach
            ? {
                  id: report.coach.id,
                  name: report.coach.name,
                  specialization: report.coach.specialization ?? "",
                  profileImage: report.coach.profileImage ?? "",
              }
            : null,
        level: report.level,
        periodLabel: report.periodLabel,
        periodStart: toDateKey(report.periodStart),
        periodEnd: toDateKey(report.periodEnd),
        sessionsAttended: report.sessionsAttended ?? null,
        totalSessions: report.totalSessions ?? null,
        attendancePercent,
        coachNotes: report.coachNotes ?? "",
        recommendation: report.recommendation,
        status: report.status,
        publishedAt: report.publishedAt?.toISOString?.() ?? null,
        items,
        averageScore,
        promotedToLevel,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
    };
}

function assertReportLevelAccess(actor, level) {
    if (actor?.role !== "ADMIN") return;

    if (getProgramScope(actor) !== level) {
        throw new OperationalError(
            403,
            "FORBIDDEN_PROGRAM",
            "Akun admin program hanya dapat mengelola raport pada programnya sendiri.",
        );
    }
}

function assertReportEditorAccess(actor, existing = null) {
    if (!actor || !REPORT_EDITOR_ROLES.includes(actor.role)) {
        throw new OperationalError(
            403,
            "FORBIDDEN_REPORT_EDITOR",
            "Anda tidak memiliki izin untuk membuat atau mengubah raport.",
        );
    }

    // Kepemilikan penilai bukan sekadar mencegah pemindahan coachId.
    // Pelatih lain juga tidak boleh mengubah isi, menerbitkan, atau
    // memicu kenaikan level dari raport ini. Raport tanpa penilai
    // (coachId null) harus ditetapkan dulu oleh role manajemen.
    if (actor.role === "COACH" && existing && existing.coachId !== actor.id) {
        throw new OperationalError(
            403,
            "FORBIDDEN_REPORT_EDITOR",
            "Pelatih hanya dapat mengubah raport yang dinilai oleh dirinya sendiri.",
        );
    }
}

function assertReportDeleteAccess(actor) {
    if (!actor || !PERMANENT_DELETE_ROLES.includes(actor.role)) {
        throw new OperationalError(
            403,
            "FORBIDDEN_REPORT_DELETE",
            "Anda tidak memiliki izin untuk menghapus raport.",
        );
    }
}

async function lockStudentReportRow(tx, id) {
    const rows = await tx.$queryRaw`
    SELECT id
    FROM student_reports
    WHERE id = ${id}
    FOR UPDATE
  `;

    return rows.length > 0;
}

async function assertStudent(client, studentId) {
    const student = await client.student.findUnique({
        where: { id: studentId },
        select: { id: true, level: true, status: true },
    });

    if (!student) {
        throw new OperationalError(
            400,
            "INVALID_STUDENT",
            "Siswa yang dipilih tidak ditemukan.",
        );
    }

    if (student.status === "INACTIVE") {
        throw new OperationalError(
            409,
            "STUDENT_INACTIVE",
            "Siswa nonaktif tidak dapat menerima raport baru. Aktifkan kembali siswa melalui Data Master bila diperlukan.",
        );
    }

    return student;
}

async function assertCoach(client, coachId) {
    if (!coachId) return null;

    const coach = await client.user.findFirst({
        where: { id: coachId, role: "COACH" },
        select: { id: true },
    });

    if (!coach) {
        throw new OperationalError(
            400,
            "INVALID_COACH",
            "Pelatih penilai tidak ditemukan.",
        );
    }

    return coach;
}

async function assertUniquePeriod(client, studentId, periodLabel, excludeId) {
    const existing = await client.studentReport.findFirst({
        where: {
            studentId,
            periodLabel,
            ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
    });

    if (existing) {
        throw new OperationalError(
            409,
            "DUPLICATE_REPORT_PERIOD",
            `Siswa ini sudah memiliki raport untuk periode "${periodLabel}". Edit raport yang ada atau gunakan label periode lain.`,
        );
    }
}

function resolveCoachId(data, actor, existing = null) {
    if (actor?.role === "COACH") {
        // Pelatih tidak dapat memindahkan penilaian ke pelatih lain.
        return existing?.coachId ?? actor.id;
    }

    return data.coachId ?? existing?.coachId ?? null;
}

function toReportItemsCreate(items) {
    return items.map((item, index) => ({
        competency: item.competency,
        score: item.score,
        note: item.note,
        sortOrder: index,
    }));
}

/**
 * Naikkan level siswa satu jenjang bila raport diterbitkan dengan
 * rekomendasi LEVEL_UP. Mengembalikan level tujuan atau null.
 */
async function applyPromotionIfNeeded(tx, { studentId, reportLevel }) {
    const student = await tx.student.findUnique({
        where: { id: studentId },
        select: { id: true, level: true },
    });

    if (!student || student.level !== reportLevel) return null;

    const nextLevel = NEXT_STUDENT_LEVEL[student.level];
    if (!nextLevel) return null;

    await tx.student.update({
        where: { id: studentId },
        data: { level: nextLevel },
    });

    return nextLevel;
}

export async function getReports({ studentId = null, actor = null } = {}) {
    // Koleksi raport bersifat role-sensitive. Pemanggil wajib meneruskan
    // aktor sesi agar service dapat menerapkan batas visibilitasnya.
    if (!actor) return [];

    const isStudentActor = actor?.role === "STUDENT";
    const programScope =
        actor?.role === "ADMIN" ? getProgramScope(actor) : null;

    // Fail closed untuk aktor STUDENT: pemanggil wajib sudah menyelesaikan
    // profil siswa milik user yang login. Tanpa studentId, jangan pernah
    // mengembalikan koleksi raport lintas-siswa.
    if (isStudentActor && !studentId) return [];
    if (actor?.role === "ADMIN" && !programScope) return [];

    const reports = await prisma.studentReport.findMany({
        where: {
            ...(studentId ? { studentId } : {}),
            // Raport DRAFT adalah data kerja pelatih/admin. Siswa dan orang tua
            // hanya boleh menerima raport yang sudah final dan diterbitkan.
            ...(isStudentActor ? { status: "PUBLISHED" } : {}),
            ...(programScope ? { level: programScope } : {}),
        },
        include: reportInclude,
        orderBy: [{ updatedAt: "desc" }],
    });

    return reports.map((report) => mapReport(report));
}

export async function createReport(data, actor) {
    assertReportEditorAccess(actor);

    const coachId = resolveCoachId(data, actor);

    assertReportLevelAccess(actor, data.level);

    return prisma.$transaction(async (tx) => {
        const student = await assertStudent(tx, data.studentId);
        assertReportLevelAccess(actor, student.level);
        await assertCoach(tx, coachId);
        await assertUniquePeriod(tx, data.studentId, data.periodLabel, null);

        const report = await tx.studentReport.create({
            data: {
                studentId: data.studentId,
                coachId,
                level: data.level,
                periodLabel: data.periodLabel,
                periodStart: toDateOnly(data.periodStart),
                periodEnd: toDateOnly(data.periodEnd),
                sessionsAttended: data.sessionsAttended,
                totalSessions: data.totalSessions,
                coachNotes: data.coachNotes,
                recommendation: data.recommendation,
                status: data.status,
                publishedAt: data.status === "PUBLISHED" ? new Date() : null,
                items: {
                    create: toReportItemsCreate(data.items),
                },
            },
            include: reportInclude,
        });

        const promotedToLevel =
            data.status === "PUBLISHED" && data.recommendation === "LEVEL_UP"
                ? await applyPromotionIfNeeded(tx, {
                      studentId: data.studentId,
                      reportLevel: data.level,
                  })
                : null;

        return mapReport(report, promotedToLevel);
    });
}

export async function updateReport(id, data, actor) {
    return prisma.$transaction(async (tx) => {
        // Kunci baris raport terlebih dahulu agar coachId/status yang
        // diperiksa tidak berubah di tengah transaksi akibat PATCH atau
        // penetapan penilai paralel.
        const reportExists = await lockStudentReportRow(tx, id);

        if (!reportExists) {
            throw new OperationalError(
                404,
                "NOT_FOUND",
                "Raport tidak ditemukan.",
            );
        }

        const existing = await tx.studentReport.findUnique({
            where: { id },
            select: {
                id: true,
                studentId: true,
                coachId: true,
                level: true,
                status: true,
                publishedAt: true,
            },
        });

        if (!existing) {
            throw new OperationalError(
                404,
                "NOT_FOUND",
                "Raport tidak ditemukan.",
            );
        }

        assertReportEditorAccess(actor, existing);
        assertReportLevelAccess(actor, existing.level);
        assertReportLevelAccess(actor, data.level);

        if (existing.studentId !== data.studentId) {
            throw new OperationalError(
                409,
                "REPORT_STUDENT_LOCKED",
                "Siswa pada raport yang sudah dibuat tidak dapat diganti. Hapus raport lalu buat ulang bila salah siswa.",
            );
        }

        const coachId = resolveCoachId(data, actor, existing);

        await assertStudent(tx, data.studentId);
        await assertCoach(tx, coachId);
        await assertUniquePeriod(tx, data.studentId, data.periodLabel, id);

        const isPublishingNow =
            existing.status !== "PUBLISHED" && data.status === "PUBLISHED";

        const report = await tx.studentReport.update({
            where: { id },
            data: {
                coachId,
                level: data.level,
                periodLabel: data.periodLabel,
                periodStart: toDateOnly(data.periodStart),
                periodEnd: toDateOnly(data.periodEnd),
                sessionsAttended: data.sessionsAttended,
                totalSessions: data.totalSessions,
                coachNotes: data.coachNotes,
                recommendation: data.recommendation,
                status: data.status,
                publishedAt:
                    data.status === "PUBLISHED"
                        ? (existing.publishedAt ?? new Date())
                        : null,
                items: {
                    deleteMany: {},
                    create: toReportItemsCreate(data.items),
                },
            },
            include: reportInclude,
        });

        const promotedToLevel =
            isPublishingNow && data.recommendation === "LEVEL_UP"
                ? await applyPromotionIfNeeded(tx, {
                      studentId: data.studentId,
                      reportLevel: data.level,
                  })
                : null;

        return mapReport(report, promotedToLevel);
    });
}

export async function deleteReport(id, actor = null) {
    assertReportDeleteAccess(actor);

    const existing = await prisma.studentReport.findUnique({
        where: { id },
        select: { id: true, level: true },
    });

    if (!existing) {
        throw new OperationalError(404, "NOT_FOUND", "Raport tidak ditemukan.");
    }

    assertReportLevelAccess(actor, existing.level);

    await prisma.studentReport.delete({ where: { id } });
    return { ok: true };
}
