'use client';

import Link from 'next/link';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
  Waves,
} from 'lucide-react';
import useLoginForm from '@/hooks/useLoginForm';

/**
 * Komponen tampilan login.
 * Seluruh logika form berada di useLoginForm agar UI dan fungsi terpisah.
 */
export default function LoginForm({ nextPath = '/dashboard' }) {
  const {
    register,
    errors,
    isSubmitting,
    serverError,
    showPassword,
    onTogglePassword,
    onSubmit,
  } = useLoginForm({ nextPath });

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

      <section className="relative w-full max-w-md rounded-[28px] border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-950/10 sm:p-8">
        <div className="text-center">
          <Link
            href="/"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0066CC] to-cyan-400 text-white shadow-lg shadow-blue-600/25"
            aria-label="Kembali ke beranda AAA Sport Academy"
          >
            <Waves className="h-9 w-9" aria-hidden="true" />
          </Link>

          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0066CC]">
            AAA Sport Academy
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-slate-900">
            Selamat Datang
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Masuk menggunakan username untuk mengakses dashboard akademi.
          </p>
        </div>

        {serverError ? (
          <div
            role="alert"
            className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
          <div>
            <label htmlFor="username" className="text-sm font-bold text-slate-700">
              Username
            </label>
            <div className="relative mt-2">
              <User
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Masukkan username"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? 'username-error' : undefined}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 aria-[invalid=true]:border-red-300 aria-[invalid=true]:focus:ring-red-500/10"
                {...register('username')}
              />
            </div>
            {errors.username ? (
              <p id="username-error" className="mt-2 text-sm font-medium text-red-600">
                {errors.username.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-bold text-slate-700">
              Password
            </label>
            <div className="relative mt-2">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 aria-[invalid=true]:border-red-300 aria-[invalid=true]:focus:ring-red-500/10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={onTogglePassword}
                disabled={isSubmitting}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p id="password-error" className="mt-2 text-sm font-medium text-red-600">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0066CC] text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#0052A3] focus:outline-none focus:ring-4 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Memproses Login...
              </>
            ) : (
              'Masuk Dashboard'
            )}
          </button>
        </form>


        <p className="mt-6 text-center text-xs text-slate-400">
          Lupa password? Hubungi admin AAA Sport Academy.
        </p>
      </section>
    </main>
  );
}
