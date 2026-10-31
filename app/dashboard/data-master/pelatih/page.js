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

async function CoachContent() {
  const [currentUser, coaches] = await Promise.all([
    requireFeatureAccess('dataMasterCoaches', '/dashboard/data-master/pelatih'),
    getCoaches(),
  ]);

  return (
    <CoachManager
      initialCoaches={coaches}
      canManage={isAdminLevel(currentUser?.role)}
      canDelete={canPermanentlyDelete(currentUser?.role)}
    />
  );
}

export default function CoachPage() {
  return (
    <Suspense fallback={<DataMasterSkeleton />}>
      <CoachContent />
    </Suspense>
  );
}
