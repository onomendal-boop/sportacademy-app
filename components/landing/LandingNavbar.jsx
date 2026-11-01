'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, Waves, X } from 'lucide-react';

const navigationItems = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Promo', href: '#promo' },
  { label: 'Program', href: '#program' },
  { label: 'Testimoni', href: '#testimoni' },
  { label: 'Blog', href: '#blog' },
  { label: 'FAQ', href: '#faq' },
];

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function LandingNavbar({ businessName = 'AAA Sport Academy', tagline = 'Swimming Academy', logoDataUrl = '' }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 16);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';

    function handleEscape(event) {
      if (event.key === 'Escape') setIsMobileOpen(false);
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileOpen]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        isScrolled || isMobileOpen
          ? 'border-b border-blue-100 bg-white/95 shadow-lg shadow-blue-950/5 backdrop-blur'
          : 'border-b border-white/40 bg-white/75 backdrop-blur'
      )}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="#beranda"
          onClick={() => setIsMobileOpen(false)}
          className="flex min-w-0 items-center gap-3"
          aria-label={`${businessName} - kembali ke beranda`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0066CC] text-white shadow-sm shadow-blue-600/30">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="" className="h-full w-full bg-white object-contain p-1" />
            ) : (
              <Waves className="h-6 w-6" strokeWidth={2.2} />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-extrabold leading-tight text-slate-900">
              {businessName}
            </span>
            <span className="block text-xs font-medium text-slate-500">{tagline}</span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-[#0066CC]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Link
            href="/dashboard"
            className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-[#0066CC] xl:inline-flex"
          >
            Masuk Dashboard
          </Link>
          <Link
            href="#daftar"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#0066CC] px-5 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-[#0052A3]"
          >
            Daftar Sekarang
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-expanded={isMobileOpen}
          aria-label={isMobileOpen ? 'Tutup menu' : 'Buka menu'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#0066CC] lg:hidden"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMobileOpen ? (
        <nav
          aria-label="Navigasi mobile"
          className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 lg:hidden"
        >
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="flex rounded-xl px-3 py-3 text-base font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#0066CC]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="#daftar"
            onClick={() => setIsMobileOpen(false)}
            className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-[#0066CC] text-sm font-bold text-white shadow-sm shadow-blue-600/25"
          >
            Daftar Sekarang
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setIsMobileOpen(false)}
            className="mt-2 flex h-12 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#0066CC]"
          >
            Masuk Dashboard
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
