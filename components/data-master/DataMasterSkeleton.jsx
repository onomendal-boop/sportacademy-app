/**
 * Skeleton statis untuk halaman Data Master while Server Component
 * mengambil session dan data database di dalam Suspense.
 */
export default function DataMasterSkeleton() {
  return (
    <div className="space-y-6" aria-label="Memuat Data Master" aria-busy="true">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-3 w-28 animate-pulse rounded-full bg-blue-100" />
          <div className="mt-3 h-9 w-56 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="h-11 w-36 animate-pulse rounded-xl bg-[#0066CC]/25" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white"
          />
        ))}
      </div>

      <div className="h-20 animate-pulse rounded-3xl border border-slate-200 bg-white" />

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="h-14 animate-pulse bg-slate-50" />
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-t border-slate-100 px-5 py-4">
            <div className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded-full bg-slate-200" />
              <div className="h-3 w-32 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="hidden h-7 w-20 animate-pulse rounded-full bg-slate-100 sm:block" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
