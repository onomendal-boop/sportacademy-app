import { prisma } from "@/lib/db/prisma";
import {
    assertFinanceProgramAccess,
    getFinanceProgramScope,
    resolveTrainingVenue,
} from "./referenceService";
import { FinanceError } from "./routeHelpers";

const PACKAGE_CATALOG_MANAGER_ROLES = ["SUPERADMIN", "OWNER"];

function assertPackageCatalogManager(actor) {
    // Actor kosong hanya untuk pemanggilan internal tepercaya. Seluruh
    // Route Handler katalog wajib meneruskan user sesi, dan user tersebut
    // harus memiliki akses Marketing global.
    if (!actor) return;

    if (!PACKAGE_CATALOG_MANAGER_ROLES.includes(actor.role)) {
        throw new FinanceError(
            403,
            "PACKAGE_CATALOG_MARKETING_ONLY",
            "Katalog paket hanya dapat dibuat dan dikelola oleh Marketing. Finance hanya memakai paket aktif untuk transaksi dan langganan.",
        );
    }
}

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
        description: pkg.description ?? "",
        program: pkg.program,
        price: pkg.price,
        durationLabel: pkg.durationLabel,
        durationDays: pkg.durationDays,
        totalSessions: pkg.totalSessions ?? null,
        defaultTrainingVenueId: pkg.defaultTrainingVenueId ?? null,
        defaultTrainingVenue: pkg.defaultTrainingVenue ?? null,
        poolName: pkg.poolName ?? pkg.defaultTrainingVenue?.name ?? "",
        isActive: pkg.isActive,
        subscriptionCount: pkg._count?.subscriptions ?? 0,
        transactionCount: pkg._count?.transactions ?? 0,
        createdAt: pkg.createdAt?.toISOString?.() ?? pkg.createdAt,
        updatedAt: pkg.updatedAt?.toISOString?.() ?? pkg.updatedAt,
    };
}

async function toPackageWriteData(client, data) {
    const venue = await resolveTrainingVenue(
        client,
        data.defaultTrainingVenueId,
    );

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

export async function getPackages(actor = null) {
    const programScope = getFinanceProgramScope(actor);

    if (actor?.role === "ADMIN" && !programScope) return [];

    const packages = await prisma.package.findMany({
        where: programScope
            ? { program: { in: [programScope, "PRIVATE"] } }
            : undefined,
        include: packageInclude,
        orderBy: [
            { isActive: "desc" },
            { program: "asc" },
            { price: "asc" },
            { name: "asc" },
        ],
    });

    const mappedPackages = packages.map(mapPackage);

    if (!programScope) return mappedPackages;

    const privatePackageIds = mappedPackages
        .filter((pkg) => pkg.program === "PRIVATE")
        .map((pkg) => pkg.id);

    if (privatePackageIds.length === 0) return mappedPackages;

    // _count bawaan Prisma pada katalog Private adalah total semua level.
    // Untuk admin program, ganti dengan hitungan yang hanya mencakup data
    // yang memang terlihat oleh scope akun tersebut.
    const [subscriptionCounts, transactionCounts] = await Promise.all([
        prisma.subscription.groupBy({
            by: ["packageId"],
            where: {
                packageId: { in: privatePackageIds },
                OR: [
                    { program: programScope },
                    {
                        AND: [
                            { program: "PRIVATE" },
                            { student: { level: programScope } },
                        ],
                    },
                ],
            },
            _count: { _all: true },
        }),
        prisma.transaction.groupBy({
            by: ["packageId"],
            where: {
                packageId: { in: privatePackageIds },
                OR: [
                    { program: programScope },
                    {
                        AND: [
                            { OR: [{ program: "PRIVATE" }, { program: null }] },
                            { student: { is: { level: programScope } } },
                        ],
                    },
                ],
            },
            _count: { _all: true },
        }),
    ]);

    const subscriptionCountByPackageId = new Map(
        subscriptionCounts.map((row) => [row.packageId, row._count._all]),
    );
    const transactionCountByPackageId = new Map(
        transactionCounts.map((row) => [row.packageId, row._count._all]),
    );

    return mappedPackages.map((pkg) =>
        pkg.program === "PRIVATE"
            ? {
                  ...pkg,
                  subscriptionCount:
                      subscriptionCountByPackageId.get(pkg.id) ?? 0,
                  transactionCount:
                      transactionCountByPackageId.get(pkg.id) ?? 0,
              }
            : pkg,
    );
}

export async function createPackage(data, actor = null) {
    // Pembuatan katalog adalah tanggung jawab Marketing global. Finance
    // dan admin program hanya membaca paket yang sudah dibuat.
    assertPackageCatalogManager(actor);
    assertFinanceProgramAccess(actor, { program: data.program });

    const writeData = await toPackageWriteData(prisma, data);
    const pkg = await prisma.package.create({
        data: writeData,
        include: packageInclude,
    });

    return mapPackage(pkg);
}

export async function updatePackage(id, data, actor = null) {
    assertPackageCatalogManager(actor);

    if (actor?.role === "ADMIN") {
        const existing = await prisma.package.findUnique({
            where: { id },
            select: { program: true },
        });

        if (!existing) {
            throw new FinanceError(
                404,
                "PACKAGE_NOT_FOUND",
                "Paket tidak ditemukan.",
            );
        }

        assertFinanceProgramAccess(actor, { program: existing.program });
    }

    assertFinanceProgramAccess(actor, { program: data.program });

    const writeData = await toPackageWriteData(prisma, data);
    const pkg = await prisma.package.update({
        where: { id },
        data: writeData,
        include: packageInclude,
    });

    return mapPackage(pkg);
}

export async function deletePackage(id, actor = null) {
    assertPackageCatalogManager(actor);

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
        throw new FinanceError(
            404,
            "PACKAGE_NOT_FOUND",
            "Paket tidak ditemukan.",
        );
    }

    assertFinanceProgramAccess(actor, { program: pkg.program });

    if (pkg._count.subscriptions > 0 || pkg._count.transactions > 0) {
        throw new FinanceError(
            409,
            "PACKAGE_IN_USE",
            "Paket sudah memiliki histori langganan/transaksi. Nonaktifkan paket agar histori keuangan tetap terjaga.",
        );
    }

    await prisma.package.delete({ where: { id } });
    return { ok: true };
}
