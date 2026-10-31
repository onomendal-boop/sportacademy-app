/**
 * Skeleton statis untuk halaman Operasional saat Server Component
 * mengambil session, jadwal, pelatih, siswa, dan tempat latihan.
 */
export default function OperationalSkeleton() {
  return (
    <div className="space-y-6" aria-label="Memuat operasional" aria-busy="true">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-3 w-32 animate-pulse rounded-full bg-blue-100" />
          <div className="mt-3 h-9 w-64 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-[420px] max-w-full animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="h-11 w-40 animate-pulse rounded-xl bg-[#0066CC]/25" />
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
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-5 w-52 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
              {index % 2 === 0 ? (
                <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
