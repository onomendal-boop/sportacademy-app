import { getProgramScope } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

function getScopedLevelFilter(actor) {
  if (actor?.role !== 'ADMIN') return { hasAccess: true, level: null };

  const level = getProgramScope(actor);
  return { hasAccess: Boolean(level), level };
}

export async function getOperationalStudents(actor = null) {
  const scope = getScopedLevelFilter(actor);
  if (!scope.hasAccess) return [];

  const students = await prisma.student.findMany({
    where: {
      status: 'ACTIVE',
      ...(scope.level ? { level: scope.level } : {}),
    },
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
export async function getReportStudents(actor = null) {
  const scope = getScopedLevelFilter(actor);
  if (!scope.hasAccess) return [];

  return prisma.student.findMany({
    where: {
      status: {
        in: ['ACTIVE', 'PENDING', 'COMPLETED'],
      },
      ...(scope.level ? { level: scope.level } : {}),
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
