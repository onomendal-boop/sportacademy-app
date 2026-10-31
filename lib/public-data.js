import { cacheLife } from 'next/cache';

/**
 * Public data layer untuk landing page AAA Sport Academy.
 *
 * Saat ini getPromos() dan getArticles() mengembalikan mock array.
 * Setelah API/Prisma siap, cukup ganti isi kedua fungsi ini tanpa mengubah
 * komponen di app/page.js, selama bentuk object yang dikembalikan sama.
 *
 * Kedua fungsi publik memakai `use cache` + `cacheLife('hours')`
 * sebagai pengganti route segment `revalidate` pada Cache Components.
 *
 * Contoh penggantian API di dalam fungsi yang sudah di-cache:
 * const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/promotions?status=active`);
 * if (!response.ok) throw new Error('Gagal mengambil promo');
 * return response.json();
 */

const mockPromos = [
  {
    id: 'promo-flash-aaa',
    title: 'Flash Sale Weekend Renang',
    description:
      'Potongan pendaftaran program AAA Pemula untuk transaksi akhir pekan. Kuota promo dibatasi agar ukuran kelas tetap kecil dan aman.',
    code: 'FLASHAAA25',
    badge: 'Flash Sale',
    discountLabel: '25%',
    discountDescription: 'Diskon paket AAA',
    program: 'AAA',
    minimumPurchase: 500000,
    startOffset: 0,
    endOffset: 3,
    terms: 'Berlaku untuk pendaftar baru dengan minimum transaksi Rp 500.000.',
    accentClassName: 'from-[#0066CC] to-cyan-400',
  },
  {
    id: 'promo-aqua-center',
    title: 'Promo Kolam Aqua Center',
    description:
      'Potongan langsung untuk pendaftaran baru yang memilih jadwal latihan di Kolam Aqua Center.',
    code: 'AQUABARU100',
    badge: 'Pendaftar Baru',
    discountLabel: 'Rp 100 rb',
    discountDescription: 'Potongan langsung',
    program: 'Semua Program',
    minimumPurchase: 550000,
    startOffset: -2,
    endOffset: 10,
    terms: 'Tidak dapat digabungkan dengan flash sale pada transaksi yang sama.',
    accentClassName: 'from-cyan-600 to-sky-400',
  },
  {
    id: 'promo-referral-sahabat',
    title: 'Referral Sahabat Renang',
    description:
      'Ajak teman belajar renang. Teman yang mendaftar mendapat potongan awal, pemberi referral mengikuti benefit program yang berlaku.',
    code: 'SAHABATAAA',
    badge: 'Referral',
    discountLabel: '10%',
    discountDescription: 'Untuk teman baru',
    program: 'Semua Program',
    minimumPurchase: 450000,
    startOffset: -20,
    endOffset: 40,
    terms: 'Kode referral dimasukkan saat pendaftaran dan diverifikasi oleh admin.',
    accentClassName: 'from-indigo-600 to-blue-400',
  },
];

const mockArticles = [
  {
    id: 'article-swdc-simulasi',
    title: 'Atlet SWDC Raih Pengalaman Berharga di Simulasi Kompetisi',
    slug: 'atlet-swdc-simulasi-kompetisi-renang',
    excerpt:
      'Simulasi kompetisi membantu atlet SWDC melatih start, race pace, dan manajemen emosi sebelum menghadapi lomba resmi.',
    category: 'Prestasi',
    tags: ['SWDC', 'Kompetisi', 'Atlet'],
    authorName: 'Coach Dimas Aryo',
    status: 'published',
    publishedOffset: -2,
    readingTime: 4,
    featuredImageUrl: '',
    featuredImageAlt: 'Atlet renang SWDC melakukan start saat simulasi kompetisi',
  },
  {
    id: 'article-aman-air',
    title: '5 Cara Aman Mengenalkan Anak pada Air Sejak Usia Dini',
    slug: 'cara-aman-mengenalkan-anak-pada-air',
    excerpt:
      'Pengenalan air yang positif membantu anak berani, aman, dan menikmati proses belajar renang sejak sesi pertama.',
    category: 'Tips Renang',
    tags: ['Anak', 'Pemula', 'Keamanan Air'],
    authorName: 'Nadia Prasetyo',
    status: 'published',
    publishedOffset: -5,
    readingTime: 5,
    featuredImageUrl: '',
    featuredImageAlt: 'Anak belajar mengenal air bersama pelatih renang',
  },
  {
    id: 'article-kesehatan-anak',
    title: 'Manfaat Renang Rutin untuk Postur dan Kesehatan Anak',
    slug: 'manfaat-renang-rutin-untuk-postur-anak',
    excerpt:
      'Renang melatih otot inti, koordinasi, dan kapasitas paru dengan beban sendi yang relatif rendah.',
    category: 'Kesehatan Anak',
    tags: ['Kesehatan', 'Postur', 'Anak Aktif'],
    authorName: 'Sarah Wijaya',
    status: 'published',
    publishedOffset: -12,
    readingTime: 4,
    featuredImageUrl: '',
    featuredImageAlt: 'Anak berlatih renang untuk kesehatan dan postur tubuh',
  },
];

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Mengambil promo aktif untuk landing page.
 * Production: ganti mock ini dengan query Prisma/API Promotion berstatus ACTIVE.
 */
export async function getPromos({ limit = 3 } = {}) {
  'use cache';
  cacheLife('hours');

  const today = startOfDay(new Date());

  return mockPromos
    .map((promo) => {
      const startsAt = addDays(today, promo.startOffset);
      const endsAt = addDays(today, promo.endOffset);
      const { startOffset, endOffset, ...publicPromo } = promo;

      return {
        ...publicPromo,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        remainingDays: Math.max(0, Math.round((endsAt - today) / 86_400_000)),
        isActive: today >= startsAt && today <= endsAt,
      };
    })
    .filter((promo) => promo.isActive)
    .sort((first, second) => new Date(first.endsAt) - new Date(second.endsAt))
    .slice(0, limit);
}

/**
 * Mengambil artikel terbaru yang sudah diterbitkan.
 * Production: ganti mock ini dengan query Prisma/API Article.
 */
export async function getArticles({ limit = 3 } = {}) {
  'use cache';
  cacheLife('hours');

  const today = startOfDay(new Date());

  return mockArticles
    .filter((article) => article.status === 'published')
    .map((article) => {
      const { publishedOffset, status, ...publicArticle } = article;

      return {
        ...publicArticle,
        publishedAt: addDays(today, publishedOffset).toISOString(),
      };
    })
    .sort((first, second) => new Date(second.publishedAt) - new Date(first.publishedAt))
    .slice(0, limit);
}
