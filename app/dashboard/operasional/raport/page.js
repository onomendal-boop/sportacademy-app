import { Suspense } from 'react';
import OperationalSkeleton from '@/components/operational/OperationalSkeleton';
import StudentReportManager from '@/components/operational/StudentReportManager';
import { requireFeatureAccess } from '@/lib/auth/authService';
import { canPermanentlyDelete, REPORT_EDITOR_ROLES } from '@/lib/auth/permissions';
import { getMyStudentProfile } from '@/lib/auth/profileService';
import { getCoaches } from '@/lib/data-master/coachService';
import { getReportStudents } from '@/lib/operational/operationalOptionsService';
import { getReports } from '@/lib/operational/reportService';

export const metadata = {
  title: 'Raport Siswa | AAA Sport Academy',
  description:
    'Kelola raport perkembangan kompetensi renang siswa AAA Sport Academy.',
};

async function StudentReportContent() {
  const currentUser = await requireFeatureAccess(
    'studentReports',
    '/dashboard/operasional/raport'
  );
  const role = currentUser?.role;

  // Siswa hanya melihat raport miliknya sendiri dan tidak menerima
  // daftar opsi siswa/pelatih milik pengguna lain.
  if (role === 'STUDENT') {
    const profile = await getMyStudentProfile(currentUser.id);
    const reports = profile ? await getReports(profile.id) : [];

    return (
      <StudentReportManager
        initialReports={reports}
        students={[]}
        coaches={[]}
        canManage={false}
        canDelete={false}
        currentUser={{ id: currentUser.id, name: currentUser.name, role }}
      />
    );
  }

  const [reports, students, coaches] = await Promise.all([
    getReports(),
    getReportStudents(),
    getCoaches(),
  ]);

  return (
    <StudentReportManager
      initialReports={reports}
      students={students}
      coaches={coaches}
      canManage={REPORT_EDITOR_ROLES.includes(role)}
      canDelete={canPermanentlyDelete(role)}
      currentUser={
        currentUser
          ? { id: currentUser.id, name: currentUser.name, role }
          : null
      }
    />
  );
}

export default function StudentReportPage() {
  return (
    <Suspense fallback={<OperationalSkeleton />}>
      <StudentReportContent />
    </Suspense>
  );
}
