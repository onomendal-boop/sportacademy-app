import { Suspense } from 'react';
import DataMasterSkeleton from '@/components/data-master/DataMasterSkeleton';
import StaffManager from '@/components/data-master/StaffManager';
import { requireFeatureAccess } from '@/lib/auth/authService';
import { isAdminLevel, canPermanentlyDelete } from '@/lib/auth/permissions';
import { getStaff } from '@/lib/data-master/staffService';

export const metadata = {
  title: 'Data Master Staff | AAA Sport Academy',
  description: 'Kelola data staff AAA Sport Academy.',
};

function getInitialSearch(resolvedSearchParams) {
  const rawQuery = Array.isArray(resolvedSearchParams?.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams?.q;

  return typeof rawQuery === 'string' ? rawQuery.trim().slice(0, 80) : '';
}

async function StaffContent({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialSearch = getInitialSearch(resolvedSearchParams);
  const [currentUser, staff] = await Promise.all([
    requireFeatureAccess('dataMasterStaff', '/dashboard/data-master/staff'),
    getStaff(),
  ]);

  return (
    <StaffManager
      key={initialSearch}
      initialStaff={staff}
      initialSearch={initialSearch}
      canManage={isAdminLevel(currentUser?.role)}
      canDelete={canPermanentlyDelete(currentUser?.role)}
    />
  );
}

export default function StaffPage({ searchParams }) {
  return (
    <Suspense fallback={<DataMasterSkeleton />}>
      <StaffContent searchParams={searchParams} />
    </Suspense>
  );
}
