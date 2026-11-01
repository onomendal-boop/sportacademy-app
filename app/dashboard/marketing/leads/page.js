import { Suspense } from 'react';
import LeadsManager from '@/components/marketing/LeadsManager';
import Card from '@/components/ui/Card';
import { requireFeatureAccess } from '@/lib/auth/authService';
import { getLeadOptions, getLeads } from '@/lib/marketing/leadService';

export const metadata = {
  title: 'Leads / Funnel | AAA Sport Academy',
  description: 'Kelola lead pendaftaran AAA Sport Academy dari database.',
};

function LeadsPageSkeleton() {
  return (
    <div role="status" aria-label="Memuat leads" className="space-y-4 sm:space-y-6">
      <span className="sr-only">Memuat inbox leads dari database...</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padded>
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
            <div className="mt-4 h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <Card padded className="xl:col-span-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="mb-3 h-20 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </Card>
        <Card padded className="xl:col-span-3">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

async function LeadsContent() {
  const currentUser = await requireFeatureAccess(
    'marketing',
    '/dashboard/marketing/leads'
  );
  const [leads, options] = await Promise.all([
    getLeads(currentUser),
    getLeadOptions(currentUser),
  ]);

  return (
    <LeadsManager
      initialLeads={leads}
      poolOptions={options.venues.map((venue) => venue.name)}
      assignees={options.assignees}
    />
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<LeadsPageSkeleton />}>
      <LeadsContent />
    </Suspense>
  );
}
