import { prisma } from "@/lib/db/prisma";
import {
    ALLOWED_TRANSACTION_STATUS_TRANSITIONS,
    TRANSACTION_TYPE_LABELS,
} from "./constants";
import {
    addDaysToDateKey,
    dateKeyToDatabaseDate,
    dateKeyToPaymentDateTime,
    differenceInDays,
    toDateKey,
} from "./financeUtils";
import {
    assertFinanceProgramAccess,
    getFinanceProgramScope,
    resolveFinancePackage,
    resolveFinanceStudent,
    resolveTrainingVenue,
} from "./referenceService";
import { FinanceError } from "./routeHelpers";
import {
    getSubscriptionRecord,
    mapSubscription,
    subscriptionInclude,
} from "./subscriptionService";

const ENTITLEMENT_TRANSACTION_TYPES = [
    "SUBSCRIPTION_PAYMENT",
    "PRIVATE_VOUCHER",
];

export const transactionInclude = {
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
    subscription: {
        select: {
            id: true,
            packageId: true,
            packageName: true,
            program: true,
            startsAt: true,
            expiresAt: true,
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
};

const FINANCE_TRANSACTION_MAX_ATTEMPTS = 3;

function isRetryableFinanceTransactionError(error) {
    if (error?.code === "P2034") return true;

    const databaseCode = String(error?.meta?.code ?? "");
    // 1020 = record changed since last read (REPEATABLE READ snapshot),
    // 1205 = lock wait timeout, 1213 = deadlock. Seluruh callback aman
    // dicoba ulang karena transaksi yang gagal sudah di-rollback.
    if (
        databaseCode === "1020" ||
        databaseCode === "1205" ||
        databaseCode === "1213"
    ) {
        return true;
    }

    if (error?.code !== "P2010") return false;

    const message = String(
        error?.meta?.message ?? error?.message ?? "",
    ).toLowerCase();

    return (
        message.includes("deadlock") ||
        message.includes("lock wait timeout") ||
        message.includes("record has changed since last read")
    );
}

async function runRetryableFinanceTransaction(callback) {
    let lastError;

    for (
        let attempt = 0;
        attempt < FINANCE_TRANSACTION_MAX_ATTEMPTS;
        attempt += 1
    ) {
        try {
            return await prisma.$transaction(callback, {
                maxWait: 5000,
                timeout: 10000,
            });
        } catch (error) {
            lastError = error;

            if (!isRetryableFinanceTransactionError(error)) throw error;

            if (attempt === FINANCE_TRANSACTION_MAX_ATTEMPTS - 1) {
                throw new FinanceError(
                    409,
                    "TRANSACTION_CONFLICT",
                    "Transaksi sedang diubah secara bersamaan. Silakan muat ulang data lalu coba lagi.",
                );
            }
        }
    }

    throw lastError;
}

async function lockTransactionRow(tx, id) {
    const rows = await tx.$queryRaw`
    SELECT id, status, subscription_id AS subscriptionId
    FROM transactions
    WHERE id = ${id}
    FOR UPDATE
  `;

    return rows[0] ?? null;
}

async function lockSubscriptionRow(tx, id) {
    const rows = await tx.$queryRaw`
    SELECT
      id,
      student_id AS studentId,
      package_id AS packageId,
      package_name AS packageName,
      program,
      price,
      pool_name AS poolName,
      starts_at AS startsAt,
      expires_at AS expiresAt,
      total_sessions AS totalSessions,
      remaining_sessions AS remainingSessions,
      status,
      auto_renew AS autoRenew,
      notes,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM subscriptions
    WHERE id = ${id}
    FOR UPDATE
  `;

    const row = rows[0];
    if (!row) return null;

    return {
        ...row,
        price: Number(row.price),
        startsAt:
            row.startsAt instanceof Date
                ? row.startsAt
                : new Date(row.startsAt),
        expiresAt:
            row.expiresAt instanceof Date
                ? row.expiresAt
                : new Date(row.expiresAt),
        totalSessions:
            row.totalSessions === null || row.totalSessions === undefined
                ? null
                : Number(row.totalSessions),
        remainingSessions:
            row.remainingSessions === null ||
            row.remainingSessions === undefined
                ? null
                : Number(row.remainingSessions),
        autoRenew: Boolean(row.autoRenew),
        createdAt:
            row.createdAt instanceof Date
                ? row.createdAt
                : new Date(row.createdAt),
        updatedAt:
            row.updatedAt instanceof Date
                ? row.updatedAt
                : new Date(row.updatedAt),
    };
}

export function mapTransaction(transaction) {
    const transactionDate = transaction.paidAt ?? transaction.createdAt;

    return {
        id: transaction.id,
        invoiceNumber: transaction.invoiceNumber,
        studentId: transaction.studentId ?? null,
        student: transaction.student ?? null,
        subscriptionId: transaction.subscriptionId ?? null,
        subscription: transaction.subscription
            ? {
                  ...transaction.subscription,
                  startsAt: toDateKey(transaction.subscription.startsAt),
                  expiresAt: toDateKey(transaction.subscription.expiresAt),
              }
            : null,
        packageId: transaction.packageId ?? null,
        package: transaction.package ?? null,
        type: transaction.type,
        description: transaction.description,
        program: transaction.program ?? null,
        poolName: transaction.poolName ?? "",
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        referenceNumber: transaction.referenceNumber ?? "",
        paidAt: transaction.paidAt?.toISOString?.() ?? null,
        transactionDate:
            transactionDate?.toISOString?.() ?? transactionDate ?? null,
        recordedById: transaction.recordedById ?? null,
        notes: transaction.notes ?? "",
        createdAt:
            transaction.createdAt?.toISOString?.() ?? transaction.createdAt,
        updatedAt:
            transaction.updatedAt?.toISOString?.() ?? transaction.updatedAt,
    };
}

async function buildInvoiceNumber(client, paymentDateKey) {
    const compactDate = paymentDateKey.replaceAll("-", "");
    const prefix = `INV-${compactDate}-`;
    const latest = await client.transaction.findFirst({
        where: {
            invoiceNumber: {
                startsWith: prefix,
            },
        },
        select: { invoiceNumber: true },
        orderBy: { invoiceNumber: "desc" },
    });

    const latestSequence = latest
        ? Number.parseInt(latest.invoiceNumber.slice(prefix.length), 10)
        : 0;
    const nextSequence = Number.isFinite(latestSequence)
        ? latestSequence + 1
        : 1;

    return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

function getPackageDurationDays(pkg, subscription) {
    if (pkg?.durationDays) return pkg.durationDays;

    const startsAt = toDateKey(subscription?.startsAt);
    const expiresAt = toDateKey(subscription?.expiresAt);
    const difference = differenceInDays(startsAt, expiresAt);

    return difference && difference > 0 ? difference : 30;
}

async function createSubscriptionForPayment(
    client,
    { student, pkg, poolName, amount, status, startDate, autoRenew, notes },
) {
    const startsAt = startDate;
    const expiresAt = addDaysToDateKey(startsAt, pkg.durationDays);

    return client.subscription.create({
        data: {
            studentId: student.id,
            packageId: pkg.id,
            packageName: pkg.name,
            program: pkg.program,
            price: amount,
            poolName,
            startsAt: dateKeyToDatabaseDate(startsAt),
            expiresAt: dateKeyToDatabaseDate(expiresAt),
            totalSessions: pkg.totalSessions ?? null,
            remainingSessions: pkg.totalSessions ?? null,
            status: status === "PAID" ? "ACTIVE" : "PENDING",
            autoRenew: Boolean(autoRenew),
            notes,
        },
        include: subscriptionInclude,
    });
}

async function activatePendingSubscription(
    client,
    subscription,
    pkg,
    { amount, paidDateKey, poolName, desiredStartDate },
) {
    let startsAt = toDateKey(subscription.startsAt);
    let expiresAt = toDateKey(subscription.expiresAt);
    let totalSessions =
        subscription.totalSessions ?? pkg?.totalSessions ?? null;
    let remainingSessions = subscription.remainingSessions ?? totalSessions;

    if (desiredStartDate && desiredStartDate !== startsAt) {
        startsAt = desiredStartDate;
        expiresAt = addDaysToDateKey(
            desiredStartDate,
            getPackageDurationDays(pkg, subscription),
        );
    }

    if (expiresAt < paidDateKey) {
        startsAt = paidDateKey;
        expiresAt = addDaysToDateKey(
            paidDateKey,
            getPackageDurationDays(pkg, subscription),
        );
        totalSessions =
            pkg?.totalSessions ?? subscription.totalSessions ?? null;
        remainingSessions = totalSessions;
    }

    return client.subscription.update({
        where: { id: subscription.id },
        data: {
            packageId: pkg?.id ?? subscription.packageId ?? null,
            packageName: pkg?.name ?? subscription.packageName,
            program: pkg?.program ?? subscription.program,
            price: amount,
            poolName: poolName ?? subscription.poolName ?? null,
            startsAt: dateKeyToDatabaseDate(startsAt),
            expiresAt: dateKeyToDatabaseDate(expiresAt),
            totalSessions,
            remainingSessions,
            status: "ACTIVE",
        },
        include: subscriptionInclude,
    });
}

async function extendSubscription(
    client,
    subscription,
    pkg,
    { amount, paidDateKey, poolName, autoRenew, desiredStartDate },
) {
    const currentStartsAt = toDateKey(subscription.startsAt);
    const currentExpiresAt = toDateKey(subscription.expiresAt);
    const isExpired = currentExpiresAt < paidDateKey;
    const restartDate =
        desiredStartDate && desiredStartDate > paidDateKey
            ? desiredStartDate
            : paidDateKey;
    const baseDate = isExpired ? restartDate : currentExpiresAt;
    const expiresAt = addDaysToDateKey(baseDate, pkg.durationDays);

    let totalSessions = subscription.totalSessions ?? null;
    let remainingSessions = subscription.remainingSessions ?? null;

    if (pkg.totalSessions !== null && pkg.totalSessions !== undefined) {
        if (isExpired) {
            totalSessions = pkg.totalSessions;
            remainingSessions = pkg.totalSessions;
        } else {
            totalSessions =
                totalSessions === null
                    ? pkg.totalSessions
                    : totalSessions + pkg.totalSessions;
            remainingSessions = (remainingSessions ?? 0) + pkg.totalSessions;
        }
    }

    return client.subscription.update({
        where: { id: subscription.id },
        data: {
            packageId: pkg.id,
            packageName: pkg.name,
            program: pkg.program,
            price: amount,
            poolName: poolName ?? subscription.poolName ?? null,
            startsAt: dateKeyToDatabaseDate(
                isExpired ? restartDate : currentStartsAt,
            ),
            expiresAt: dateKeyToDatabaseDate(expiresAt),
            totalSessions,
            remainingSessions,
            status: "ACTIVE",
            ...(autoRenew !== undefined
                ? { autoRenew: Boolean(autoRenew) }
                : {}),
        },
        include: subscriptionInclude,
    });
}

async function applyPaidSubscriptionEffect(
    client,
    {
        subscription,
        pkg,
        amount,
        paidDateKey,
        poolName,
        autoRenew,
        desiredStartDate,
    },
) {
    if (!subscription) return null;

    // Efek lunas adalah read-modify-write atas masa berlaku dan sesi.
    // Kunci baris langganan lalu gunakan nilai terbaru dari locking read,
    // bukan snapshot yang mungkin dibaca sebelum pembayaran paralel lain
    // untuk langganan yang sama commit.
    const lockedSubscription = await lockSubscriptionRow(
        client,
        subscription.id,
    );

    if (!lockedSubscription) {
        throw new FinanceError(
            404,
            "SUBSCRIPTION_NOT_FOUND",
            "Langganan terkait transaksi tidak ditemukan.",
        );
    }

    const currentSubscription = {
        ...subscription,
        ...lockedSubscription,
    };

    if (currentSubscription.status === "PENDING") {
        return activatePendingSubscription(client, currentSubscription, pkg, {
            amount,
            paidDateKey,
            poolName,
            desiredStartDate,
        });
    }

    if (
        ["ACTIVE", "EXPIRED", "COMPLETED"].includes(currentSubscription.status)
    ) {
        if (!pkg) return currentSubscription;

        return extendSubscription(client, currentSubscription, pkg, {
            amount,
            paidDateKey,
            poolName,
            autoRenew,
            desiredStartDate,
        });
    }

    if (currentSubscription.status === "CANCELLED") {
        throw new FinanceError(
            409,
            "SUBSCRIPTION_CANCELLED",
            "Langganan yang dibatalkan tidak dapat diperpanjang. Buat pembelian/langganan baru.",
        );
    }

    return currentSubscription;
}

export async function getTransactions(actor = null, { studentId = null } = {}) {
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
                              {
                                  OR: [
                                      { program: "PRIVATE" },
                                      { program: null },
                                  ],
                              },
                              { student: { is: { level: programScope } } },
                          ],
                      },
                  ],
              }
            : {}),
    };

    const transactions = await prisma.transaction.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: transactionInclude,
        orderBy: [
            { paidAt: "desc" },
            { createdAt: "desc" },
            { invoiceNumber: "desc" },
        ],
    });

    return transactions.map(mapTransaction);
}

