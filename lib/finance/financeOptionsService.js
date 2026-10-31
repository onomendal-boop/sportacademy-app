import { prisma } from '@/lib/db/prisma';

/**
 * Opsi siswa untuk form Finance. Siswa PENDING tetap disertakan karena
 * pembayaran pendaftaran/langganan pertama dapat mengaktifkannya.
 */
export async function getFinanceStudents() {
  return prisma.student.findMany({
    where: {
      status: {
        in: ['ACTIVE', 'PENDING'],
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
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
  });
}
