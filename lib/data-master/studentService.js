import { prisma } from '@/lib/db/prisma';
import { DataMasterError } from './routeHelpers';

// Data Siswa memakai model Student yang juga digunakan Operasional
// (opsi booking Private) dan Finance (opsi pembayaran/langganan).
// healthHistory adalah data sensitif: hanya dikembalikan oleh service ini
// untuk halaman Data Master Siswa, bukan oleh service opsi grup lain.

const studentInclude = {
  user: {
    select: {
      id: true,
      username: true,
      email: true,
      profileImage: true,
      isActive: true,
    },
  },
  _count: {
    select: {
      subscriptions: true,
      transactions: true,
      bookings: true,
      reports: true,
    },
  },
};

function toDateOnly(value) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export function mapStudent(student) {
  return {
    id: student.id,
    userId: student.userId ?? null,
    name: student.name,
    dateOfBirth: student.dateOfBirth
      ? student.dateOfBirth.toISOString().slice(0, 10)
      : '',
    age: student.age,
    parentContact: student.parentContact,
    healthHistory: student.healthHistory ?? '',
    level: student.level,
    status: student.status,
    account: student.user
      ? {
          id: student.user.id,
          username: student.user.username,
          email: student.user.email,
          profileImage: student.user.profileImage ?? '',
          isActive: student.user.isActive,
        }
      : null,
    subscriptionCount: student._count?.subscriptions ?? 0,
    transactionCount: student._count?.transactions ?? 0,
    bookingCount: student._count?.bookings ?? 0,
    reportCount: student._count?.reports ?? 0,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
  };
}

function toStudentWriteData(data) {
  return {
    name: data.name,
    dateOfBirth: toDateOnly(data.dateOfBirth),
    age: data.age,
    parentContact: data.parentContact,
    healthHistory: data.healthHistory,
    level: data.level,
    status: data.status,
  };
}

export async function getStudents() {
  const students = await prisma.student.findMany({
    include: studentInclude,
    orderBy: [{ status: 'asc' }, { level: 'asc' }, { name: 'asc' }],
  });

  return students.map(mapStudent);
}

export async function createStudent(data) {
  const student = await prisma.student.create({
    data: toStudentWriteData(data),
    include: studentInclude,
  });

  return mapStudent(student);
}

export async function updateStudent(id, data) {
  const existing = await prisma.student.findUnique({
    where: { id },
    select: { id: true, userId: true, name: true },
  });

  if (!existing) {
    throw new DataMasterError(404, 'NOT_FOUND', 'Siswa tidak ditemukan.');
  }

  // Nama pada akun login STUDENT yang terhubung diselaraskan dengan nama
  // profil siswa agar dashboard siswa menampilkan nama yang sama.
  const student = await prisma.$transaction(async (tx) => {
    const updated = await tx.student.update({
      where: { id },
      data: toStudentWriteData(data),
      include: studentInclude,
    });

    if (existing.userId && existing.name !== data.name) {
      await tx.user.update({
        where: { id: existing.userId },
        data: { name: data.name },
      });
    }

    return updated;
  });

  return mapStudent(student);
}

export async function deleteStudent(id) {
  const existing = await prisma.student.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      _count: {
        select: {
          subscriptions: true,
          transactions: true,
          bookings: true,
          reports: true,
        },
      },
    },
  });

  if (!existing) {
    throw new DataMasterError(404, 'NOT_FOUND', 'Siswa tidak ditemukan.');
  }

  const { subscriptions, transactions, bookings, reports } = existing._count;

  // Subscription, Booking, dan StudentReport memakai onDelete Restrict di
  // schema, dan histori Transaction harus tetap terhubung untuk audit
  // Finance. Karena itu siswa bersejarah tidak dihapus permanen.
  if (subscriptions > 0 || transactions > 0 || bookings > 0 || reports > 0) {
    throw new DataMasterError(
      409,
      'STUDENT_HAS_HISTORY',
      'Siswa sudah memiliki riwayat langganan, transaksi, booking, atau raport sehingga tidak dapat dihapus. Ubah status menjadi Nonaktif agar histori tetap terjaga.'
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.student.delete({ where: { id } });

    // Akun login STUDENT yang terhubung ikut dihapus agar tidak menjadi
    // akun yatim yang masih bisa masuk dashboard tanpa profil siswa.
    if (existing.userId) {
      await tx.user.deleteMany({
        where: { id: existing.userId, role: 'STUDENT' },
      });
    }
  });

  return { ok: true };
}
