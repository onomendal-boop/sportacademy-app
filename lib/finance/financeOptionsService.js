import { getProgramScope } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

/**
 * Opsi siswa untuk form Finance. Siswa PENDING tetap disertakan karena
 * pembayaran pendaftaran/langganan pertama dapat mengaktifkannya.
 */
export async function getFinanceStudents(actor = null) {
  const programScope = actor?.role === 'ADMIN' ? getProgramScope(actor) : null;

  if (actor?.role === 'ADMIN' && !programScope) return [];

  return prisma.student.findMany({
    where: {
      status: {
        in: ['ACTIVE', 'PENDING'],
      },
      ...(programScope ? { level: programScope } : {}),
    },
    select: {
      id: true,
      name: true,
      age: true,
      parentContact: true,
      level: true,
      status: true,
    },
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
  });
}
