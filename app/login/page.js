import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import LoginFormSkeleton from '@/components/auth/LoginFormSkeleton';
import { getCurrentUser } from '@/lib/auth/authService';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

export const metadata = {
  title: 'Login | AAA Sport Academy',
  description: 'Login ke dashboard AAA Sport Academy.',
};

/**
 * Bagian async ini membaca runtime data:
 * - searchParams untuk parameter ?next=
 * - cookies() melalui getCurrentUser()
 *
 * Karena berada di dalam <Suspense>, Next.js 16 dengan Cache Components
 * dapat mengirim skeleton statis terlebih dahulu tanpa memblokir route.
 */
async function LoginContent({ searchParams }) {
  const params = await searchParams;
  const nextPath = getSafeRedirectPath(params?.next);
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect(nextPath);
  }

  return <LoginForm nextPath={nextPath} />;
}

/**
 * Komponen page terluar tidak mengakses searchParams/cookies secara langsung.
 * Ia hanya meneruskan Promise searchParams ke LoginContent di dalam Suspense.
 */
export default function LoginPage({ searchParams }) {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
