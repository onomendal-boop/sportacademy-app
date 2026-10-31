import { Waves } from 'lucide-react';

/**
 * Placeholder statis untuk Suspense di route /login.
 * Ditampilkan selagi Server Component membaca searchParams dan cookie.
 */
export default function LoginFormSkeleton() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 py-10">
      <div
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#0066CC]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl"
        aria-hidden="true"
      />
      <Waves
        className="pointer-events-none absolute -bottom-10 -left-8 h-56 w-56 text-[#0066CC]/5"
        aria-hidden="true"
      />

      <section
        className="relative w-full max-w-md rounded-[28px] border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-950/10 sm:p-8"
        aria-label="Memuat halaman login"
        aria-busy="true"
      >
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0066CC] to-cyan-400 text-white shadow-lg shadow-blue-600/25">
            <Waves className="h-9 w-9" aria-hidden="true" />
          </span>
          <div className="mt-5 h-3 w-32 animate-pulse rounded-full bg-blue-100" />
          <div className="mt-3 h-8 w-48 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded-full bg-slate-100" />
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-2 h-12 animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <div>
            <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-2 h-12 animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <div className="h-12 animate-pulse rounded-2xl bg-[#0066CC]/30" />
        </div>

        <p className="mt-6 text-center text-xs font-medium text-slate-400">
          Memeriksa session...
        </p>
      </section>
    </main>
  );
}
