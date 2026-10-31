import { getMyStudentProfile } from '@/lib/auth/profileService';
import { prisma } from '@/lib/db/prisma';
import { createTransaction } from '@/lib/finance/transactionService';
import { getLocalTodayKey } from './financeUtils';
import { FinanceError } from './routeHelpers';

// Pengajuan perpanjangan paket oleh siswa (halaman Paket Saya).
//
// Alur: siswa memilih paket + metode bayar -> dibuat transaksi PENDING
// (invoice resmi) yang tertaut ke langganan aktifnya bila ada. Langganan
// baru benar-benar diperpanjang/diaktifkan saat Admin/Owner mengubah
// transaksi menjadi LUNAS di grup Finance (logika entitlement yang sama
// dengan pencatatan pembayaran manual). Nominal selalu harga katalog
// dari server, tidak pernah dari client.

export async function createStudentRenewalRequest(user, { packageId, paymentMethod }) {
  const profile = await getMyStudentProfile(user.id);

  if (!profile) {
    throw new FinanceError(
      404,
      'STUDENT_PROFILE_NOT_FOUND',
      'Akun Anda belum terhubung ke profil siswa. Hubungi admin akademi untuk menghubungkannya.'
    );
  }

  if (profile.status === 'INACTIVE') {
    throw new FinanceError(
      409,
      'STUDENT_INACTIVE',
      'Status siswa Anda nonaktif sehingga belum dapat mengajukan perpanjangan. Hubungi admin akademi.'
    );
  }

  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    select: {
      id: true,
      name: true,
      price: true,
      isActive: true,
      defaultTrainingVenueId: true,
    },
  });

  if (!pkg) {
    throw new FinanceError(
      400,
      'INVALID_PACKAGE',
      'Paket yang dipilih tidak ditemukan.'
    );
  }

  if (!pkg.isActive) {
    throw new FinanceError(
      409,
      'PACKAGE_INACTIVE',
      'Paket ini sedang nonaktif. Pilih paket lain yang tersedia.'
    );
  }

  const pendingRequest = await prisma.transaction.findFirst({
    where: {
      studentId: profile.id,
      type: 'SUBSCRIPTION_PAYMENT',
      status: 'PENDING',
    },
    select: { id: true, invoiceNumber: true },
    orderBy: { createdAt: 'desc' },
  });

  if (pendingRequest) {
    throw new FinanceError(
      409,
      'RENEWAL_ALREADY_PENDING',
      `Pengajuan ${pendingRequest.invoiceNumber} masih menunggu konfirmasi pembayaran oleh admin. Selesaikan pembayaran tersebut atau hubungi admin sebelum mengajukan lagi.`
    );
  }

  const activeSubscription = await prisma.subscription.findFirst({
    where: { studentId: profile.id, status: 'ACTIVE' },
    orderBy: { expiresAt: 'desc' },
    select: { id: true },
  });

  const todayKey = getLocalTodayKey();

  return createTransaction(
    {
      studentId: profile.id,
      packageId: pkg.id,
      subscriptionId: activeSubscription?.id ?? null,
      trainingVenueId: pkg.defaultTrainingVenueId ?? null,
      type: 'SUBSCRIPTION_PAYMENT',
      description: null,
      amount: pkg.price,
      paymentMethod,
      status: 'PENDING',
      referenceNumber: null,
      paymentDate: todayKey,
      startDate: todayKey,
      autoRenew: false,
      notes: 'Pengajuan perpanjangan dari dashboard siswa (Paket Saya).',
    },
    user.id
  );
}
