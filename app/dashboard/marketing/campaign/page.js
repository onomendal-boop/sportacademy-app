import { Suspense } from 'react';
import CampaignManager from '@/components/marketing/CampaignManager';
import Card from '@/components/ui/Card';
import { requireFeatureAccess } from '@/lib/auth/authService';
import { getPromotions } from '@/lib/marketing/promotionService';

export const metadata = {
  title: 'Campaign Manager | AAA Sport Academy',
  description: 'Kelola campaign, flash sale, voucher, dan referral dari database.',
};

function CampaignPageSkeleton() {
  return (
    <div role="status" aria-label="Memuat campaign" className="space-y-4 sm:space-y-6">
      <span className="sr-only">Memuat data campaign dari database...</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padded>
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
            <div className="mt-4 h-4 w-28 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-7 w-20 animate-pulse rounded bg-slate-200" />
          </Card>
        ))}
      </div>
      <Card padded>
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </Card>
    </div>
  );
}

async function CampaignContent() {
  const currentUser = await requireFeatureAccess(
    'marketing',
    '/dashboard/marketing/campaign'
  );
  const promotions = await getPromotions(currentUser);

  return <CampaignManager initialPromotions={promotions} />;
}

export default function CampaignPage() {
  return (
    <Suspense fallback={<CampaignPageSkeleton />}>
      <CampaignContent />
    </Suspense>
  );
}
