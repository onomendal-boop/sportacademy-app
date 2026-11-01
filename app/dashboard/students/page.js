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

function getInitialSearch(resolvedSearchParams) {
  const rawQuery = Array.isArray(resolvedSearchParams?.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams?.q;

  return typeof rawQuery === 'string' ? rawQuery.trim().slice(0, 80) : '';
}

async function StudentContent({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialSearch = getInitialSearch(resolvedSearchParams);
  const currentUser = await requireFeatureAccess(
    'dataMasterStudents',
    '/dashboard/students'
  );
  const students = await getStudents(currentUser);

  return (
    <StudentManager
      key={initialSearch}
      initialStudents={students}
      initialSearch={initialSearch}
      canManage={isAdminLevel(currentUser?.role)}
      canDelete={canPermanentlyDelete(currentUser?.role)}
      programScope={currentUser?.programScope ?? null}
    />
  );
}

export default function StudentsPage({ searchParams }) {
  return (
    <Suspense fallback={<DataMasterSkeleton />}>
      <StudentContent searchParams={searchParams} />
    </Suspense>
  );
}
