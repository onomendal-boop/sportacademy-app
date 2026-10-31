import { Suspense } from 'react';
import { requireFeatureAccess } from '@/lib/auth/authService';

// Halaman Marketing adalah Client Component mock, sehingga guard role
// diletakkan pada layout segment ini (pola async child + Suspense yang
// sama dengan halaman dashboard lain).
async function MarketingGuard({ children }) {
  await requireFeatureAccess('marketing', '/dashboard/marketing/campaign');
  return children;
}

function MarketingFallback() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-8 w-56 animate-pulse rounded-xl bg-slate-200/70" />
      <div className="h-64 animate-pulse rounded-3xl bg-slate-200/60" />
    </div>
  );
}

export default function MarketingLayout({ children }) {
  return (
    <Suspense fallback={<MarketingFallback />}>
      <MarketingGuard>{children}</MarketingGuard>
    </Suspense>
  );
}
