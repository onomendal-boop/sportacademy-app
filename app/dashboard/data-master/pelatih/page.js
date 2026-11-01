import { Suspense } from 'react';
import CoachManager from '@/components/data-master/CoachManager';
import DataMasterSkeleton from '@/components/data-master/DataMasterSkeleton';
import { requireFeatureAccess } from '@/lib/auth/authService';
import { isAdminLevel, canPermanentlyDelete } from '@/lib/auth/permissions';
import { getCoaches } from '@/lib/data-master/coachService';

export const metadata = {
  title: 'Data Master Pelatih | AAA Sport Academy',
  description: 'Kelola data dan akun pelatih AAA Sport Academy.',
};

function getInitialSearch(resolvedSearchParams) {
  const rawQuery = Array.isArray(resolvedSearchParams?.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams?.q;

  return typeof rawQuery === 'string' ? rawQuery.trim().slice(0, 80) : '';
}

async function CoachContent({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialSearch = getInitialSearch(resolvedSearchParams);
  const [currentUser, coaches] = await Promise.all([
    requireFeatureAccess('dataMasterCoaches', '/dashboard/data-master/pelatih'),
    getCoaches(),
  ]);

  return (
    <CoachManager
      key={initialSearch}
      initialCoaches={coaches}
      initialSearch={initialSearch}
      canManage={isAdminLevel(currentUser?.role)}
      canDelete={canPermanentlyDelete(currentUser?.role)}
    />
  );
}

export default function CoachPage({ searchParams }) {
  return (
    <Suspense fallback={<DataMasterSkeleton />}>
      <CoachContent searchParams={searchParams} />
    </Suspense>
  );
}
