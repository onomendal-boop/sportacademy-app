import { FinanceError } from './routeHelpers';

export async function resolveTrainingVenue(client, trainingVenueId) {
  if (!trainingVenueId) return null;

  const venue = await client.pool.findUnique({
    where: { id: trainingVenueId },
    select: {
      id: true,
      name: true,
      location: true,
      status: true,
    },
  });

  if (!venue) {
    throw new FinanceError(
      400,
      'INVALID_TRAINING_VENUE',
      'Tempat latihan yang dipilih tidak ditemukan.'
    );
  }

  return venue;
}

export async function resolveFinanceStudent(client, studentId) {
  const student = await client.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      age: true,
      parentContact: true,
      level: true,
      status: true,
    },
  });

  if (!student) {
    throw new FinanceError(
      400,
      'INVALID_STUDENT',
      'Siswa yang dipilih tidak ditemukan.'
    );
  }

  if (student.status === 'INACTIVE') {
    throw new FinanceError(
      409,
      'STUDENT_INACTIVE',
      'Siswa nonaktif tidak dapat menerima transaksi/langganan baru.'
    );
  }

  return student;
}

export async function resolveFinancePackage(client, packageId) {
  if (!packageId) return null;

  const pkg = await client.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg) {
    throw new FinanceError(
      400,
      'INVALID_PACKAGE',
      'Paket yang dipilih tidak ditemukan.'
    );
  }

  return pkg;
}
