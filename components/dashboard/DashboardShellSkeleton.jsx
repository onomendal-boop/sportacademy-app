import { Waves } from 'lucide-react';

/**
 * Placeholder statis untuk Suspense guard dashboard.
 * Tidak ada data/children dashboard yang ditampilkan sebelum auth selesai.
 */
export default function DashboardShellSkeleton() {
  return (
    <div
      className="min-h-screen bg-[#F8FAFC] text-slate-900"
      aria-label="Memeriksa session dashboard"
      aria-busy="true"
    >
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-[72px] items-center gap-3 border-b border-slate-100 px-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0066CC] text-white">
            <Waves className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>

        <div className="space-y-3 px-5 py-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-11 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="flex h-[72px] items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100 lg:hidden" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="h-3 w-56 max-w-full animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="hidden h-10 w-64 animate-pulse rounded-xl bg-slate-100 md:block" />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 w-10 animate-pulse rounded-full bg-blue-100" />
        </header>

        <main className="mx-auto grid w-full max-w-[1600px] gap-5 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4 lg:p-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white"
            />
          ))}
          <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white sm:col-span-2 xl:col-span-4" />
        </main>
      </div>
    </div>
  );
}
