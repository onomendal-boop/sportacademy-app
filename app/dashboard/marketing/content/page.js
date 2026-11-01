import { Suspense } from 'react';
import ContentHubManager from '@/components/marketing/ContentHubManager';
import Card from '@/components/ui/Card';
import { requireFeatureAccess } from '@/lib/auth/authService';
import { getArticles } from '@/lib/marketing/articleService';

export const metadata = {
  title: 'Content Hub | AAA Sport Academy',
  description: 'Kelola artikel blog AAA Sport Academy dari database.',
};

function ContentPageSkeleton() {
  return (
    <div role="status" aria-label="Memuat artikel" className="space-y-4">
      <span className="sr-only">Memuat Content Hub dari database...</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padded>
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
            <div className="mt-4 h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
          </Card>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} padded>
          <div className="flex gap-4">
            <div className="h-28 w-40 animate-pulse rounded-2xl bg-slate-200" />
            <div className="flex-1 space-y-3 py-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

async function ContentHubContent() {
  const currentUser = await requireFeatureAccess(
    'marketing',
    '/dashboard/marketing/content'
  );
  const articles = await getArticles(currentUser);

  return (
    <ContentHubManager
      initialArticles={articles}
      currentAuthorName={currentUser.name}
    />
  );
}

export default function ContentHubPage() {
  return (
    <Suspense fallback={<ContentPageSkeleton />}>
      <ContentHubContent />
    </Suspense>
  );
}
