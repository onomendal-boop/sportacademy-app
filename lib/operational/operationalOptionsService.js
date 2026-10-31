import { prisma } from '@/lib/db/prisma';

export async function getOperationalStudents() {
  const students = await prisma.student.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      level: true,
      status: true,
    },
    orderBy: { name: 'asc' },
  });

  return students;
}

/**
 * Opsi siswa untuk form Raport. Siswa PENDING/COMPLETED tetap disertakan
 * karena raport periode berjalan/akhir program dapat dibuat untuk mereka.
 */
export async function getReportStudents() {
  return prisma.student.findMany({
    where: {
      status: {
        in: ['ACTIVE', 'PENDING', 'COMPLETED'],
      },
    },
    select: {
      id: true,
      name: true,
      age: true,
      parentContact: true,
      level: true,
      status: true,
    },
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
  });
}
