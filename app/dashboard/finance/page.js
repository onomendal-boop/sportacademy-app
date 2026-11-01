import { Suspense } from "react";
import FinanceManager from "@/components/finance/FinanceManager";
import FinanceSkeleton from "@/components/finance/FinanceSkeleton";
import { requireFeatureAccess } from "@/lib/auth/authService";
import { isAdminLevel, canPermanentlyDelete } from "@/lib/auth/permissions";
import { getTrainingVenues } from "@/lib/data-master/trainingVenueService";
import { FINANCE_TABS } from "@/lib/finance/constants";
import { getFinanceStudents } from "@/lib/finance/financeOptionsService";
import { getPackages } from "@/lib/finance/packageService";
import { getSubscriptions } from "@/lib/finance/subscriptionService";
import { getTransactions } from "@/lib/finance/transactionService";
import { getPaymentReminderSettings } from "@/lib/settings/settingsService";

export const metadata = {
    title: "Finance | AAA Sport Academy",
    description:
        "Kelola transaksi, langganan siswa, dan laporan pendapatan AAA Sport Academy.",
};

async function FinanceContent({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const rawTab = Array.isArray(resolvedSearchParams?.tab)
        ? resolvedSearchParams.tab[0]
        : resolvedSearchParams?.tab;
    const rawQuery = Array.isArray(resolvedSearchParams?.q)
        ? resolvedSearchParams.q[0]
        : resolvedSearchParams?.q;
    const initialSearch =
        typeof rawQuery === "string" ? rawQuery.trim().slice(0, 80) : "";
    const rawTarget = Array.isArray(resolvedSearchParams?.target)
        ? resolvedSearchParams.target[0]
        : resolvedSearchParams?.target;
    // Target lama `packages` dipetakan ke langganan agar tautan pencarian
    // lama tetap berguna bagi Finance. Katalognya sendiri kini berada di
    // Marketing dan tidak lagi menjadi target pencarian halaman Finance.
    const initialSearchTarget =
        rawTarget === "packages" || rawTarget === "subscriptions"
            ? "subscriptions"
            : "transactions";
    const fallbackTab =
        initialSearchTarget === "transactions"
            ? "transactions"
            : "subscriptions";
    const initialTab = FINANCE_TABS.includes(rawTab) ? rawTab : fallbackTab;

    const currentUser = await requireFeatureAccess(
        "finance",
        "/dashboard/finance",
    );
    const [
        packageOptions,
        subscriptions,
        transactions,
        students,
        venues,
        reminderSettings,
    ] = await Promise.all([
        // Finance hanya membaca katalog Marketing sebagai opsi pembayaran
        // dan langganan; pembuatan/pengubahan paket tidak dilakukan di sini.
        getPackages(currentUser),
        getSubscriptions(currentUser),
        getTransactions(currentUser),
        getFinanceStudents(currentUser),
        getTrainingVenues(),
        getPaymentReminderSettings().catch((error) => {
            console.error("[finance-page:reminder-template]", error);
            return null;
        }),
    ]);

    return (
        <FinanceManager
            key={`${initialSearchTarget}:${initialSearch}:${initialTab}`}
            packageOptions={packageOptions}
            initialSubscriptions={subscriptions}
            initialTransactions={transactions}
            students={students}
            venues={venues}
            canManage={isAdminLevel(currentUser?.role)}
            canDelete={canPermanentlyDelete(currentUser?.role)}
            programScope={currentUser?.programScope ?? null}
            initialTab={initialTab}
            initialSearch={initialSearch}
            initialSearchTarget={initialSearchTarget}
            reminderSettings={reminderSettings}
        />
    );
}

/**
 * searchParams diteruskan sebagai Promise ke async child di dalam Suspense.
 * Pola ini kompatibel dengan Cache Components Next.js 16 dan tidak memakai
 * export runtime/dynamic/revalidate/fetchCache.
 */
export default function FinancePage({ searchParams }) {
    return (
        <Suspense fallback={<FinanceSkeleton />}>
            <FinanceContent searchParams={searchParams} />
        </Suspense>
    );
}
