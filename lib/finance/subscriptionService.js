import { prisma } from "@/lib/db/prisma";
import { dateKeyToDatabaseDate, toDateKey } from "./financeUtils";
import {
    assertFinanceProgramAccess,
    getFinanceProgramScope,
    resolveFinancePackage,
    resolveFinanceStudent,
    resolveTrainingVenue,
} from "./referenceService";
import { FinanceError } from "./routeHelpers";

export const subscriptionInclude = {
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
    package: {
        select: {
            id: true,
            name: true,
            program: true,
            price: true,
            durationLabel: true,
            durationDays: true,
            totalSessions: true,
            defaultTrainingVenueId: true,
            poolName: true,
            isActive: true,
        },
    },
    transactions: {
        select: {
            id: true,
            invoiceNumber: true,
            status: true,
            amount: true,
            paidAt: true,
            createdAt: true,
        },
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        take: 1,
    },
    _count: {
        select: {
            transactions: true,
        },
    },
};

export function mapSubscription(subscription) {
    const latestTransaction = subscription.transactions?.[0] ?? null;

    return {
        id: subscription.id,
        studentId: subscription.studentId,
        student: subscription.student ?? null,
        packageId: subscription.packageId ?? null,
        package: subscription.package ?? null,
        packageName: subscription.packageName,
        program: subscription.program,
        price: subscription.price,
        poolName: subscription.poolName ?? "",
        startsAt: toDateKey(subscription.startsAt),
        expiresAt: toDateKey(subscription.expiresAt),
        totalSessions: subscription.totalSessions ?? null,
        remainingSessions: subscription.remainingSessions ?? null,
        status: subscription.status,
        autoRenew: subscription.autoRenew,
        notes: subscription.notes ?? "",
        transactionCount: subscription._count?.transactions ?? 0,
        latestTransaction: latestTransaction
            ? {
                  id: latestTransaction.id,
                  invoiceNumber: latestTransaction.invoiceNumber,
                  status: latestTransaction.status,
                  amount: latestTransaction.amount,
                  paidAt: latestTransaction.paidAt?.toISOString?.() ?? null,
                  createdAt:
                      latestTransaction.createdAt?.toISOString?.() ??
                      latestTransaction.createdAt,
              }
            : null,
        createdAt:
            subscription.createdAt?.toISOString?.() ?? subscription.createdAt,
        updatedAt:
            subscription.updatedAt?.toISOString?.() ?? subscription.updatedAt,
    };
}

export async function getSubscriptionRecord(id, client = prisma) {
    return client.subscription.findUnique({
        where: { id },
        include: subscriptionInclude,
    });
}

async function toSubscriptionWriteData(
    client,
    data,
    actor = null,
    existing = null,
) {
    const [student, pkg, venue] = await Promise.all([
        resolveFinanceStudent(client, data.studentId),
        resolveFinancePackage(client, data.packageId),
        resolveTrainingVenue(client, data.trainingVenueId),
    ]);

    const program = data.program || pkg?.program;

    if (actor?.role === "ADMIN") {
        // Langganan baru, atau penggantian siswa pada langganan lama, harus
        // memakai siswa dari level admin tersebut. Update histori untuk
        // siswa yang sama tetap boleh walau siswa sudah naik level.
        if (!existing || existing.studentId !== student.id) {
            assertFinanceProgramAccess(actor, { studentLevel: student.level });
        }

        assertFinanceProgramAccess(actor, {
            program,
            studentLevel: student.level,
        });
    }

    const totalSessions = data.totalSessions ?? pkg?.totalSessions ?? null;
    const remainingSessions = data.remainingSessions ?? totalSessions;

    return {
        studentId: student.id,
        packageId: pkg?.id ?? null,
        packageName: data.packageName || pkg?.name,
        program,
        price: data.price,
        poolName: venue?.name ?? pkg?.poolName ?? null,
        startsAt: dateKeyToDatabaseDate(data.startsAt),
        expiresAt: dateKeyToDatabaseDate(data.expiresAt),
        totalSessions,
        remainingSessions,
        status: data.status,
        autoRenew: data.autoRenew,
        notes: data.notes,
    };
}

export async function getSubscriptions(
    actor = null,
    { studentId = null } = {},
) {
    const programScope = getFinanceProgramScope(actor);

    if (actor?.role === "ADMIN" && !programScope) return [];

    const where = {
        ...(studentId ? { studentId } : {}),
        ...(programScope
            ? {
                  OR: [
                      { program: programScope },
                      {
                          AND: [
                              { program: "PRIVATE" },
                              { student: { level: programScope } },
                          ],
                      },
                  ],
              }
            : {}),
    };

    const subscriptions = await prisma.subscription.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: subscriptionInclude,
        orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }],
    });

    return subscriptions.map(mapSubscription);
}

export async function getSubscriptionsByStudentId(studentId, actor = null) {
    if (!studentId) return [];

    return getSubscriptions(actor, { studentId });
}

export async function createSubscription(data, actor = null) {
    const writeData = await toSubscriptionWriteData(prisma, data, actor);
    const subscription = await prisma.subscription.create({
        data: writeData,
        include: subscriptionInclude,
    });

    return mapSubscription(subscription);
}

export async function updateSubscription(id, data, actor = null) {
    const existing = await prisma.subscription.findUnique({
        where: { id },
        include: {
            student: {
                select: { level: true },
            },
            _count: {
                select: { transactions: true },
            },
        },
    });

    if (!existing) {
        throw new FinanceError(
            404,
            "SUBSCRIPTION_NOT_FOUND",
            "Langganan tidak ditemukan.",
        );
    }

    assertFinanceProgramAccess(actor, {
        program: existing.program,
        studentLevel: existing.student?.level,
    });

    if (
        existing.studentId !== data.studentId &&
        existing._count.transactions > 0
    ) {
        throw new FinanceError(
            409,
            "SUBSCRIPTION_STUDENT_LOCKED",
            "Siswa pada langganan yang sudah memiliki transaksi tidak dapat diganti.",
        );
    }

    const writeData = await toSubscriptionWriteData(
        prisma,
        data,
        actor,
        existing,
    );
    const subscription = await prisma.subscription.update({
        where: { id },
        data: writeData,
        include: subscriptionInclude,
    });

    return mapSubscription(subscription);
}

export async function deleteSubscription(id, actor = null) {
    const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: {
            student: {
                select: { level: true },
            },
            _count: {
                select: { transactions: true },
            },
        },
    });

    if (!subscription) {
        throw new FinanceError(
            404,
            "SUBSCRIPTION_NOT_FOUND",
            "Langganan tidak ditemukan.",
        );
    }

    assertFinanceProgramAccess(actor, {
        program: subscription.program,
        studentLevel: subscription.student?.level,
    });

    if (subscription._count.transactions > 0) {
        throw new FinanceError(
            409,
            "SUBSCRIPTION_HAS_TRANSACTIONS",
            "Langganan sudah memiliki transaksi. Ubah status menjadi Dibatalkan/Selesai agar histori tetap terjaga.",
        );
    }

    await prisma.subscription.delete({ where: { id } });
    return { ok: true };
}
