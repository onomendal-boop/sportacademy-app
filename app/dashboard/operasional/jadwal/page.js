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

async function OverallScheduleContent() {
  const [currentUser, schedules, venues, coaches] = await Promise.all([
    requireFeatureAccess('operationalOverview', '/dashboard/operasional/jadwal'),
    getSchedules(),
    getTrainingVenues(),
    getCoaches(),
  ]);

  return (
    <OverallScheduleManager
      initialSchedules={schedules}
      venues={venues}
      coaches={coaches}
      canManage={isAdminLevel(currentUser?.role)}
      canDelete={canPermanentlyDelete(currentUser?.role)}
    />
  );
}

export default function OverallSchedulePage() {
  return (
    <Suspense fallback={<OperationalSkeleton />}>
      <OverallScheduleContent />
    </Suspense>
  );
}
