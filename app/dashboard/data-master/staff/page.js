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

async function StaffContent() {
  const [currentUser, staff] = await Promise.all([
    requireFeatureAccess('dataMasterStaff', '/dashboard/data-master/staff'),
    getStaff(),
  ]);

  return (
    <StaffManager
      initialStaff={staff}
      canManage={isAdminLevel(currentUser?.role)}
      canDelete={canPermanentlyDelete(currentUser?.role)}
    />
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={<DataMasterSkeleton />}>
      <StaffContent />
    </Suspense>
  );
}
