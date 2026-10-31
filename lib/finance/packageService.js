import { prisma } from '@/lib/db/prisma';
import { resolveTrainingVenue } from './referenceService';
import { FinanceError } from './routeHelpers';

export const packageInclude = {
  defaultTrainingVenue: {
    select: {
      id: true,
      name: true,
      location: true,
      status: true,
    },
  },
  _count: {
    select: {
      subscriptions: true,
      transactions: true,
    },
  },
};

export function mapPackage(pkg) {
  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description ?? '',
    program: pkg.program,
    price: pkg.price,
    durationLabel: pkg.durationLabel,
    durationDays: pkg.durationDays,
    totalSessions: pkg.totalSessions ?? null,
    defaultTrainingVenueId: pkg.defaultTrainingVenueId ?? null,
    defaultTrainingVenue: pkg.defaultTrainingVenue ?? null,
    poolName: pkg.poolName ?? pkg.defaultTrainingVenue?.name ?? '',
    isActive: pkg.isActive,
    subscriptionCount: pkg._count?.subscriptions ?? 0,
    transactionCount: pkg._count?.transactions ?? 0,
    createdAt: pkg.createdAt?.toISOString?.() ?? pkg.createdAt,
    updatedAt: pkg.updatedAt?.toISOString?.() ?? pkg.updatedAt,
  };
}

async function toPackageWriteData(client, data) {
  const venue = await resolveTrainingVenue(client, data.defaultTrainingVenueId);

  return {
    name: data.name,
    description: data.description,
    program: data.program,
    price: data.price,
    durationLabel: data.durationLabel,
    durationDays: data.durationDays,
    totalSessions: data.totalSessions,
    defaultTrainingVenueId: venue?.id ?? null,
    poolName: venue?.name ?? null,
    isActive: data.isActive,
  };
}

export async function getPackages() {
  const packages = await prisma.package.findMany({
    include: packageInclude,
    orderBy: [
      { isActive: 'desc' },
      { program: 'asc' },
      { price: 'asc' },
      { name: 'asc' },
    ],
  });

  return packages.map(mapPackage);
}

export async function createPackage(data) {
  const writeData = await toPackageWriteData(prisma, data);
  const pkg = await prisma.package.create({
    data: writeData,
    include: packageInclude,
  });

  return mapPackage(pkg);
}

export async function updatePackage(id, data) {
  const writeData = await toPackageWriteData(prisma, data);
  const pkg = await prisma.package.update({
    where: { id },
    data: writeData,
    include: packageInclude,
  });

  return mapPackage(pkg);
}

export async function deletePackage(id) {
  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subscriptions: true,
          transactions: true,
        },
      },
    },
  });

  if (!pkg) {
    throw new FinanceError(404, 'PACKAGE_NOT_FOUND', 'Paket tidak ditemukan.');
  }

  if (pkg._count.subscriptions > 0 || pkg._count.transactions > 0) {
    throw new FinanceError(
      409,
      'PACKAGE_IN_USE',
      'Paket sudah memiliki histori langganan/transaksi. Nonaktifkan paket agar histori keuangan tetap terjaga.'
    );
  }

  await prisma.package.delete({ where: { id } });
  return { ok: true };
}
