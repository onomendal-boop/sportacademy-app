import Image from 'next/image';
import Link from 'next/link';
import { cacheLife } from 'next/cache';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
  Trophy,
  User,
  Users,
  Waves,
} from 'lucide-react';

import {
  getArticles,
  getFaqItems,
  getLandingPrograms,
  getLandingSettings,
  getLandingStats,
  getPromos,
  getTestimonials,
} from '../lib/public-data';
import LandingNavbar from '../components/landing/LandingNavbar';
import CopyPromoButton from '../components/landing/CopyPromoButton';
import TestimonialSlider from '../components/landing/TestimonialSlider';
import FaqAccordion from '../components/landing/FaqAccordion';
import RegistrationCta from '../components/landing/RegistrationCta';

export const metadata = {
  title: 'AAA Sport Academy | Les Renang Anak, Atlet & Private',
  description:
    'AAA Sport Academy menyediakan program les renang AAA Sport Academy, A3, SWDC Swimmer, dan Private dengan pelatih berpengalaman serta kelompok belajar yang aman.',
  keywords: ['les renang anak', 'sekolah renang', 'renang private', 'AAA Sport Academy'],
  openGraph: {
    title: 'AAA Sport Academy | Swimming Academy',
    description:
      'Program renang untuk pemula hingga atlet dengan kurikulum bertahap, pelatih berpengalaman, dan jadwal fleksibel.',
    images: ['/images/hero-swimming.jpg'],
    type: 'website',
  },
};

const FEATURE_ICONS = {
  'shield-check': ShieldCheck,
  users: Users,
  'badge-check': BadgeCheck,
  'calendar-days': CalendarDays,
};

const categoryGradients = {
  'Tips Renang': 'from-[#0066CC] to-cyan-400',
  'Kesehatan Anak': 'from-emerald-600 to-teal-400',
  Prestasi: 'from-indigo-700 to-blue-500',
  Parenting: 'from-sky-700 to-blue-400',
  Promo: 'from-amber-500 to-orange-400',
  Event: 'from-cyan-700 to-sky-400',
};

const PROGRAM_ICONS = {
  AAA: Sprout,
  A3: TrendingUp,
  SWDC: Trophy,
  PRIVATE: User,
  sprout: Sprout,
  'trending-up': TrendingUp,
  trophy: Trophy,
  user: User,
};

function formatPhoneHref(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return `tel:+${digits.startsWith('0') ? `62${digits.slice(1)}` : digits}`;
}

function formatOperatingHours(hours = []) {
  const openDays = hours.filter((item) => item.isOpen);
  if (!openDays.length) return 'Hubungi admin untuk jam operasional';

  const starts = openDays.map((item) => item.start).sort();
  const ends = openDays.map((item) => item.end).sort();
  const dayNames = openDays.map((item) => item.day);
  const dayLabel = dayNames.length === 7
    ? 'Senin-Minggu'
    : `${dayNames[0]}-${dayNames[dayNames.length - 1]}`;

  return `${dayLabel} • ${starts[0]}-${ends[ends.length - 1]} WIB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

async function getCurrentYear() {
  'use cache';
  cacheLife('max');

  return new Date().getFullYear();
}

function SectionHeading({ eyebrow, title, description, align = 'center' }) {
  const alignClassName = align === 'left' ? 'text-left' : 'mx-auto text-center';

  return (
    <div className={`max-w-3xl ${alignClassName}`}>
      <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#0066CC] ring-1 ring-inset ring-blue-600/10">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </p>
      <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-pretty text-base leading-relaxed text-slate-500 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ArticleImage({ article }) {
  if (article.featuredImageUrl) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <Image
          src={article.featuredImageUrl}
          alt={article.featuredImageAlt || article.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br text-white ${categoryGradients[article.category] ?? categoryGradients['Tips Renang']}`}
      role="img"
      aria-label={article.featuredImageAlt || article.title}
    >
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15" />
      <div className="absolute -bottom-14 -left-8 h-40 w-40 rounded-full bg-white/10" />
      <Waves className="relative h-16 w-16 opacity-95 transition-transform duration-500 group-hover:scale-110" />
      <span className="absolute bottom-4 left-5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
        {article.category}
      </span>
    </div>
  );
}

