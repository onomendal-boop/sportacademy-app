import { Suspense } from "react";
import PackageCatalogManager from "@/components/marketing/PackageCatalogManager";
import Card from "@/components/ui/Card";
import { requireFeatureAccess } from "@/lib/auth/authService";
import { canAccessFeature, canPermanentlyDelete } from "@/lib/auth/permissions";
import { getTrainingVenues } from "@/lib/data-master/trainingVenueService";
import { getPackages } from "@/lib/finance/packageService";

export const metadata = {
    title: "Katalog Paket | AAA Sport Academy",
    description:
        "Marketing membuat dan mengelola katalog paket yang digunakan Finance untuk transaksi dan langganan.",
};

function PackageCatalogPageSkeleton() {
    return (
        <div
            role="status"
            aria-label="Memuat katalog paket"
            className="space-y-4 sm:space-y-6"
        >
            <span className="sr-only">
                Memuat katalog paket dari database...
            </span>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-3 h-9 w-56 animate-pulse rounded-xl bg-slate-200" />
                    <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />
                </div>
                <div className="hidden h-10 w-32 animate-pulse rounded-xl bg-slate-200 sm:block" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} padded>
                        <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
                        <div className="mt-4 h-4 w-28 animate-pulse rounded bg-slate-200" />
                        <div className="mt-2 h-7 w-20 animate-pulse rounded bg-slate-200" />
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} padded>
                        <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-200" />
                        <div className="mt-4 h-6 w-44 animate-pulse rounded bg-slate-200" />
                        <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-200" />
                        <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                        <div className="mt-5 h-8 w-32 animate-pulse rounded bg-slate-200" />
                    </Card>
                ))}
            </div>
        </div>
    );
}

async function PackageCatalogContent({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const rawQuery = Array.isArray(resolvedSearchParams?.q)
        ? resolvedSearchParams.q[0]
        : resolvedSearchParams?.q;
    const initialSearch =
        typeof rawQuery === "string" ? rawQuery.trim().slice(0, 80) : "";

    const currentUser = await requireFeatureAccess(
        "marketing",
        "/dashboard/marketing/packages",
    );
    const [packages, venues] = await Promise.all([
        getPackages(currentUser),
        getTrainingVenues(),
    ]);

    return (
        <PackageCatalogManager
            key={initialSearch}
            initialPackages={packages}
            venues={venues}
            canManage={canAccessFeature(currentUser.role, "marketing")}
            canDelete={canPermanentlyDelete(currentUser.role)}
            initialSearch={initialSearch}
        />
    );
}

export default function MarketingPackagesPage({ searchParams }) {
    return (
        <Suspense fallback={<PackageCatalogPageSkeleton />}>
            <PackageCatalogContent searchParams={searchParams} />
        </Suspense>
    );
}
