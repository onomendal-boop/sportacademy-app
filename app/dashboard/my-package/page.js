import { Suspense } from 'react';
import FinanceSkeleton from '@/components/finance/FinanceSkeleton';
import MyPackageManager from '@/components/finance/MyPackageManager';
import { requireFeatureAccess } from '@/lib/auth/authService';
import { getMyStudentProfile } from '@/lib/auth/profileService';
import { getPackages } from '@/lib/finance/packageService';
import { getSubscriptions } from '@/lib/finance/subscriptionService';
import { getTransactions } from '@/lib/finance/transactionService';

export const metadata = {
  title: 'Paket Saya | AAA Sport Academy',
  description:
    'Lihat langganan aktif dan ajukan perpanjangan paket latihan AAA Sport Academy.',
};

async function MyPackageContent() {
  const user = await requireFeatureAccess('myPackage', '/dashboard/my-package');
  const profile = await getMyStudentProfile(user.id);

  if (!profile) {
    return <MyPackageManager profile={null} />;
  }

  const [packages, subscriptions, transactions] = await Promise.all([
    getPackages(),
    getSubscriptions(),
    getTransactions(),
  ]);

  return (
    <MyPackageManager
      profile={profile}
      initialSubscriptions={subscriptions.filter(
        (subscription) => subscription.studentId === profile.id
      )}
      initialTransactions={transactions.filter(
        (transaction) => transaction.studentId === profile.id
      )}
      packages={packages.filter((pkg) => pkg.isActive)}
    />
  );
}

export default function MyPackagePage() {
  return (
    <Suspense fallback={<FinanceSkeleton />}>
      <MyPackageContent />
    </Suspense>
  );
}