export default async function HomePage() {
  const [
    promos,
    articles,
    programs,
    testimonials,
    faqItems,
    settings,
    landingStats,
    currentYear,
  ] = await Promise.all([
    getPromos({ limit: 3 }),
    getArticles({ limit: 3 }),
    getLandingPrograms(),
    getTestimonials(),
    getFaqItems(),
    getLandingSettings(),
    getLandingStats(),
    getCurrentYear(),
  ]);
  const heroStats = landingStats.slice(0, 3);
  const academyFeatures = settings?.academyFeatures ?? [];
  const businessName = settings?.businessName || 'AAA Sport Academy';
  const phoneHref = formatPhoneHref(settings?.phone);
  const operatingHoursLabel = formatOperatingHours(settings?.operatingHours);
  const venueLabel = settings?.venueNames?.length
    ? settings.venueNames.join(' & ')
    : settings?.address || 'Tempat latihan diumumkan oleh admin';

  return (
    <>
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[#0066CC] focus:px-4 focus:py-2 focus:font-bold focus:text-white"
      >
        Lewati ke konten
      </a>

      <LandingNavbar businessName={businessName} tagline={settings?.tagline || "Swimming Academy"} logoDataUrl={settings?.logoDataUrl || ""} />

      <main id="konten">
        {/* ------------------------------------------------------------------ */}
        {/* HERO                                                               */}
        {/* ------------------------------------------------------------------ */}
        <section id="beranda" className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white pt-[72px]">
          <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-cyan-200/35 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-32 top-72 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pb-24 lg:pt-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[#0066CC] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Pendaftaran Kelas Baru Dibuka
              </p>

              <h1 className="mt-6 max-w-2xl text-balance text-[42px] font-extrabold leading-[1.05] tracking-tight text-slate-950 sm:text-6xl lg:text-[64px]">
                Berani di Air, Tumbuh Percaya Diri,{' '}
                <span className="text-[#0066CC]">Berprestasi</span> di Kolam.
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
                AAA Sport Academy membantu anak dan remaja belajar renang secara aman dan bertahap —
                dari pemula yang baru mengenal air, kelas menengah, private 1-on-1, hingga atlet
                yang mempersiapkan kompetisi.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#daftar"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#0066CC] px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-[#0052A3]"
                >
                  Daftar Sekarang
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="#program"
                  className="inline-flex h-13 items-center justify-center rounded-full border border-blue-200 bg-white px-7 py-3.5 text-base font-bold text-[#0066CC] transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Lihat Program
                </Link>
              </div>

              <dl className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-blue-100 rounded-3xl border border-blue-100 bg-white/85 py-4 shadow-sm backdrop-blur">
                {heroStats.map(({ displayValue: value, label }) => (
                  <div key={label} className="px-3 text-center sm:px-5">
                    <dt className="order-2 mt-1 block text-[11px] font-semibold leading-tight text-slate-500 sm:text-xs">
                      {label}
                    </dt>
                    <dd className="text-xl font-extrabold text-slate-950 sm:text-2xl">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative mx-auto w-full max-w-[640px] lg:max-w-none">
              <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-tr from-[#0066CC]/20 via-cyan-200/40 to-transparent blur-xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[32px] border-4 border-white bg-blue-100 shadow-2xl shadow-blue-950/20">
                <Image
                  src="/images/hero-swimming.jpg"
                  alt="Pelatih AAA Sport Academy membimbing dua anak belajar renang dengan kickboard"
                  width={1536}
                  height={1024}
                  priority
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="aspect-[4/3] w-full object-cover sm:aspect-[3/2]"
                />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-blue-950/35 to-transparent" aria-hidden="true" />
              </div>

              <div className="absolute -left-3 top-5 hidden items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-xl shadow-blue-950/10 backdrop-blur sm:flex">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-slate-900">Belajar Aman</span>
                  <span className="block text-xs text-slate-500">Pendampingan pelatih</span>
                </span>
              </div>

              <div className="absolute -bottom-5 right-4 flex items-center gap-3 rounded-2xl bg-[#0066CC] px-4 py-3 text-white shadow-xl shadow-blue-700/30 sm:right-8">
                <Users className="h-7 w-7 shrink-0" />
                <span>
                  <span className="block text-sm font-extrabold">Kelompok Kecil</span>
                  <span className="block text-xs text-blue-100">Perhatian lebih personal</span>
                </span>
              </div>
            </div>
          </div>

          {academyFeatures.length ? (
          <div className="relative mx-auto grid w-full max-w-7xl gap-3 px-4 pb-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {academyFeatures.map((feature) => {
              const Icon = FEATURE_ICONS[feature.iconKey] ?? ShieldCheck;
              return (
                <article key={feature.title} className="flex gap-3 rounded-3xl border border-blue-50 bg-white p-4 shadow-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0066CC]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <h2 className="text-sm font-extrabold text-slate-900">{feature.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{feature.description}</p>
                  </span>
                </article>
              );
            })}
          </div>
          ) : null}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* PROMO                                                              */}
        {/* ------------------------------------------------------------------ */}
        <section id="promo" className="scroll-mt-24 bg-white py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Promo Terbaru"
              title="Penawaran Spesial untuk Memulai Perjalanan Renang"
              description="Promo aktif diambil dari data Marketing AAA Sport Academy. Gunakan kode saat pendaftaran sebelum periode berakhir."
            />

            {promos.length ? (
              <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {promos.map((promo) => {
                  const remainingDays = promo.remainingDays ?? 0;

                  return (
                    <article
                      key={promo.id}
                      className="group flex flex-col overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-lg shadow-blue-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/10"
                    >
                      <div className={`relative bg-gradient-to-br px-6 py-6 text-white ${promo.accentClassName}`}>
                        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15" aria-hidden="true" />
                        <div className="relative flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/80">
                              {promo.discountDescription}
                            </p>
                            <p className="mt-1 text-5xl font-extrabold tracking-tight">{promo.discountLabel}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold backdrop-blur">
                            {promo.badge}
                          </span>
                        </div>
                        <p className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90">
                          <Clock className="h-4 w-4" />
                          {remainingDays === 0 ? 'Berakhir hari ini!' : `Berakhir dalam ${remainingDays} hari`}
                        </p>
                      </div>

                      <div className="flex flex-1 flex-col px-6 py-6">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-[#0066CC]">
                          {promo.program}
                        </p>
                        <h3 className="mt-2 text-xl font-extrabold leading-snug text-slate-900">
                          {promo.title}
                        </h3>
                        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-500">
                          {promo.description}
                        </p>

                        <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                          <p className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 shrink-0 text-[#0066CC]" />
                            {formatShortDate(promo.startsAt)} - {formatShortDate(promo.endsAt)}
                          </p>
                          <p>
                            {promo.minimumPurchase
                              ? `Minimum transaksi ${formatRupiah(promo.minimumPurchase)}. `
                              : ''}{promo.terms}
                          </p>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          <CopyPromoButton code={promo.code} />
                          <Link
                            href="#daftar"
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-extrabold text-[#0066CC] transition-colors hover:text-[#0052A3]"
                          >
                            Gunakan Promo
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mx-auto mt-12 max-w-xl rounded-3xl bg-blue-50 px-6 py-10 text-center">
                <h3 className="font-extrabold text-slate-900">Promo baru segera hadir</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Saat ini belum ada promo aktif. Hubungi admin untuk informasi pendaftaran terbaru.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* PROGRAMS                                                           */}
        {/* ------------------------------------------------------------------ */}
        <section id="program" className="scroll-mt-24 bg-gradient-to-b from-blue-50/80 to-white py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Program Kami"
              title="Jalur Belajar untuk Setiap Tahap Kemampuan"
              description="Kurikulum disusun bertahap dan dievaluasi berkala, sehingga siswa naik level ketika teknik serta kepercayaan dirinya sudah siap."
            />

            {programs.length ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {programs.map((program) => {
                const Icon = PROGRAM_ICONS[program.iconKey] ?? PROGRAM_ICONS[program.code] ?? Waves;

                return (
                  <article
                    key={program.code}
                    className="group flex flex-col overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-lg shadow-blue-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/10"
                  >
                    <div className={`relative bg-gradient-to-br px-6 py-6 text-white ${program.gradientClassName}`}>
                      <Waves className="absolute -bottom-5 -right-4 h-24 w-24 text-white/10" aria-hidden="true" />
                      <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                        <Icon className="h-6 w-6" />
                      </span>
                      <p className="relative mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-white/75">
                        {program.tagline}
                      </p>
                      <h3 className="relative mt-1 text-2xl font-extrabold">{program.name}</h3>
                    </div>

                    <div className="flex flex-1 flex-col px-6 py-6">
                      <div className="flex flex-wrap gap-2 text-[11px] font-extrabold">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[#0066CC]">{program.audience}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{program.schedule}</span>
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-slate-500">{program.description}</p>

                      <ul className="mt-5 flex-1 space-y-2.5">
                        {program.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <p className="mt-6 border-t border-slate-100 pt-4 text-sm font-extrabold text-slate-900">
                        {program.price}
                      </p>
                      <Link
                        href="#daftar"
                        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-50 px-5 text-sm font-extrabold text-[#0066CC] transition group-hover:bg-[#0066CC] group-hover:text-white"
                      >
                        Pilih {program.code}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            ) : (
              <div className="mx-auto mt-12 max-w-xl rounded-3xl bg-white px-6 py-10 text-center shadow-lg shadow-blue-950/5">
                <h3 className="font-extrabold text-slate-900">Program belum tersedia</h3>
                <p className="mt-2 text-sm text-slate-500">Konten program belum diaktifkan di database. Hubungi admin untuk informasi kelas terbaru.</p>
              </div>
            )}

            <div className="mx-auto mt-10 grid max-w-5xl gap-3 rounded-[28px] bg-slate-950 px-5 py-6 text-white sm:grid-cols-4 sm:px-7">
              {[
                ['01', 'Konsultasi', 'Ceritakan usia dan pengalaman anak.'],
                ['02', 'Asesmen', 'Pelatih menilai level awal yang aman.'],
                ['03', 'Trial Kelas', 'Coba suasana kelas dan metode belajar.'],
                ['04', 'Mulai Program', 'Latihan rutin dengan target progres jelas.'],
              ].map(([step, title, description]) => (
                <div key={step} className="rounded-2xl bg-white/5 px-4 py-4 ring-1 ring-white/10">
                  <p className="text-sm font-extrabold text-cyan-300">{step}</p>
                  <h3 className="mt-2 font-extrabold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* TESTIMONIALS                                                       */}
        {/* ------------------------------------------------------------------ */}
        <section id="testimoni" className="scroll-mt-24 bg-white py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Testimoni"
              title="Cerita Orang Tua dan Siswa AAA"
              description="Kepercayaan keluarga dibangun dari progres yang terlihat, komunikasi yang jelas, dan pengalaman belajar yang menyenangkan."
            />
            {testimonials.length ? (
              <div className="mt-12">
                <TestimonialSlider testimonials={testimonials} />
              </div>
            ) : (
              <div className="mx-auto mt-12 max-w-xl rounded-3xl bg-blue-50 px-6 py-10 text-center text-sm text-slate-500">
                Testimoni terverifikasi belum tersedia di database.
              </div>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* BLOG                                                               */}
        {/* ------------------------------------------------------------------ */}
        <section id="blog" className="scroll-mt-24 bg-gradient-to-b from-blue-50/80 to-white py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading
                align="left"
                eyebrow="Blog Terbaru"
                title="Tips, Edukasi, dan Cerita dari Kolam"
                description="Bacaan singkat untuk membantu orang tua mendukung perjalanan renang anak di rumah dan di kolam."
              />
              <Link
                href="#blog"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-extrabold text-[#0066CC] transition hover:bg-blue-50"
              >
                Lihat Semua Artikel
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {articles.length ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="group flex flex-col overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-lg shadow-blue-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/10"
                >
                  <ArticleImage article={article} />
                  <div className="flex flex-1 flex-col px-6 py-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-400">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 font-extrabold text-[#0066CC]">
                        {article.category}
                      </span>
                      <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {article.readingTime} menit baca
                      </span>
                    </div>

                    <h3 className="mt-4 line-clamp-3 text-xl font-extrabold leading-snug text-slate-900">
                      <Link href={`/blog/${article.slug}`} className="transition-colors group-hover:text-[#0066CC]">
                        {article.title}
                      </Link>
                    </h3>
                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-500">
                      {article.excerpt}
                    </p>

                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <span className="truncate text-xs font-semibold text-slate-500">
                        Oleh {article.authorName}
                      </span>
                      <Link
                        href={`/blog/${article.slug}`}
                        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-extrabold text-[#0066CC] transition-colors hover:text-[#0052A3]"
                        aria-label={`Baca artikel ${article.title}`}
                      >
                        Baca Artikel
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            ) : (
              <div className="mx-auto mt-12 max-w-xl rounded-3xl bg-white px-6 py-10 text-center shadow-lg shadow-blue-950/5">
                <h3 className="font-extrabold text-slate-900">Artikel belum tersedia</h3>
                <p className="mt-2 text-sm text-slate-500">Artikel terpublikasi dari Content Hub akan muncul di sini.</p>
              </div>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* FAQ                                                                */}
        {/* ------------------------------------------------------------------ */}
        <section id="faq" className="scroll-mt-24 bg-white py-16 sm:py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <SectionHeading
                align="left"
                eyebrow="FAQ"
                title="Pertanyaan yang Sering Ditanyakan"
                description="Informasi awal seputar level, trial, perlengkapan, jadwal, dan pemantauan progres siswa."
              />
              <div className="mt-8 rounded-[28px] bg-[#0066CC] p-6 text-white shadow-xl shadow-blue-600/20">
                <Waves className="h-10 w-10" />
                <h3 className="mt-4 text-xl font-extrabold">Belum yakin level yang tepat?</h3>
                <p className="mt-2 text-sm leading-relaxed text-blue-100">
                  Ikuti konsultasi dan asesmen singkat. Pelatih akan merekomendasikan program
                  berdasarkan usia, keberanian di air, dan kemampuan dasar anak.
                </p>
                <Link
                  href="#daftar"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#0066CC] transition hover:bg-blue-50"
                >
                  Minta Rekomendasi
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <FaqAccordion items={faqItems} />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* REGISTRATION CTA                                                   */}
        {/* ------------------------------------------------------------------ */}
        <section id="daftar" className="relative scroll-mt-24 overflow-hidden bg-slate-950 py-16 sm:py-24">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#0066CC]/35 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="text-white">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-200 ring-1 ring-inset ring-white/15">
                <Sparkles className="h-3.5 w-3.5" />
                Mulai Perjalanan Renang
              </p>
              <h2 className="mt-5 max-w-xl text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
                Siap Membantu Anak Berani dan Mahir di Air?
              </h2>
              <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
                Daftarkan minat Anda hari ini. Admin akan membantu memilih program, kolam, serta
                jadwal trial yang paling sesuai dengan kebutuhan calon siswa.
              </p>

              <ul className="mt-8 space-y-3.5 text-sm text-slate-200 sm:text-base">
                {[
                  'Konsultasi level tanpa komitmen paket terlebih dahulu',
                  'Pilihan program pemula hingga atlet dan private',
                  'Informasi promo aktif dapat digunakan saat pendaftaran',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
                      <Check className="h-4 w-4" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {(settings?.phone || settings?.email) ? (
                <div className="mt-9 flex flex-wrap gap-3 text-sm font-semibold">
                  {settings?.phone ? (
                    <a href={phoneHref} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 ring-1 ring-white/15 transition hover:bg-white/15">
                      <Phone className="h-4 w-4" />
                      {settings.phone}
                    </a>
                  ) : null}
                  {settings?.email ? (
                    <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 ring-1 ring-white/15 transition hover:bg-white/15">
                      <Mail className="h-4 w-4" />
                      {settings.email}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>

            <RegistrationCta programs={programs} venues={settings?.venues ?? []} contactPhone={settings?.phone || ""} />
          </div>
        </section>
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* FOOTER                                                               */}
      {/* -------------------------------------------------------------------- */}
      <footer className="bg-slate-950 pb-8 pt-4 text-slate-300">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 border-t border-white/10 py-12 md:grid-cols-2 xl:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
            <div>
              <Link href="#beranda" className="flex items-center gap-3 text-white">
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#0066CC]">
                  {settings?.logoDataUrl ? <img src={settings.logoDataUrl} alt="" className="h-full w-full bg-white object-contain p-1" /> : <Waves className="h-6 w-6" />}
                </span>
                <span>
                  <span className="block font-extrabold leading-tight">{businessName}</span>
                  <span className="block text-xs text-slate-400">{settings?.tagline || 'Swimming Academy'}</span>
                </span>
              </Link>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
                Sekolah renang untuk pemula, menengah, atlet, dan private dengan pembelajaran
                bertahap yang aman, terukur, dan menyenangkan.
              </p>
            </div>

            <nav aria-label="Program AAA Sport Academy">
              <h3 className="font-extrabold text-white">Program</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {programs.map((program) => (
                  <li key={program.code}>
                    <Link href="#program" className="transition-colors hover:text-cyan-300">
                      {program.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Tautan cepat">
              <h3 className="font-extrabold text-white">Jelajahi</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="#promo" className="transition-colors hover:text-cyan-300">Promo Terbaru</Link></li>
                <li><Link href="#testimoni" className="transition-colors hover:text-cyan-300">Testimoni</Link></li>
                <li><Link href="#blog" className="transition-colors hover:text-cyan-300">Blog & Artikel</Link></li>
                <li><Link href="#faq" className="transition-colors hover:text-cyan-300">FAQ</Link></li>
                <li><Link href="#daftar" className="transition-colors hover:text-cyan-300">Daftar Sekarang</Link></li>
              </ul>
            </nav>

            <div>
              <h3 className="font-extrabold text-white">Hubungi Kami</h3>
              <ul className="mt-4 space-y-3.5 text-sm leading-relaxed">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span>{venueLabel}{settings?.address ? <><br />{settings.address}</> : null}</span>
                </li>
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  {settings?.phone ? <a href={phoneHref} className="transition-colors hover:text-cyan-300">{settings.phone}</a> : <span>Nomor WhatsApp belum diatur</span>}
                </li>
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  {settings?.email ? <a href={`mailto:${settings.email}`} className="transition-colors hover:text-cyan-300">{settings.email}</a> : <span>Email belum diatur</span>}
                </li>
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span>{operatingHoursLabel}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
            <p>© {currentYear} {businessName}. Seluruh hak cipta dilindungi.</p>
            <p>Belajar aman • Bertumbuh percaya diri • Berprestasi di air</p>
          </div>
        </div>
      </footer>
    </>
  );
}
