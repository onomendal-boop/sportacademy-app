import { Suspense } from 'react';
import FinanceManager from '@/components/finance/FinanceManager';
import FinanceSkeleton from '@/components/finance/FinanceSkeleton';
import { requireFeatureAccess } from '@/lib/auth/authService';
import { isAdminLevel, canPermanentlyDelete } from '@/lib/auth/permissions';
import { getTrainingVenues } from '@/lib/data-master/trainingVenueService';
import { FINANCE_TABS } from '@/lib/finance/constants';
import { getFinanceStudents } from '@/lib/finance/financeOptionsService';
import { getPackages } from '@/lib/finance/packageService';
import { getSubscriptions } from '@/lib/finance/subscriptionService';
import { getTransactions } from '@/lib/finance/transactionService';

export const metadata = {
  title: 'Finance | AAA Sport Academy',
  description:
    'Kelola transaksi, katalog paket, langganan siswa, dan laporan pendapatan AAA Sport Academy.',
};

async function FinanceContent({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const rawTab = Array.isArray(resolvedSearchParams?.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams?.tab;
  const initialTab = FINANCE_TABS.includes(rawTab)
    ? rawTab
    : 'transactions';

  const [
    currentUser,
    packages,
    subscriptions,
    transactions,
    students,
    venues,
  ] = await Promise.all([
    requireFeatureAccess('finance', '/dashboard/finance'),
    getPackages(),
    getSubscriptions(),
    getTransactions(),
    getFinanceStudents(),
    getTrainingVenues(),
  ]);

  return (
    <FinanceManager
      initialPackages={packages}
      initialSubscriptions={subscriptions}
      initialTransactions={transactions}
      students={students}
      venues={venues}
      canManage={isAdminLevel(currentUser?.role)}
      canDelete={canPermanentlyDelete(currentUser?.role)}
      initialTab={initialTab}
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
