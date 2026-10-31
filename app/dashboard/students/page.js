import { Suspense } from 'react';
import DataMasterSkeleton from '@/components/data-master/DataMasterSkeleton';
import StudentManager from '@/components/data-master/StudentManager';
import { requireFeatureAccess } from '@/lib/auth/authService';
import { isAdminLevel, canPermanentlyDelete } from '@/lib/auth/permissions';
import { getStudents } from '@/lib/data-master/studentService';

export const metadata = {
  title: 'Data Master Siswa | AAA Sport Academy',
  description: 'Kelola data siswa AAA Sport Academy.',
};

async function StudentContent() {
  const [currentUser, students] = await Promise.all([
    requireFeatureAccess('dataMasterStudents', '/dashboard/students'),
    getStudents(),
  ]);

  return (
    <StudentManager
      initialStudents={students}
      canManage={isAdminLevel(currentUser?.role)}
      canDelete={canPermanentlyDelete(currentUser?.role)}
    />
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<DataMasterSkeleton />}>
      <StudentContent />
    </Suspense>
  );
}
