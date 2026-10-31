import { Suspense } from 'react';
import DataMasterSkeleton from '@/components/data-master/DataMasterSkeleton';
import TrainingVenueManager from '@/components/data-master/TrainingVenueManager';
import { requireFeatureAccess } from '@/lib/auth/authService';
import { isAdminLevel, canPermanentlyDelete } from '@/lib/auth/permissions';
import { getTrainingVenues } from '@/lib/data-master/trainingVenueService';

export const metadata = {
  title: 'Data Master Tempat Latihan | AAA Sport Academy',
  description: 'Kelola tempat latihan AAA Sport Academy.',
};

async function TrainingVenueContent() {
  const [currentUser, venues] = await Promise.all([
    requireFeatureAccess('dataMasterVenues', '/dashboard/data-master/tempat-latihan'),
    getTrainingVenues(),
  ]);

  return (
    <TrainingVenueManager
      initialVenues={venues}
      canManage={isAdminLevel(currentUser?.role)}
      canDelete={canPermanentlyDelete(currentUser?.role)}
    />
  );
}

export default function TrainingVenuePage() {
  return (
    <Suspense fallback={<DataMasterSkeleton />}>
      <TrainingVenueContent />
    </Suspense>
  );
}