export async function getTransactionsByStudentId(studentId, actor = null) {
    if (!studentId) return [];

    return getTransactions(actor, { studentId });
}

export async function createTransaction(data, actor = null) {
    const actorUser = actor && typeof actor === "object" ? actor : null;
    const actorId = actorUser?.id ?? (typeof actor === "string" ? actor : null);
    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(async (tx) => {
                // Untuk pembayaran atas langganan yang sudah ada, kunci baris
                // langganan sebelum plain read lain. Ini menserialkan efek
                // perpanjangan per langganan dan menghindari snapshot basi.
                const lockedExistingSubscription = data.subscriptionId
                    ? await lockSubscriptionRow(tx, data.subscriptionId)
                    : null;

                const student = await resolveFinanceStudent(tx, data.studentId);

                const loadedSubscription = data.subscriptionId
                    ? await tx.subscription.findUnique({
                          where: { id: data.subscriptionId },
                          include: subscriptionInclude,
                      })
                    : null;
                const existingSubscription = loadedSubscription
                    ? {
                          ...loadedSubscription,
                          ...(lockedExistingSubscription ?? {}),
                      }
                    : null;

                if (data.subscriptionId && !existingSubscription) {
                    throw new FinanceError(
                        400,
                        "INVALID_SUBSCRIPTION",
                        "Langganan yang dipilih tidak ditemukan.",
                    );
                }

                if (
                    existingSubscription &&
                    existingSubscription.studentId !== student.id
                ) {
                    throw new FinanceError(
                        409,
                        "SUBSCRIPTION_STUDENT_MISMATCH",
                        "Langganan terpilih bukan milik siswa pada transaksi ini.",
                    );
                }

                if (actorUser?.role === "ADMIN") {
                    assertFinanceProgramAccess(actorUser, {
                        studentLevel: student.level,
                    });

                    if (existingSubscription) {
                        assertFinanceProgramAccess(actorUser, {
                            program: existingSubscription.program,
                            studentLevel: student.level,
                        });
                    }
                }

                const selectedPackage = data.packageId
                    ? await resolveFinancePackage(tx, data.packageId)
                    : null;
                const pkg =
                    selectedPackage ??
                    (existingSubscription?.packageId
                        ? await resolveFinancePackage(
                              tx,
                              existingSubscription.packageId,
                          )
                        : null);

                if (ENTITLEMENT_TRANSACTION_TYPES.includes(data.type) && !pkg) {
                    throw new FinanceError(
                        400,
                        "PACKAGE_REQUIRED",
                        "Paket wajib dipilih untuk pembayaran langganan/voucher.",
                    );
                }

                if (actorUser?.role === "ADMIN") {
                    assertFinanceProgramAccess(actorUser, {
                        program:
                            pkg?.program ??
                            existingSubscription?.program ??
                            null,
                        studentLevel: student.level,
                    });
                }

                if (pkg && !pkg.isActive) {
                    throw new FinanceError(
                        409,
                        "PACKAGE_INACTIVE",
                        "Paket nonaktif tidak dapat dijual. Aktifkan paket atau pilih paket lain.",
                    );
                }

                const venue = await resolveTrainingVenue(
                    tx,
                    data.trainingVenueId,
                );
                const poolName =
                    venue?.name ??
                    pkg?.poolName ??
                    existingSubscription?.poolName ??
                    null;
                const startDate = data.startDate ?? data.paymentDate;
                const isEntitlementType =
                    ENTITLEMENT_TRANSACTION_TYPES.includes(data.type);

                let subscriptionRecord = existingSubscription;

                if (
                    !existingSubscription &&
                    pkg &&
                    isEntitlementType &&
                    ["PAID", "PENDING"].includes(data.status)
                ) {
                    subscriptionRecord = await createSubscriptionForPayment(
                        tx,
                        {
                            student,
                            pkg,
                            poolName,
                            amount: data.amount,
                            status: data.status,
                            startDate,
                            autoRenew: data.autoRenew,
                            notes: data.notes,
                        },
                    );
                } else if (
                    existingSubscription &&
                    data.status === "PAID" &&
                    pkg &&
                    isEntitlementType
                ) {
                    subscriptionRecord = await applyPaidSubscriptionEffect(tx, {
                        subscription: existingSubscription,
                        pkg,
                        amount: data.amount,
                        paidDateKey: data.paymentDate,
                        poolName,
                        autoRenew: data.autoRenew,
                        desiredStartDate: startDate,
                    });
                }

                const invoiceNumber = await buildInvoiceNumber(
                    tx,
                    data.paymentDate,
                );
                const transactionDateTime = dateKeyToPaymentDateTime(
                    data.paymentDate,
                );
                const description =
                    data.description ??
                    (pkg
                        ? `${TRANSACTION_TYPE_LABELS[data.type] ?? "Pembayaran"} - ${pkg.name}`
                        : (TRANSACTION_TYPE_LABELS[data.type] ?? "Transaksi"));

                const transaction = await tx.transaction.create({
                    data: {
                        invoiceNumber,
                        studentId: student.id,
                        subscriptionId: subscriptionRecord?.id ?? null,
                        packageId: pkg?.id ?? null,
                        type: data.type,
                        description,
                        program:
                            pkg?.program ??
                            existingSubscription?.program ??
                            null,
                        poolName,
                        amount: data.amount,
                        paymentMethod: data.paymentMethod,
                        status: data.status,
                        referenceNumber: data.referenceNumber,
                        paidAt:
                            data.status === "PAID" ? transactionDateTime : null,
                        createdAt: transactionDateTime,
                        recordedById: actorId ?? null,
                        notes: data.notes,
                    },
                    include: transactionInclude,
                });

                if (data.status === "PAID" && student.status === "PENDING") {
                    await tx.student.update({
                        where: { id: student.id },
                        data: { status: "ACTIVE" },
                    });
                }

                const freshSubscription = subscriptionRecord
                    ? await getSubscriptionRecord(subscriptionRecord.id, tx)
                    : null;

                return {
                    transaction: mapTransaction(transaction),
                    subscription: freshSubscription
                        ? mapSubscription(freshSubscription)
                        : null,
                };
            });
        } catch (error) {
            lastError = error;

            const canRetry =
                error?.code === "P2002" ||
                isRetryableFinanceTransactionError(error);

            if (!canRetry) throw error;

            if (attempt === 2) {
                if (isRetryableFinanceTransactionError(error)) {
                    throw new FinanceError(
                        409,
                        "TRANSACTION_CONFLICT",
                        "Transaksi sedang diubah secara bersamaan. Silakan muat ulang data lalu coba lagi.",
                    );
                }

                throw error;
            }
        }
    }

    throw lastError;
}

