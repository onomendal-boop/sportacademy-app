import { Suspense } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import DashboardShellSkeleton from '@/components/dashboard/DashboardShellSkeleton';
import { requireCurrentUser } from '@/lib/auth/authService';
import { getNewLeadCount } from '@/lib/dashboard/notificationService';

// Seluruh segment /dashboard adalah area privat. Layout harus menunggu
// request nyata untuk membaca cookie, memverifikasi masa berlaku token,
// dan mengambil user aktif dari database sebelum shell/children boleh
// ditampilkan. Karena tidak ada static shell terautentikasi yang aman
// untuk diprerender, segment layout ini secara eksplisit diizinkan
// menjadi blocking route. Konfigurasi ini hanya mengecualikan layout
// dashboard dari Instant Navigation validation; halaman descendant tetap
// memakai <Suspense> masing-masing untuk data request-time mereka.
export const instant = false;

/**
 * Bagian async ini membaca cookie session melalui requireCurrentUser().
 * Pemeriksaan auth dilakukan di dalam <Suspense> agar kompatibel dengan
 * Cache Components Next.js 16 dan tidak memblokir prerender shell route.
 */
async function AuthenticatedDashboard({ children }) {
  const user = await requireCurrentUser('/dashboard');
  let initialLeadBadgeCount = 0;

  try {
    initialLeadBadgeCount = await getNewLeadCount(user);
  } catch (error) {
    console.error('[dashboard-layout:lead-badge]', error);
  }

  return (
    <DashboardShell user={user} initialLeadBadgeCount={initialLeadBadgeCount}>
      {children}
    </DashboardShell>
  );
}

/**
 * Auth guard untuk seluruh route /dashboard/*.
 * Jika session tidak ada/tidak valid, requireCurrentUser() me-redirect
 * ke /login sebelum DashboardShell dan children ditampilkan.
 */
export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <AuthenticatedDashboard>{children}</AuthenticatedDashboard>
    </Suspense>
  );
}
