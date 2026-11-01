import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getProgramDisplayName } from '@/lib/programs';
import { mapArticle } from '@/lib/marketing/articleService';
import { getPublicBusinessSettings } from '@/lib/settings/settingsService';

/**
 * Public data layer untuk landing page dan blog AAA Sport Academy.
 *
 * Seluruh fungsi di file ini membaca MySQL melalui Prisma. Tidak ada array
 * data statis di sini: jika database kosong, halaman publik menampilkan
 * empty state agar tidak pernah mengklaim promo/testimoni/artikel fiktif.
 */

const PROGRAM_ORDER = ['AAA', 'A3', 'SWDC', 'PRIVATE'];

const PROGRAM_GRADIENTS = {
  AAA: 'from-[#0066CC] to-cyan-400',
  A3: 'from-cyan-600 to-sky-400',
  SWDC: 'from-indigo-700 to-blue-500',
  PRIVATE: 'from-slate-800 to-blue-600',
};

const PROMO_ACCENTS = {
  FLASH_SALE: 'from-[#0066CC] to-cyan-400',
  REFERRAL: 'from-indigo-600 to-blue-400',
  VOUCHER: 'from-amber-500 to-orange-400',
  SEASONAL: 'from-cyan-600 to-sky-400',
  PARTNER: 'from-teal-600 to-emerald-400',
};

const TYPE_BADGES = {
  FLASH_SALE: 'Flash Sale',
  REFERRAL: 'Referral',
  VOUCHER: 'Voucher',
  SEASONAL: 'Promo Musiman',
  PARTNER: 'Partner',
};

const AVATAR_TONES = [
  'from-[#0066CC] to-cyan-400',
  'from-teal-600 to-emerald-400',
  'from-indigo-600 to-blue-400',
  'from-amber-500 to-orange-400',
];