export async function updateTransaction(id, data, actor = null) {
    const actorUser = actor && typeof actor === "object" ? actor : null;
    const actorId = actorUser?.id ?? (typeof actor === "string" ? actor : null);

    return runRetryableFinanceTransaction(async (tx) => {
        // Locking read ini harus menjadi operasi pertama. PATCH paralel
        // untuk transaksi yang sama mengantre di baris ini; request kedua
        // baru membaca status setelah request pertama commit/rollback.
        const lockedTransaction = await lockTransactionRow(tx, id);

        if (!lockedTransaction) {
            throw new FinanceError(
                404,
                "TRANSACTION_NOT_FOUND",
                "Transaksi tidak ditemukan.",
            );
        }

        const currentStatus = lockedTransaction.status;

        // Urutan lock selalu transaction -> subscription. Mengunci
        // langganan sebelum findUnique mencegah snapshot REPEATABLE READ
        // lama dipakai untuk menghitung perpanjangan/refund/cancel.
        const lockedSubscription = lockedTransaction.subscriptionId
            ? await lockSubscriptionRow(tx, lockedTransaction.subscriptionId)
            : null;

        const existing = await tx.transaction.findUnique({
            where: { id },
            include: {
                student: true,
                subscription: {
                    include: {
                        package: true,
                    },
                },
                package: true,
            },
        });

        if (!existing) {
            throw new FinanceError(
                404,
                "TRANSACTION_NOT_FOUND",
                "Transaksi tidak ditemukan.",
            );
        }

        if (actorUser?.role === "ADMIN") {
            assertFinanceProgramAccess(actorUser, {
                program:
                    existing.program ??
                    existing.package?.program ??
                    existing.subscription?.program ??
                    null,
                studentLevel: existing.student?.level,
            });
        }

        const allowedStatuses =
            ALLOWED_TRANSACTION_STATUS_TRANSITIONS[currentStatus] ?? [];

        if (!allowedStatuses.includes(data.status)) {
            throw new FinanceError(
                409,
                "INVALID_STATUS_TRANSITION",
                `Status ${currentStatus} tidak dapat diubah menjadi ${data.status}. Buat transaksi baru bila diperlukan.`,
            );
        }

        let subscriptionRecord = existing.subscription
            ? {
                  ...existing.subscription,
                  ...(lockedSubscription ?? {}),
              }
            : null;
        let subscriptionId = existing.subscriptionId ?? null;
        const pkg = existing.package ?? existing.subscription?.package ?? null;
        const isEntitlementType = ENTITLEMENT_TRANSACTION_TYPES.includes(
            existing.type,
        );
        const transitionedToPaid =
            currentStatus !== "PAID" && data.status === "PAID";
        const poolName =
            existing.poolName ??
            pkg?.poolName ??
            subscriptionRecord?.poolName ??
            null;
        const transactionDateTime = dateKeyToPaymentDateTime(data.paymentDate);

        // Klaim transisi secara atomik sebelum efek finansial apa pun.
        // Baris transaksi sudah dikunci, dan CAS ini menjadi perlindungan
        // kedua apabila ada jalur tulis lain yang tidak mengambil lock:
        // hanya update yang berhasil mengubah status dari nilai terkunci
        // yang boleh melanjutkan ke applyPaidSubscriptionEffect.
        if (data.status !== currentStatus) {
            const statusClaim = await tx.transaction.updateMany({
                where: {
                    id,
                    status: currentStatus,
                },
                data: {
                    status: data.status,
                    paidAt: data.status === "PAID" ? transactionDateTime : null,
                },
            });

            if (statusClaim.count !== 1) {
                throw new FinanceError(
                    409,
                    "TRANSACTION_STATE_CONFLICT",
                    "Status transaksi baru saja diubah oleh proses lain. Muat ulang data sebelum mencoba lagi.",
                );
            }
        }

        if (transitionedToPaid && isEntitlementType) {
            if (subscriptionRecord && pkg) {
                subscriptionRecord = await applyPaidSubscriptionEffect(tx, {
                    subscription: subscriptionRecord,
                    pkg,
                    amount: data.amount,
                    paidDateKey: data.paymentDate,
                    poolName,
                    autoRenew: subscriptionRecord.autoRenew,
                    desiredStartDate: toDateKey(subscriptionRecord.startsAt),
                });
                subscriptionId = subscriptionRecord.id;
            } else if (!subscriptionRecord && pkg && existing.student) {
                subscriptionRecord = await createSubscriptionForPayment(tx, {
                    student: existing.student,
                    pkg,
                    poolName,
                    amount: data.amount,
                    status: "PAID",
                    startDate: data.paymentDate,
                    autoRenew: false,
                    notes: data.notes,
                });
                subscriptionId = subscriptionRecord.id;
            }

            if (existing.student?.status === "PENDING") {
                await tx.student.update({
                    where: { id: existing.student.id },
                    data: { status: "ACTIVE" },
                });
            }
        }

        if (
            currentStatus === "PAID" &&
            data.status === "REFUNDED" &&
            subscriptionRecord
        ) {
            const otherPaidCount = await tx.transaction.count({
                where: {
                    subscriptionId: subscriptionRecord.id,
                    status: "PAID",
                    id: { not: existing.id },
                },
            });

            if (otherPaidCount === 0) {
                subscriptionRecord = await tx.subscription.update({
                    where: { id: subscriptionRecord.id },
                    data: { status: "CANCELLED" },
                    include: subscriptionInclude,
                });
            }
        }

        if (
            currentStatus === "PENDING" &&
            ["FAILED", "CANCELLED"].includes(data.status) &&
            subscriptionRecord?.status === "PENDING"
        ) {
            const paidCount = await tx.transaction.count({
                where: {
                    subscriptionId: subscriptionRecord.id,
                    status: "PAID",
                    id: { not: existing.id },
                },
            });

            if (paidCount === 0) {
                subscriptionRecord = await tx.subscription.update({
                    where: { id: subscriptionRecord.id },
                    data: { status: "CANCELLED" },
                    include: subscriptionInclude,
                });
            }
        }

        if (
            data.status === "PENDING" &&
            subscriptionRecord?.status === "PENDING" &&
            subscriptionRecord.price !== data.amount
        ) {
            subscriptionRecord = await tx.subscription.update({
                where: { id: subscriptionRecord.id },
                data: { price: data.amount },
                include: subscriptionInclude,
            });
        }

        const transaction = await tx.transaction.update({
            where: { id },
            data: {
                description: data.description,
                subscriptionId,
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                status: data.status,
                referenceNumber: data.referenceNumber,
                paidAt: data.status === "PAID" ? transactionDateTime : null,
                createdAt: transactionDateTime,
                recordedById: actorId ?? existing.recordedById ?? null,
                notes: data.notes,
            },
            include: transactionInclude,
        });

        const freshSubscription = subscriptionId
            ? await getSubscriptionRecord(subscriptionId, tx)
            : null;

        return {
            transaction: mapTransaction(transaction),
            subscription: freshSubscription
                ? mapSubscription(freshSubscription)
                : null,
        };
    });
}

