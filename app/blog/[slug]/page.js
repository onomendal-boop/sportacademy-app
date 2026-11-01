import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  Tag,
  UserRound,
  Waves,
} from 'lucide-react';
import {
  getArticleBySlug,
  getLandingSettings,
  getRelatedArticles,
} from '@/lib/public-data';
import { sanitizeArticleHtml } from '@/lib/marketing/sanitizeHtml';

function formatDate(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Artikel Tidak Ditemukan | AAA Sport Academy',
      description: 'Artikel yang Anda cari tidak tersedia.',
    };
  }

  const title = article.seoTitle || `${article.title} | AAA Sport Academy`;
  const description = article.seoDescription || article.excerpt;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.publishedAt ?? undefined,
      authors: [article.authorName],
      images: article.featuredImageUrl
        ? [{ url: article.featuredImageUrl, alt: article.featuredImageAlt || article.title }]
        : undefined,
    },
  };
}

function BlogDetailSkeleton() {
  return (
    <div role="status" aria-label="Memuat artikel" className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6">
      <span className="sr-only">Memuat artikel dari database...</span>
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 h-12 w-full animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-3 h-12 w-3/4 animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-8 aspect-[16/9] animate-pulse rounded-[28px] bg-slate-200" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-4 animate-pulse rounded bg-slate-200" />
        ))}
      </div>
    </div>
  );
}

function RelatedArticleCard({ article }) {
  return (
    <article className="group overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-lg shadow-blue-950/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/10">
      <Link href={`/blog/${article.slug}`} className="block">
        {article.featuredImageUrl ? (
          <img
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt || article.title}
            className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-[#0066CC] to-cyan-400 text-white">
            <Waves className="h-14 w-14" />
          </div>
        )}
        <div className="px-5 py-5">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#0066CC]">
            {article.category}
          </p>
          <h3 className="mt-2 line-clamp-3 font-extrabold leading-snug text-slate-900 group-hover:text-[#0066CC]">
            {article.title}
          </h3>
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-[#0066CC]">
            Baca Artikel
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </Link>
    </article>
  );
}

async function BlogDetailContent({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const [relatedArticles, settings] = await Promise.all([
    getRelatedArticles(article.slug, article.category, { limit: 3 }),
    getLandingSettings(),
  ]);
  const safeContent = sanitizeArticleHtml(article.content);
  const businessName = settings?.businessName || 'AAA Sport Academy';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-blue-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0066CC] text-white">
              {settings?.logoDataUrl ? (
                <img src={settings.logoDataUrl} alt="" className="h-full w-full bg-white object-contain p-1" />
              ) : (
                <Waves className="h-6 w-6" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-extrabold leading-tight">{businessName}</span>
              <span className="block text-xs text-slate-500">{settings?.tagline || 'Swimming Academy'}</span>
            </span>
          </Link>
          <Link
            href="/#daftar"
            className="inline-flex h-11 shrink-0 items-center rounded-full bg-[#0066CC] px-5 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3]"
          >
            Daftar Trial
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/#blog"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#0066CC] transition hover:text-[#0052A3]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Blog
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#0066CC] ring-1 ring-inset ring-blue-600/10">
              {article.category}
            </span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>

          <h1 className="mt-5 text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-600">
            {article.excerpt}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-blue-100 py-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <UserRound className="h-4 w-4 text-[#0066CC]" />
              {article.authorName}
            </span>
            {article.publishedAt ? (
              <time dateTime={article.publishedAt} className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#0066CC]" />
                {formatDate(article.publishedAt)}
              </time>
            ) : null}
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0066CC]" />
              {article.readingTime} menit baca
            </span>
          </div>

          {article.featuredImageUrl ? (
            <figure className="mt-8 overflow-hidden rounded-[28px] shadow-2xl shadow-blue-950/10">
              <img
                src={article.featuredImageUrl}
                alt={article.featuredImageAlt || article.title}
                className="aspect-[16/9] w-full object-cover"
              />
              {article.featuredImageAlt ? (
                <figcaption className="bg-white px-5 py-3 text-sm text-slate-500">
                  {article.featuredImageAlt}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          <article
            className="prose prose-slate mt-10 max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-a:font-semibold prose-a:text-[#0066CC] prose-img:rounded-3xl"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />

          <div className="mt-12 rounded-[28px] bg-slate-950 px-6 py-7 text-white sm:px-8">
            <h2 className="text-2xl font-extrabold">Ingin mencoba kelas renang?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Isi form pendaftaran untuk konsultasi level dan jadwal trial bersama
              tim {businessName}.
            </p>
            <Link
              href="/#daftar"
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-extrabold text-[#0066CC] transition hover:bg-blue-50"
            >
              Daftar Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {relatedArticles.length ? (
          <section className="mx-auto mt-16 max-w-6xl">
            <h2 className="text-center text-3xl font-extrabold tracking-tight">
              Artikel Terkait
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {relatedArticles.map((relatedArticle) => (
                <RelatedArticleCard key={relatedArticle.id} article={relatedArticle} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default function BlogDetailPage({ params }) {
  return (
    <Suspense fallback={<BlogDetailSkeleton />}>
      <BlogDetailContent params={params} />
    </Suspense>
  );
}
