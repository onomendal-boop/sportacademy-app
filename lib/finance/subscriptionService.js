import { prisma } from '@/lib/db/prisma';
import {
  dateKeyToDatabaseDate,
  toDateKey,
} from './financeUtils';
import {
  resolveFinancePackage,
  resolveFinanceStudent,
  resolveTrainingVenue,
} from './referenceService';
import { FinanceError } from './routeHelpers';

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
    orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
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
    poolName: subscription.poolName ?? '',
    startsAt: toDateKey(subscription.startsAt),
    expiresAt: toDateKey(subscription.expiresAt),
    totalSessions: subscription.totalSessions ?? null,
    remainingSessions: subscription.remainingSessions ?? null,
    status: subscription.status,
    autoRenew: subscription.autoRenew,
    notes: subscription.notes ?? '',
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

async function toSubscriptionWriteData(client, data) {
  const [student, pkg, venue] = await Promise.all([
    resolveFinanceStudent(client, data.studentId),
    resolveFinancePackage(client, data.packageId),
    resolveTrainingVenue(client, data.trainingVenueId),
  ]);

  const totalSessions = data.totalSessions ?? pkg?.totalSessions ?? null;
  const remainingSessions =
    data.remainingSessions ?? totalSessions;

  return {
    studentId: student.id,
    packageId: pkg?.id ?? null,
    packageName: data.packageName || pkg?.name,
    program: data.program || pkg?.program,
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

export async function getSubscriptions() {
  const subscriptions = await prisma.subscription.findMany({
    include: subscriptionInclude,
    orderBy: [{ expiresAt: 'asc' }, { createdAt: 'desc' }],
  });

  return subscriptions.map(mapSubscription);
}

export async function createSubscription(data) {
  const writeData = await toSubscriptionWriteData(prisma, data);
  const subscription = await prisma.subscription.create({
    data: writeData,
    include: subscriptionInclude,
  });

  return mapSubscription(subscription);
}

export async function updateSubscription(id, data) {
  const existing = await prisma.subscription.findUnique({
    where: { id },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  if (!existing) {
    throw new FinanceError(
      404,
      'SUBSCRIPTION_NOT_FOUND',
      'Langganan tidak ditemukan.'
    );
  }

  if (
    existing.studentId !== data.studentId &&
    existing._count.transactions > 0
  ) {
    throw new FinanceError(
      409,
      'SUBSCRIPTION_STUDENT_LOCKED',
      'Siswa pada langganan yang sudah memiliki transaksi tidak dapat diganti.'
    );
  }

  const writeData = await toSubscriptionWriteData(prisma, data);
  const subscription = await prisma.subscription.update({
    where: { id },
    data: writeData,
    include: subscriptionInclude,
  });

  return mapSubscription(subscription);
}

export async function deleteSubscription(id) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  if (!subscription) {
    throw new FinanceError(
      404,
      'SUBSCRIPTION_NOT_FOUND',
      'Langganan tidak ditemukan.'
    );
  }

  if (subscription._count.transactions > 0) {
    throw new FinanceError(
      409,
      'SUBSCRIPTION_HAS_TRANSACTIONS',
      'Langganan sudah memiliki transaksi. Ubah status menjadi Dibatalkan/Selesai agar histori tetap terjaga.'
    );
  }

  await prisma.subscription.delete({ where: { id } });
  return { ok: true };
}