export async function deleteTransaction(id, actor = null) {
    return runRetryableFinanceTransaction(async (tx) => {
        const lockedTransaction = await lockTransactionRow(tx, id);

        if (!lockedTransaction) {
            throw new FinanceError(
                404,
                "TRANSACTION_NOT_FOUND",
                "Transaksi tidak ditemukan.",
            );
        }

        const existing = await tx.transaction.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                program: true,
                student: {
                    select: { level: true },
                },
                package: {
                    select: { program: true },
                },
                subscriptionId: true,
                subscription: {
                    select: {
                        id: true,
                        status: true,
                        program: true,
                    },
                },
            },
        });

        if (!existing) {
            throw new FinanceError(
                404,
                "TRANSACTION_NOT_FOUND",
                "Transaksi tidak ditemukan.",
            );
        }

        assertFinanceProgramAccess(actor, {
            program:
                existing.program ??
                existing.package?.program ??
                existing.subscription?.program ??
                null,
            studentLevel: existing.student?.level,
        });

        if (["PAID", "REFUNDED"].includes(lockedTransaction.status)) {
            throw new FinanceError(
                409,
                "TRANSACTION_DELETE_FORBIDDEN",
                "Transaksi lunas/refund tidak boleh dihapus demi audit keuangan. Ubah status menjadi Refund bila dana dikembalikan.",
            );
        }

        await tx.transaction.delete({ where: { id } });

        let deletedSubscriptionId = null;

        if (
            existing.subscriptionId &&
            existing.subscription?.status === "PENDING"
        ) {
            const remainingTransactionCount = await tx.transaction.count({
                where: { subscriptionId: existing.subscriptionId },
            });

            if (remainingTransactionCount === 0) {
                await tx.subscription.delete({
                    where: { id: existing.subscriptionId },
                });
                deletedSubscriptionId = existing.subscriptionId;
            }
        }

        return { ok: true, deletedSubscriptionId };
    });
}
