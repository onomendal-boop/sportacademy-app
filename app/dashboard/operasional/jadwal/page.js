import { Suspense } from 'react';
import OverallScheduleManager from '@/components/operational/OverallScheduleManager';
import OperationalSkeleton from '@/components/operational/OperationalSkeleton';
import { requireFeatureAccess } from '@/lib/auth/authService';
import { isAdminLevel, canPermanentlyDelete } from '@/lib/auth/permissions';
import { getCoaches } from '@/lib/data-master/coachService';
import { getTrainingVenues } from '@/lib/data-master/trainingVenueService';
import { getSchedules } from '@/lib/operational/scheduleService';

export const metadata = {
  title: 'Jadwal Keseluruhan | AAA Sport Academy',
  description: 'Kelola seluruh jadwal mingguan AAA Sport Academy.',
};

function getInitialSearch(resolvedSearchParams) {
  const rawQuery = Array.isArray(resolvedSearchParams?.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams?.q;

  return typeof rawQuery === 'string' ? rawQuery.trim().slice(0, 80) : '';
}

async function OverallScheduleContent({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialSearch = getInitialSearch(resolvedSearchParams);
  const currentUser = await requireFeatureAccess(
    'operationalOverview',
    '/dashboard/operasional/jadwal'
  );
  const [schedules, venues, coaches] = await Promise.all([
    getSchedules(currentUser),
    getTrainingVenues(),
    getCoaches(),
  ]);

  return (
    <OverallScheduleManager
      key={initialSearch}
      initialSchedules={schedules}
      initialSearch={initialSearch}
      venues={venues}
      coaches={coaches}
      canManage={isAdminLevel(currentUser?.role)}
      canDelete={canPermanentlyDelete(currentUser?.role)}
      programScope={currentUser?.programScope ?? null}
    />
  );
}

export default function OverallSchedulePage({ searchParams }) {
  return (
    <Suspense fallback={<OperationalSkeleton />}>
      <OverallScheduleContent searchParams={searchParams} />
    </Suspense>
  );
}
