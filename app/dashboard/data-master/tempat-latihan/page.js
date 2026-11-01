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

function getInitialSearch(resolvedSearchParams) {
  const rawQuery = Array.isArray(resolvedSearchParams?.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams?.q;

  return typeof rawQuery === 'string' ? rawQuery.trim().slice(0, 80) : '';
}

async function TrainingVenueContent({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialSearch = getInitialSearch(resolvedSearchParams);
  const [currentUser, venues] = await Promise.all([
    requireFeatureAccess('dataMasterVenues', '/dashboard/data-master/tempat-latihan'),
    getTrainingVenues(),
  ]);

  return (
    <TrainingVenueManager
      key={initialSearch}
      initialVenues={venues}
      initialSearch={initialSearch}
      canManage={isAdminLevel(currentUser?.role)}
      canDelete={canPermanentlyDelete(currentUser?.role)}
    />
  );
}

export default function TrainingVenuePage({ searchParams }) {
  return (
    <Suspense fallback={<DataMasterSkeleton />}>
      <TrainingVenueContent searchParams={searchParams} />
    </Suspense>
  );
}