function formatCompactCurrency(value) {
  const amount = Number(value ?? 0);

  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000)
      .toLocaleString('id-ID', { maximumFractionDigits: 1 })
      .replace(/,0$/, '')} jt`;
  }

  if (amount >= 1_000) {
    return `Rp ${Math.round(amount / 1_000).toLocaleString('id-ID')} rb`;
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function mapAcademyFeatures(siteContent) {
  if (!Array.isArray(siteContent?.academyFeatures)) return [];

  return siteContent.academyFeatures
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      iconKey: String(item.iconKey ?? 'shield-check').trim().toLowerCase(),
      title: String(item.title ?? '').trim().slice(0, 120),
      description: String(item.description ?? '').trim().slice(0, 500),
    }))
    .filter((item) => item.title && item.description)
    .slice(0, 8);
}

function toStringArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value.split('\n').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function isPromotionRedeemable(promo, now) {
  if (!['ACTIVE', 'SCHEDULED'].includes(promo.status)) return false;
  if (promo.startsAt > now || promo.endsAt < now) return false;
  if (!promo.code && !promo.batchId) return false;
  if (promo.usageLimit && promo.redeemedCount >= promo.usageLimit) return false;
  return true;
}

function mapPublicPromo(promo, now) {
  const remainingDays = Math.max(
    0,
    Math.ceil((promo.endsAt.getTime() - now.getTime()) / 86_400_000)
  );
  const discountLabel =
    promo.discountType === 'PERCENTAGE'
      ? `${promo.discountValue}%`
      : promo.discountType === 'FREE_SESSION'
        ? `${promo.discountValue} sesi`
        : formatCompactCurrency(promo.discountValue);
  const discountDescription =
    promo.discountType === 'PERCENTAGE'
      ? 'Diskon pendaftaran'
      : promo.discountType === 'FREE_SESSION'
        ? 'Bonus sesi latihan'
        : 'Potongan langsung';

  return {
    id: promo.id,
    title: promo.title,
    description: promo.description ?? '',
    code: promo.code ?? 'TANPA KODE',
    badge: TYPE_BADGES[promo.type] ?? 'Promo',
    discountLabel,
    discountDescription,
    program: promo.program
      ? getProgramDisplayName(promo.program)
      : 'Semua Program',
    poolName: promo.poolName ?? '',
    minimumPurchase: promo.minPurchaseAmount,
    startsAt: promo.startsAt.toISOString(),
    endsAt: promo.endsAt.toISOString(),
    remainingDays,
    terms: promo.terms ?? '',
    accentClassName:
      PROMO_ACCENTS[promo.type] ?? PROMO_ACCENTS.FLASH_SALE,
    isActive: true,
  };
}

function mapPublicArticle(article, { includeContent = false } = {}) {
  const mapped = mapArticle(article);
  return {
    id: mapped.id,
    title: mapped.title,
    slug: mapped.slug,
    excerpt: mapped.excerpt,
    ...(includeContent ? { content: mapped.content } : {}),
    category: mapped.category,
    tags: mapped.tags,
    authorName: mapped.authorName,
    publishedAt: mapped.publishedAt ?? mapped.scheduledAt,
    readingTime: mapped.readingTime,
    featuredImageUrl: mapped.featuredImageUrl,
    featuredImageAlt: mapped.featuredImageAlt,
    seoTitle: mapped.seoTitle,
    seoDescription: mapped.seoDescription,
  };
}

/** Mengambil promo publik yang sedang berlaku dari tabel Promotion. */
export async function getPromos({ limit = 3 } = {}) {
  'use cache';
  cacheLife('hours');
  cacheTag('promotions', 'public-landing');

  const safeLimit = Math.min(Math.max(Number(limit) || 3, 1), 100);
  const now = new Date();
  const promos = await prisma.promotion.findMany({
    where: {
      status: { in: ['ACTIVE', 'SCHEDULED'] },
      startsAt: { lte: now },
      endsAt: { gte: now },
      OR: [
        { code: { not: null } },
        { batchId: { not: null } },
      ],
    },
    orderBy: [{ endsAt: 'asc' }, { createdAt: 'desc' }],
    take: safeLimit * 3,
  });

  return promos
    .filter((promo) => isPromotionRedeemable(promo, now))
    .slice(0, safeLimit)
    .map((promo) => mapPublicPromo(promo, now));
}

/** Mengambil artikel terpublikasi terbaru dari tabel Article. */
export async function getArticles({ limit = 3 } = {}) {
  'use cache';
  cacheLife('hours');
  cacheTag('articles', 'public-landing');

  const safeLimit = Math.min(Math.max(Number(limit) || 3, 1), 100);
  const now = new Date();
  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { status: 'PUBLISHED', publishedAt: { lte: now } },
        { status: 'SCHEDULED', scheduledAt: { lte: now } },
      ],
    },
    orderBy: [{ publishedAt: 'desc' }, { scheduledAt: 'desc' }, { createdAt: 'desc' }],
    take: safeLimit,
  });

  return articles.map((article) => mapPublicArticle(article));
}

/** Mengambil satu artikel publik berdasarkan slug. */
export async function getArticleBySlug(slug) {
  'use cache';
  cacheLife('hours');
  cacheTag('articles', `article:${slug}`);

  if (!slug) return null;

  const now = new Date();
  const article = await prisma.article.findFirst({
    where: {
      slug,
      OR: [
        { status: 'PUBLISHED', publishedAt: { lte: now } },
        { status: 'SCHEDULED', scheduledAt: { lte: now } },
      ],
    },
  });

  return article ? mapPublicArticle(article, { includeContent: true }) : null;
}

/** Mengambil artikel terkait dari database untuk halaman detail blog. */
export async function getRelatedArticles(slug, category, { limit = 3 } = {}) {
  'use cache';
  cacheLife('hours');
  cacheTag('articles');

  const safeLimit = Math.min(Math.max(Number(limit) || 3, 1), 12);
  const now = new Date();
  const publicWhere = {
    slug: { not: slug },
    OR: [
      { status: 'PUBLISHED', publishedAt: { lte: now } },
      { status: 'SCHEDULED', scheduledAt: { lte: now } },
    ],
  };
  const sameCategory = category
    ? await prisma.article.findMany({
        where: { AND: [publicWhere, { category }] },
        orderBy: [{ publishedAt: 'desc' }, { scheduledAt: 'desc' }],
        take: safeLimit,
      })
    : [];

  if (sameCategory.length >= safeLimit) {
    return sameCategory.map((article) => mapPublicArticle(article));
  }

  const latest = await prisma.article.findMany({
    where: {
      AND: [
        publicWhere,
        { id: { notIn: sameCategory.map((article) => article.id) } },
      ],
    },
    orderBy: [{ publishedAt: 'desc' }, { scheduledAt: 'desc' }],
    take: safeLimit - sameCategory.length,
  });

  return [...sameCategory, ...latest].map((article) =>
    mapPublicArticle(article)
  );
}

/**
 * Menggabungkan konten program CMS dengan harga minimum katalog Package aktif.
 * Program tanpa ProgramContent aktif tidak ditampilkan sama sekali.
 */
export async function getLandingPrograms() {
  'use cache';
  cacheLife('hours');
  cacheTag('program-content', 'packages', 'public-landing');

  const [contents, packages] = await Promise.all([
    prisma.programContent.findMany({
      where: { program: { in: PROGRAM_ORDER }, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.package.findMany({
      where: { isActive: true },
      orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
      select: {
        program: true,
        price: true,
        durationLabel: true,
        totalSessions: true,
      },
    }),
  ]);

  const cheapestByProgram = new Map();
  packages.forEach((pkg) => {
    if (!cheapestByProgram.has(pkg.program)) {
      cheapestByProgram.set(pkg.program, pkg);
    }
  });

  return contents
    .sort((first, second) => {
      const orderDifference =
        PROGRAM_ORDER.indexOf(first.program) -
        PROGRAM_ORDER.indexOf(second.program);
      return orderDifference !== 0
        ? orderDifference
        : first.sortOrder - second.sortOrder;
    })
    .map((content) => {
      const cheapestPackage = cheapestByProgram.get(content.program);
      const price = cheapestPackage
        ? `Mulai ${formatCompactCurrency(cheapestPackage.price)} • ${cheapestPackage.durationLabel}`
        : content.program === 'PRIVATE'
          ? 'Hubungi admin untuk paket private'
          : 'Hubungi admin untuk katalog paket';

      return {
        id: content.id,
        code: content.program,
        name: getProgramDisplayName(content.program),
        tagline: content.tagline ?? '',
        description: content.description,
        audience: content.audienceLabel ?? '',
        schedule: content.scheduleLabel ?? '',
        price,
        features: toStringArray(content.features),
        iconKey: content.program,
        gradientClassName: PROGRAM_GRADIENTS[content.program] ?? PROGRAM_GRADIENTS.AAA,
      };
    });
}

/** Mengambil testimoni aktif dari database. */
export async function getTestimonials() {
  'use cache';
  cacheLife('hours');
  cacheTag('testimonials', 'public-landing');

  const testimonials = await prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return testimonials.map((testimonial, index) => ({
    id: testimonial.id,
    quote: testimonial.quote,
    name: testimonial.name,
    role: testimonial.roleLabel,
    initials: testimonial.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join(''),
    rating: Math.min(Math.max(testimonial.rating ?? 5, 1), 5),
    avatarTone: AVATAR_TONES[index % AVATAR_TONES.length],
  }));
}

/** Mengambil FAQ aktif dari database. */
export async function getFaqItems() {
  'use cache';
  cacheLife('hours');
  cacheTag('faq-items', 'public-landing');

  const items = await prisma.faqItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, question: true, answer: true },
  });

  return items;
}

/** Mengambil identitas/kontak dari Settings dan nama tempat latihan aktif. */
export async function getLandingSettings() {
  'use cache';
  cacheLife('hours');
  cacheTag('system-settings', 'training-venues', 'public-landing');

  const [publicSettings, venues] = await Promise.all([
    getPublicBusinessSettings(),
    prisma.pool.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true, location: true },
    }),
  ]);

  const general = publicSettings?.general ?? {};

  return {
    businessName: general.businessName ?? '',
    tagline: general.tagline ?? '',
    email: general.email ?? '',
    phone: general.phone ?? publicSettings?.notification?.whatsappNumber ?? '',
    website: general.website ?? '',
    address: general.address ?? '',
    logoDataUrl: general.logoDataUrl ?? '',
    operatingHours: Array.isArray(general.operatingHours)
      ? general.operatingHours.map((item) => ({
          day: item.day,
          isOpen: Boolean(item.isOpen),
          start: item.openTime ?? item.start ?? '',
          end: item.closeTime ?? item.end ?? '',
        }))
      : [],
    siteContent: publicSettings?.siteContent ?? {},
    academyFeatures: mapAcademyFeatures(publicSettings?.siteContent),
    venues,
    venueNames: venues.map((venue) => venue.name),
  };
}

/** Statistik publik dihitung dari data operasional nyata, bukan angka statis. */
export async function getLandingStats() {
  'use cache';
  cacheLife('hours');
  cacheTag('public-stats', 'public-landing');

  const [activeStudentCount, coachCount, activePoolCount, programCount] =
    await Promise.all([
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'COACH', isActive: true } }),
      prisma.pool.count({ where: { status: 'ACTIVE' } }),
      prisma.programContent.count({
        where: { program: { in: PROGRAM_ORDER }, isActive: true },
      }),
    ]);

  return [
    {
      value: activeStudentCount,
      label: 'Siswa Aktif',
      displayValue: activeStudentCount > 0 ? `${activeStudentCount}+` : '0',
    },
    {
      value: programCount,
      label: 'Jalur Program',
      displayValue: String(programCount),
    },
    {
      value: activePoolCount,
      label: 'Tempat Latihan',
      displayValue: String(activePoolCount),
    },
    {
      value: coachCount,
      label: 'Pelatih Aktif',
      displayValue: String(coachCount),
    },
  ];
}
