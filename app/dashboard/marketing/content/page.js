'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Newspaper,
  Plus,
  Search,
  X,
  Check,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Eraser,
  Eye,
  Pencil,
  Trash2,
  Copy,
  CalendarDays,
  Image as ImageIcon,
  Upload,
  FileText,
  Globe,
  Tags,
  Waves,
  Clock,
} from 'lucide-react';

import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';

/* -------------------------------------------------------------------------- */
/* CONSTANTS & MOCK DATA                                                      */
/* -------------------------------------------------------------------------- */

const ARTICLE_CATEGORIES = [
  'Tips Renang',
  'Kesehatan Anak',
  'Parenting',
  'Prestasi',
  'Promo',
  'Event',
  'Edukasi Pelatih',
];

const STATUS_META = {
  draft: { label: 'Draft', badgeStatus: 'inactive' },
  scheduled: { label: 'Scheduled', badgeStatus: 'pending' },
  published: { label: 'Published', badgeStatus: 'active' },
};

const CATEGORY_GRADIENTS = {
  'Tips Renang': 'from-[#0066CC] to-cyan-400',
  'Kesehatan Anak': 'from-emerald-600 to-teal-400',
  Parenting: 'from-sky-700 to-blue-400',
  Prestasi: 'from-indigo-700 to-blue-500',
  Promo: 'from-amber-500 to-orange-400',
  Event: 'from-cyan-700 to-sky-400',
  'Edukasi Pelatih': 'from-slate-700 to-slate-500',
};

const initialArticles = [
  {
    id: 1,
    title: '5 Cara Aman Mengenalkan Anak pada Air Sejak Usia Dini',
    slug: 'cara-aman-mengenalkan-anak-pada-air',
    excerpt:
      'Pengenalan air yang positif membantu anak berani, aman, dan menikmati proses belajar renang sejak sesi pertama.',
    content:
      '<h2>Buat pengalaman pertama terasa menyenangkan</h2><p>Anak belajar paling baik ketika merasa aman. Mulailah dari bermain air di tepi kolam, mencipratkan air secara perlahan, dan mengenalkan sensasi mengapung dengan pendampingan pelatih.</p><h3>Langkah yang bisa dicoba orang tua</h3><ul><li>Pilih jadwal ketika anak tidak mengantuk atau lapar.</li><li>Gunakan kacamata renang yang ukurannya tepat.</li><li>Akhiri sesi dengan aktivitas favorit agar anak ingin kembali.</li></ul><blockquote>Kunci utamanya adalah progres bertahap, bukan memaksa anak langsung berani di kolam dalam.</blockquote><p>Di AAA Sport Academy, program AAA Pemula dirancang dengan rasio kelompok kecil agar pelatih dapat membaca kesiapan setiap anak.</p>',
    category: 'Tips Renang',
    tags: ['anak', 'pemula', 'keamanan air'],
    featuredImageUrl: '',
    featuredImageAlt: 'Anak belajar mengenal air bersama pelatih',
    seoTitle: '5 Cara Aman Mengenalkan Anak pada Air | AAA Sport Academy',
    seoDescription:
      'Panduan aman mengenalkan anak pada air: persiapan, permainan air, kacamata renang, dan progres belajar yang menyenangkan.',
    authorName: 'Nadia Prasetyo',
    status: 'published',
    publishedOffset: -5,
    scheduledOffset: null,
    viewCount: 1240,
  },
  {
    id: 2,
    title: 'Manfaat Renang Rutin untuk Postur dan Kesehatan Anak',
    slug: 'manfaat-renang-rutin-untuk-postur-anak',
    excerpt:
      'Renang melatih otot inti, koordinasi, dan kapasitas paru dengan beban sendi yang relatif rendah.',
    content:
      '<h2>Gerakan menyeluruh dengan risiko benturan rendah</h2><p>Renang mengaktifkan kelompok otot besar sekaligus membantu anak belajar mengendalikan pernapasan dan posisi tubuh.</p><p>Latihan yang terstruktur juga mendukung kebiasaan hidup aktif sejak dini. Orang tua tetap perlu memperhatikan kecukupan istirahat dan nutrisi setelah berlatih.</p><h3>Tanda progres yang sehat</h3><ol><li>Anak lebih percaya diri memasuki air.</li><li>Koordinasi tendangan dan tarikan tangan membaik.</li><li>Durasi latihan dapat ditambah bertahap tanpa kelelahan berlebih.</li></ol>',
    category: 'Kesehatan Anak',
    tags: ['kesehatan', 'postur', 'anak aktif'],
    featuredImageUrl: '',
    featuredImageAlt: 'Anak berlatih renang untuk kesehatan dan postur',
    seoTitle: 'Manfaat Renang untuk Postur dan Kesehatan Anak',
    seoDescription:
      'Ketahui bagaimana renang rutin mendukung otot inti, postur, koordinasi, dan kesehatan anak.',
    authorName: 'Sarah Wijaya',
    status: 'published',
    publishedOffset: -12,
    scheduledOffset: null,
    viewCount: 864,
  },
  {
    id: 3,
    title: 'Panduan Memilih Level AAA, A3, atau SWDC untuk Anak',
    slug: 'panduan-memilih-level-renang-anak',
    excerpt:
      'Setiap level memiliki fokus pembelajaran berbeda. Berikut cara mengenali titik mulai yang tepat untuk anak Anda.',
    content:
      '<h2>Kenali dulu kemampuan dasar anak</h2><p>Level yang tepat membuat anak merasa tertantang tanpa kehilangan rasa aman. Penilaian awal biasanya melihat keberanian di air, kemampuan mengapung, tendangan, dan kontrol napas.</p><h3>Gambaran singkat level</h3><ul><li><strong>AAA</strong> untuk pengenalan air dan dasar renang.</li><li><strong>A3</strong> untuk teknik gaya dan endurance menengah.</li><li><strong>SWDC</strong> untuk jalur atlet dan persiapan kompetisi.</li></ul><p>Tim pelatih akan merekomendasikan level awal setelah sesi asesmen singkat.</p>',
    category: 'Parenting',
    tags: ['level renang', 'pendaftaran', 'orang tua'],
    featuredImageUrl: '',
    featuredImageAlt: 'Pelatih menilai level awal siswa renang',
    seoTitle: 'Cara Memilih Level Renang AAA, A3, dan SWDC',
    seoDescription:
      'Panduan memilih level renang anak berdasarkan keberanian di air, kemampuan mengapung, dan teknik dasar.',
    authorName: 'Coach Andi Pratama',
    status: 'scheduled',
    publishedOffset: null,
    scheduledOffset: 2,
    viewCount: 0,
  },
  {
    id: 4,
    title: 'Flash Sale Weekend: Diskon 25% Program AAA Pemula',
    slug: 'flash-sale-weekend-program-aaa-pemula',
    excerpt:
      'Pendaftaran program AAA Pemula mendapat potongan khusus akhir pekan dengan kuota terbatas.',
    content:
      '<h2>Kesempatan terbatas untuk mulai belajar renang</h2><p>AAA Sport Academy membuka flash sale untuk pendaftar baru program AAA Pemula. Gunakan kode promo saat proses pendaftaran sebelum periode berakhir.</p><p>Promo berlaku sesuai syarat minimum pembelian dan ketersediaan slot kelas di kolam partner.</p>',
    category: 'Promo',
    tags: ['promo', 'flash sale', 'aaa'],
    featuredImageUrl: '',
    featuredImageAlt: 'Promo pendaftaran les renang AAA',
    seoTitle: 'Flash Sale Les Renang AAA Pemula - Diskon 25%',
    seoDescription:
      'Dapatkan diskon pendaftaran program AAA Pemula di flash sale akhir pekan AAA Sport Academy.',
    authorName: 'Tim Marketing AAA',
    status: 'scheduled',
    publishedOffset: null,
    scheduledOffset: 1,
    viewCount: 0,
  },
  {
    id: 5,
    title: 'Mengenal Teknik Pernapasan Gaya Bebas untuk Pemula',
    slug: 'teknik-pernapasan-gaya-bebas-pemula',
    excerpt:
      'Draft panduan langkah demi langkah untuk melatih ritme napas gaya bebas tanpa mengangkat kepala terlalu tinggi.',
    content:
      '<h2>Mulai dari tepi kolam</h2><p>Latihan pernapasan dapat dimulai dengan memegang tepi kolam, menghembuskan udara di dalam air, lalu memutar kepala ke samping untuk mengambil napas.</p><p><em>Catatan editor: tambahkan video demonstrasi dan foto posisi kepala sebelum dipublikasikan.</em></p>',
    category: 'Tips Renang',
    tags: ['gaya bebas', 'pernapasan', 'teknik'],
    featuredImageUrl: '',
    featuredImageAlt: 'Latihan pernapasan gaya bebas di tepi kolam',
    seoTitle: 'Teknik Pernapasan Gaya Bebas untuk Pemula',
    seoDescription:
      'Pelajari ritme dan posisi kepala saat mengambil napas pada gaya bebas untuk pemula.',
    authorName: 'Coach Maria',
    status: 'draft',
    publishedOffset: null,
    scheduledOffset: null,
    viewCount: 0,
  },
  {
    id: 6,
    title: 'Atlet SWDC Raih Pengalaman Berharga di Simulasi Kompetisi',
    slug: 'atlet-swdc-simulasi-kompetisi-renang',
    excerpt:
      'Simulasi kompetisi membantu atlet SWDC melatih start, race pace, dan manajemen emosi sebelum lomba resmi.',
    content:
      '<h2>Latihan dengan atmosfer lomba</h2><p>Para atlet mengikuti rangkaian nomor lomba dengan pencatatan waktu dan evaluasi teknik secara langsung.</p><p>Selain kecepatan, pelatih menilai transisi start, pembalikan, serta konsistensi pace pada setiap putaran.</p><blockquote>Simulasi adalah ruang aman untuk belajar mengambil keputusan ketika tekanan lomba meningkat.</blockquote>',
    category: 'Prestasi',
    tags: ['swdc', 'kompetisi', 'atlet'],
    featuredImageUrl: '',
    featuredImageAlt: 'Atlet renang SWDC melakukan start',
    seoTitle: 'Simulasi Kompetisi Atlet SWDC AAA Sport Academy',
    seoDescription:
      'Cerita dan evaluasi simulasi kompetisi untuk mempersiapkan atlet SWDC menghadapi lomba resmi.',
    authorName: 'Coach Dimas Aryo',
    status: 'published',
    publishedOffset: -2,
    scheduledOffset: null,
    viewCount: 431,
  },
];

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function toDatetimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function stripHtml(html) {
  return String(html ?? '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(html) {
  const text = stripHtml(html);
  return text ? text.split(/\s+/).length : 0;
}

function getInputClassName(hasError, additionalClassName = '') {
  return cn(
    'mt-1.5 h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
      : 'border-slate-200 focus:border-[#0066CC] focus:ring-blue-600/10',
    additionalClassName
  );
}

function getSelectClassName(hasError, additionalClassName = '') {
  return cn(getInputClassName(hasError, 'appearance-none pr-10'), additionalClassName);
}

function FeaturedImage({ article, className = '', imageClassName = 'h-full w-full object-cover' }) {
  if (article.featuredImageUrl) {
    return (
      <div className={cn('overflow-hidden bg-slate-100', className)}>
        {/* Data URL/file lokal pada mock; production dapat diganti next/image. */}
        <img src={article.featuredImageUrl} alt={article.featuredImageAlt || article.title} className={imageClassName} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-gradient-to-br text-white',
        CATEGORY_GRADIENTS[article.category] ?? CATEGORY_GRADIENTS['Tips Renang'],
        className
      )}
      aria-label={article.featuredImageAlt || article.title}
      role="img"
    >
      <Waves className="h-12 w-12 opacity-90" />
      <span className="absolute bottom-2 left-3 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur">
        {article.category}
      </span>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div role="status" aria-label="Memuat artikel" className="space-y-4">
      <span className="sr-only">Memuat Content Hub...</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padded>
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
            <div className="mt-4 h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
          </Card>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} padded>
          <div className="flex gap-4">
            <div className="h-28 w-40 animate-pulse rounded-2xl bg-slate-200" />
            <div className="flex-1 space-y-3 py-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatCard({ label, value, description }) {
  return (
    <Card padded hover>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* ARTICLE PREVIEW MODAL                                                      */
/* -------------------------------------------------------------------------- */

function ArticlePreviewModal({ article, onClose }) {
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Tutup preview artikel"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-[2px]"
      />
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-preview-title"
        className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="relative shrink-0">
          <FeaturedImage article={article} className="h-52 w-full sm:h-64" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup preview"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/45 text-white backdrop-blur transition-colors hover:bg-slate-950/65"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge status={STATUS_META[article.status]?.badgeStatus}>
              {STATUS_META[article.status]?.label}
            </Badge>
            <span className="text-xs font-semibold text-[#0066CC]">{article.category}</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {Math.max(1, Math.ceil(countWords(article.content) / 200))} menit baca
            </span>
          </div>

          <h3 id="article-preview-title" className="mt-4 text-3xl font-extrabold leading-tight text-slate-900">
            {article.title}
          </h3>
          <p className="mt-3 text-base leading-relaxed text-slate-500">{article.excerpt}</p>
          <p className="mt-4 border-y border-slate-100 py-3 text-sm text-slate-500">
            Oleh <span className="font-bold text-slate-900">{article.authorName}</span> •{' '}
            <span className="font-mono text-xs">/blog/{article.slug}</span>
          </p>

          {/*
            Mock admin preview. Di production, HTML WYSIWYG wajib disanitasi
            di server dengan library seperti sanitize-html/DOMPurify.
          */}
          <div
            className="article-preview mt-5 text-[15px] leading-8 text-slate-700 [&_blockquote]:border-l-4 [&_blockquote]:border-[#0066CC] [&_blockquote]:bg-blue-50 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_ul]:list-disc"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </article>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SIMPLE WYSIWYG EDITOR                                                      */
/* -------------------------------------------------------------------------- */

function ArticleEditor({ initialArticle, existingArticles, today, onCancel, onSave }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const isEdit = Boolean(initialArticle?.id);

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);
  const [contentHtml, setContentHtml] = useState(initialArticle?.content ?? '<p>Mulai tulis artikel di sini...</p>');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(() => {
    const scheduledDate = addDays(today ?? new Date(), initialArticle?.scheduledOffset ?? 1);
    scheduledDate.setHours(9, 0, 0, 0);

    return {
      title: initialArticle?.title ?? '',
      slug: initialArticle?.slug ?? '',
      excerpt: initialArticle?.excerpt ?? '',
      category: initialArticle?.category ?? ARTICLE_CATEGORIES[0],
      tags: initialArticle?.tags?.join(', ') ?? '',
      featuredImageUrl: initialArticle?.featuredImageUrl ?? '',
      featuredImageAlt: initialArticle?.featuredImageAlt ?? '',
      seoTitle: initialArticle?.seoTitle ?? '',
      seoDescription: initialArticle?.seoDescription ?? '',
      authorName: initialArticle?.authorName ?? 'Tim AAA Sport Academy',
      status: initialArticle?.status ?? 'draft',
      scheduledAt: toDatetimeLocal(scheduledDate),
    };
  });

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialArticle?.content ?? '<p>Mulai tulis artikel di sini...</p>';
    }
    // Editor dirender dengan key artikel, sehingga inisialisasi cukup sekali.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wordCount = countWords(contentHtml);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setErrors((prev) => ({ ...prev, [name]: '' }));

    if (name === 'title') {
      setFormData((prev) => ({
        ...prev,
        title: value,
        slug: slugManuallyEdited ? prev.slug : slugify(value),
        seoTitle: prev.seoTitle || value,
      }));
      return;
    }

    if (name === 'slug') {
      setSlugManuallyEdited(true);
      setFormData((prev) => ({ ...prev, slug: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function executeToolbarCommand(command, value = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setContentHtml(editorRef.current?.innerHTML ?? '');
  }

  function insertLink() {
    const url = window.prompt('Masukkan URL (gunakan https://):', 'https://');
    if (!url) return;

    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Protocol tidak valid');
      executeToolbarCommand('createLink', parsedUrl.toString());
    } catch {
      setErrors((prev) => ({ ...prev, content: 'URL link tidak valid.' }));
    }
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, featuredImageUrl: 'File featured image harus berupa gambar.' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, featuredImageUrl: 'Ukuran gambar maksimal 2 MB untuk preview mock.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, featuredImageUrl: String(reader.result) }));
      setErrors((prev) => ({ ...prev, featuredImageUrl: '' }));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function validateForm(normalizedSlug) {
    const nextErrors = {};

    if (formData.title.trim().length < 8) nextErrors.title = 'Judul artikel minimal 8 karakter.';
    if (!normalizedSlug) nextErrors.slug = 'Slug SEO wajib diisi.';
    if (
      existingArticles.some(
        (article) => article.slug === normalizedSlug && article.id !== initialArticle?.id
      )
    ) {
      nextErrors.slug = 'Slug ini sudah dipakai artikel lain.';
    }
    if (formData.excerpt.trim().length < 30) nextErrors.excerpt = 'Ringkasan/excerpt minimal 30 karakter.';
    if (stripHtml(contentHtml).length < 50) nextErrors.content = 'Isi artikel minimal 50 karakter teks.';
    if (formData.status === 'scheduled' && !formData.scheduledAt) {
      nextErrors.scheduledAt = 'Tanggal dan waktu penjadwalan wajib diisi.';
    }

    return nextErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const normalizedSlug = slugify(formData.slug || formData.title);
    const nextErrors = validateForm(normalizedSlug);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const scheduledDate = formData.scheduledAt ? new Date(formData.scheduledAt) : null;
    const scheduledOffset = scheduledDate
      ? Math.round((startOfDay(scheduledDate) - startOfDay(today)) / (1000 * 60 * 60 * 24))
      : null;

    onSave({
      id: initialArticle?.id,
      title: formData.title.trim(),
      slug: normalizedSlug,
      excerpt: formData.excerpt.trim(),
      content: contentHtml,
      category: formData.category,
      tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      featuredImageUrl: formData.featuredImageUrl.trim(),
      featuredImageAlt: formData.featuredImageAlt.trim(),
      seoTitle: formData.seoTitle.trim() || formData.title.trim(),
      seoDescription: formData.seoDescription.trim() || formData.excerpt.trim().slice(0, 160),
      authorName: formData.authorName.trim() || 'Tim AAA Sport Academy',
      status: formData.status,
      publishedOffset:
        formData.status === 'published' ? (initialArticle?.publishedOffset ?? 0) : null,
      scheduledOffset: formData.status === 'scheduled' ? scheduledOffset : null,
      viewCount: initialArticle?.viewCount ?? 0,
    });
  }

  const previewArticle = {
    ...formData,
    title: formData.title || 'Judul Artikel',
    excerpt: formData.excerpt || 'Ringkasan artikel akan tampil di sini.',
    content: contentHtml,
    slug: slugify(formData.slug || formData.title) || 'slug-artikel',
  };

  const toolbarButtons = [
    { label: 'Bold', icon: Bold, action: () => executeToolbarCommand('bold') },
    { label: 'Italic', icon: Italic, action: () => executeToolbarCommand('italic') },
    { label: 'Underline', icon: Underline, action: () => executeToolbarCommand('underline') },
    { label: 'Heading 2', icon: Heading2, action: () => executeToolbarCommand('formatBlock', 'H2') },
    { label: 'Heading 3', icon: Heading3, action: () => executeToolbarCommand('formatBlock', 'H3') },
    { label: 'Bullet list', icon: List, action: () => executeToolbarCommand('insertUnorderedList') },
    { label: 'Numbered list', icon: ListOrdered, action: () => executeToolbarCommand('insertOrderedList') },
    { label: 'Quote', icon: Quote, action: () => executeToolbarCommand('formatBlock', 'BLOCKQUOTE') },
    { label: 'Link', icon: Link2, action: insertLink },
    { label: 'Bersihkan format', icon: Eraser, action: () => executeToolbarCommand('removeFormat') },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-bold text-[#0066CC] transition-colors hover:text-[#0052A3]"
          >
            ← Kembali ke daftar artikel
          </button>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {isEdit ? 'Edit Artikel' : 'Tulis Artikel Baru'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            WYSIWYG sederhana untuk mock CMS. Di production, pertimbangkan Tiptap dan sanitasi HTML di server.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setIsPreviewMode((prev) => !prev)} leftIcon={<Eye className="h-4 w-4" />}>
            {isPreviewMode ? 'Kembali Edit' : 'Preview'}
          </Button>
          <Button type="submit" leftIcon={<Check className="h-4 w-4" />}>
            {formData.status === 'published'
              ? 'Publish Artikel'
              : formData.status === 'scheduled'
                ? 'Jadwalkan Artikel'
                : 'Simpan Draft'}
          </Button>
        </div>
      </section>

      <div className="grid items-start gap-4 sm:gap-6 xl:grid-cols-3">
        {/* Main Editor */}
        <div className="space-y-4 sm:space-y-6 xl:col-span-2">
          <Card padded>
            <div>
              <label htmlFor="article-title" className="text-sm font-bold text-slate-700">
                Judul Artikel <span className="text-red-500">*</span>
              </label>
              <input
                id="article-title"
                name="title"
                value={formData.title}
                onChange={handleFieldChange}
                placeholder="Tulis judul artikel yang menarik..."
                className={getInputClassName(errors.title, 'h-12 text-base font-semibold')}
              />
              {errors.title ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.title}</p> : null}
            </div>

            <div className="mt-5">
              <label htmlFor="article-slug" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                <Globe className="h-4 w-4 text-[#0066CC]" />
                Slug SEO <span className="text-red-500">*</span>
              </label>
              <div className="mt-1.5 flex overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-[#0066CC] focus-within:ring-4 focus-within:ring-blue-600/10">
                <span className="flex shrink-0 items-center bg-slate-50 px-3 text-xs font-semibold text-slate-400 sm:text-sm">
                  /blog/
                </span>
                <input
                  id="article-slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleFieldChange}
                  onBlur={() => setFormData((prev) => ({ ...prev, slug: slugify(prev.slug) }))}
                  placeholder="slug-artikel-seo"
                  className="h-11 min-w-0 flex-1 px-2 font-mono text-sm outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Slug otomatis dibuat dari judul dan masih dapat disesuaikan.
              </p>
              {errors.slug ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.slug}</p> : null}
            </div>

            <div className="mt-5">
              <label htmlFor="article-excerpt" className="text-sm font-bold text-slate-700">
                Ringkasan / Excerpt <span className="text-red-500">*</span>
              </label>
              <textarea
                id="article-excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleFieldChange}
                rows={3}
                maxLength={280}
                placeholder="Ringkasan singkat untuk kartu artikel dan hasil pencarian..."
                className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-relaxed outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10"
              />
              <div className="mt-1.5 flex justify-between gap-3 text-xs text-slate-400">
                <span>{errors.excerpt ? <span className="font-medium text-red-600">{errors.excerpt}</span> : 'Idealnya 120-180 karakter.'}</span>
                <span>{formData.excerpt.length}/280</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-900">Isi Artikel</h3>
                  <p className="mt-0.5 text-xs text-slate-400">{wordCount} kata • sekitar {Math.max(1, Math.ceil(wordCount / 200))} menit baca</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0066CC]">
                  <FileText className="h-3.5 w-3.5" />
                  WYSIWYG
                </span>
              </div>

              {!isPreviewMode ? (
                <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Toolbar editor artikel">
                  {toolbarButtons.map((button) => {
                    const Icon = button.icon;
                    return (
                      <button
                        key={button.label}
                        type="button"
                        title={button.label}
                        aria-label={button.label}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={button.action}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#0066CC]"
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {isPreviewMode ? (
              <div
                className="min-h-96 px-5 py-6 text-[15px] leading-8 text-slate-700 sm:px-8 [&_blockquote]:border-l-4 [&_blockquote]:border-[#0066CC] [&_blockquote]:bg-blue-50 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_ul]:list-disc"
                dangerouslySetInnerHTML={{ __html: previewArticle.content }}
              />
            ) : (
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => {
                  setContentHtml(editorRef.current?.innerHTML ?? '');
                  setErrors((prev) => ({ ...prev, content: '' }));
                }}
                data-placeholder="Mulai tulis artikel di sini..."
                className="min-h-96 px-5 py-6 text-[15px] leading-8 text-slate-700 outline-none sm:px-8 [&_blockquote]:border-l-4 [&_blockquote]:border-[#0066CC] [&_blockquote]:bg-blue-50 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_ul]:list-disc"
              />
            )}

            {errors.content ? (
              <p className="border-t border-red-100 bg-red-50 px-5 py-3 text-xs font-medium text-red-600 sm:px-6">
                {errors.content}
              </p>
            ) : null}
          </Card>
        </div>

        {/* Publish Settings */}
        <aside className="space-y-4 sm:space-y-6 xl:sticky xl:top-24">
          <Card title="Pengaturan Publikasi" description="Status dan jadwal terbit artikel.">
            <div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {Object.entries(STATUS_META).map(([value, meta]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, status: value }))}
                  aria-pressed={formData.status === value}
                  className={cn(
                    'h-9 rounded-xl px-2 text-xs font-bold transition-colors sm:text-sm',
                    formData.status === value
                      ? 'bg-[#0066CC] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white hover:text-[#0066CC]'
                  )}
                >
                  {meta.label}
                </button>
              ))}
            </div>

            {formData.status === 'scheduled' ? (
              <div className="mt-5">
                <label htmlFor="article-scheduled-at" className="text-sm font-bold text-slate-700">
                  Jadwal Terbit <span className="text-red-500">*</span>
                </label>
                <input
                  id="article-scheduled-at"
                  name="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={handleFieldChange}
                  className={getInputClassName(errors.scheduledAt)}
                />
                {errors.scheduledAt ? (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.scheduledAt}</p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5">
              <label htmlFor="article-category" className="text-sm font-bold text-slate-700">Kategori</label>
              <div className="relative">
                <select id="article-category" name="category" value={formData.category} onChange={handleFieldChange} className={getSelectClassName(false)}>
                  {ARTICLE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="article-author" className="text-sm font-bold text-slate-700">Penulis</label>
              <input id="article-author" name="authorName" value={formData.authorName} onChange={handleFieldChange} className={getInputClassName(false)} />
            </div>

            <div className="mt-5">
              <label htmlFor="article-tags" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                <Tags className="h-4 w-4 text-[#0066CC]" /> Tags
              </label>
              <input
                id="article-tags"
                name="tags"
                value={formData.tags}
                onChange={handleFieldChange}
                placeholder="renang anak, tips, keamanan"
                className={getInputClassName(false)}
              />
              <p className="mt-1.5 text-xs text-slate-400">Pisahkan dengan koma.</p>
            </div>
          </Card>

          <Card title="Featured Image" description="Gunakan URL gambar atau unggah file untuk preview lokal.">
            <FeaturedImage article={previewArticle} className="h-44 w-full rounded-2xl" />

            <label htmlFor="featured-image-url" className="mt-5 block text-sm font-bold text-slate-700">
              URL Gambar
            </label>
            <input
              id="featured-image-url"
              name="featuredImageUrl"
              value={formData.featuredImageUrl.startsWith('data:') ? '' : formData.featuredImageUrl}
              onChange={handleFieldChange}
              placeholder="https://example.com/gambar.jpg"
              className={getInputClassName(errors.featuredImageUrl)}
            />

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="h-4 w-4" />}
              >
                Upload Gambar
              </Button>
              {formData.featuredImageUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setFormData((prev) => ({ ...prev, featuredImageUrl: '' }))}
                >
                  Hapus
                </Button>
              ) : null}
            </div>
            {errors.featuredImageUrl ? (
              <p className="mt-2 text-xs font-medium text-red-600">{errors.featuredImageUrl}</p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Upload mock maksimal 2 MB dan hanya tersimpan sebagai data URL lokal.</p>
            )}

            <label htmlFor="featured-image-alt" className="mt-5 block text-sm font-bold text-slate-700">
              Alt Text Gambar
            </label>
            <input
              id="featured-image-alt"
              name="featuredImageAlt"
              value={formData.featuredImageAlt}
              onChange={handleFieldChange}
              placeholder="Deskripsi gambar untuk aksesibilitas dan SEO"
              className={getInputClassName(false)}
            />
          </Card>

          <Card title="SEO" description="Judul dan deskripsi untuk mesin pencari serta media sosial.">
            <label htmlFor="seo-title" className="text-sm font-bold text-slate-700">SEO Title</label>
            <input
              id="seo-title"
              name="seoTitle"
              value={formData.seoTitle}
              onChange={handleFieldChange}
              maxLength={70}
              placeholder="Judul SEO maksimal sekitar 60-70 karakter"
              className={getInputClassName(false)}
            />
            <p className="mt-1.5 text-right text-xs text-slate-400">{formData.seoTitle.length}/70</p>

            <label htmlFor="seo-description" className="mt-4 block text-sm font-bold text-slate-700">
              Meta Description
            </label>
            <textarea
              id="seo-description"
              name="seoDescription"
              value={formData.seoDescription}
              onChange={handleFieldChange}
              rows={4}
              maxLength={160}
              placeholder="Deskripsi singkat yang mendorong klik dari hasil pencarian..."
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-relaxed outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10"
            />
            <p className="mt-1.5 text-right text-xs text-slate-400">{formData.seoDescription.length}/160</p>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="truncate text-xs text-emerald-700">aaasport.academy/blog/{previewArticle.slug}</p>
              <p className="mt-1 line-clamp-2 font-bold leading-snug text-[#0066CC]">
                {formData.seoTitle || previewArticle.title}
              </p>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500">
                {formData.seoDescription || previewArticle.excerpt}
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function ContentHubPage() {
  const [articles, setArticles] = useState(initialArticles);
  const [isLoading, setIsLoading] = useState(true);
  const [today, setToday] = useState(null);
  const [notification, setNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [editingArticle, setEditingArticle] = useState(null);
  const [previewArticle, setPreviewArticle] = useState(null);

  useEffect(() => {
    setToday(new Date());
    const timer = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(''), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    document.body.style.overflow = previewArticle ? 'hidden' : '';

    function handleEscape(event) {
      if (event.key === 'Escape') setPreviewArticle(null);
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [previewArticle]);

  const filteredArticles = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
      const matchesSearch =
        !keyword ||
        article.title.toLowerCase().includes(keyword) ||
        article.slug.toLowerCase().includes(keyword) ||
        article.excerpt.toLowerCase().includes(keyword) ||
        article.tags.some((tag) => tag.toLowerCase().includes(keyword));

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [articles, searchQuery, categoryFilter, statusFilter]);

  const articleStats = useMemo(
    () => ({
      published: articles.filter((article) => article.status === 'published').length,
      scheduled: articles.filter((article) => article.status === 'scheduled').length,
      draft: articles.filter((article) => article.status === 'draft').length,
      views: articles.reduce((sum, article) => sum + article.viewCount, 0),
    }),
    [articles]
  );

  function openCreate() {
    setEditingArticle(null);
    setViewMode('editor');
  }

  function openEdit(article) {
    setEditingArticle(article);
    setViewMode('editor');
  }

  function handleSaveArticle(payload) {
    if (payload.id) {
      setArticles((prev) => prev.map((article) => (article.id === payload.id ? payload : article)));
      setNotification(`Artikel "${payload.title}" berhasil diperbarui.`);
    } else {
      setArticles((prev) => [{ ...payload, id: Date.now() }, ...prev]);
      setNotification(`Artikel "${payload.title}" berhasil dibuat sebagai ${STATUS_META[payload.status].label}.`);
    }

    setEditingArticle(null);
    setViewMode('list');
  }

  function duplicateArticle(article) {
    const baseSlug = `${article.slug}-salinan`;
    let slug = baseSlug;
    let counter = 2;

    while (articles.some((item) => item.slug === slug)) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const duplicated = {
      ...article,
      id: Date.now(),
      title: `${article.title} (Salinan)`,
      slug,
      status: 'draft',
      publishedOffset: null,
      scheduledOffset: null,
      viewCount: 0,
    };

    setArticles((prev) => [duplicated, ...prev]);
    setNotification(`Salinan draft "${article.title}" berhasil dibuat.`);
  }

  function publishNow(article) {
    setArticles((prev) =>
      prev.map((item) =>
        item.id === article.id
          ? { ...item, status: 'published', publishedOffset: 0, scheduledOffset: null }
          : item
      )
    );
    setNotification(`Artikel "${article.title}" berhasil dipublikasikan.`);
  }

  function deleteArticle(article) {
    setArticles((prev) => prev.filter((item) => item.id !== article.id));
    setNotification(`Artikel "${article.title}" dihapus dari mock Content Hub.`);
  }

  function getArticleDate(article) {
    if (!today) return null;
    if (article.status === 'published') return addDays(today, article.publishedOffset ?? 0);
    if (article.status === 'scheduled') return addDays(today, article.scheduledOffset ?? 0);
    return null;
  }

  if (viewMode === 'editor' && today) {
    return (
      <ArticleEditor
        key={editingArticle?.id ?? 'new-article'}
        initialArticle={editingArticle}
        existingArticles={articles}
        today={today}
        onCancel={() => {
          setEditingArticle(null);
          setViewMode('list');
        }}
        onSave={handleSaveArticle}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge status="active">Marketing</Badge>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Newspaper className="h-3.5 w-3.5" />
              Mini CMS Artikel & Blog
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Content Hub
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Tulis dan jadwalkan artikel edukasi, promo, parenting, dan prestasi untuk landing page
            AAA Sport Academy.
          </p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />} className="shrink-0">
          Tulis Artikel
        </Button>
      </section>

      {notification ? (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="h-4 w-4" />
          </span>
          <p className="min-w-0 flex-1">{notification}</p>
          <button
            type="button"
            onClick={() => setNotification('')}
            aria-label="Tutup notifikasi"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-emerald-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {isLoading || !today ? (
        <ContentSkeleton />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Published" value={articleStats.published} description="Artikel yang sudah tayang di blog" />
            <StatCard label="Scheduled" value={articleStats.scheduled} description="Artikel menunggu jadwal terbit" />
            <StatCard label="Draft" value={articleStats.draft} description="Konten yang masih dalam proses penulisan" />
            <StatCard label="Total Views" value={articleStats.views.toLocaleString('id-ID')} description="Simulasi kunjungan artikel terbit" />
          </section>

          <Card>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari judul, slug, ringkasan, atau tag..."
                  aria-label="Cari artikel"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[430px]">
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    aria-label="Filter kategori artikel"
                    className={getSelectClassName(false, 'mt-0 bg-white')}
                  >
                    <option value="all">Semua Kategori</option>
                    {ARTICLE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    aria-label="Filter status artikel"
                    className={getSelectClassName(false, 'mt-0 bg-white')}
                  >
                    <option value="all">Semua Status</option>
                    {Object.entries(STATUS_META).map(([value, meta]) => (
                      <option key={value} value={value}>{meta.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {filteredArticles.length ? (
              <div className="divide-y divide-slate-100">
                {filteredArticles.map((article) => {
                  const articleDate = getArticleDate(article);
                  const words = countWords(article.content);

                  return (
                    <article key={article.id} className="flex flex-col gap-4 p-4 transition-colors hover:bg-blue-50/40 sm:p-5 lg:flex-row">
                      <FeaturedImage article={article} className="h-40 w-full shrink-0 rounded-2xl lg:h-32 lg:w-48" />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge status={STATUS_META[article.status].badgeStatus} size="sm">
                            {STATUS_META[article.status].label}
                          </Badge>
                          <span className="text-xs font-bold text-[#0066CC]">{article.category}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {article.status === 'draft'
                              ? 'Belum dijadwalkan'
                              : `${article.status === 'scheduled' ? 'Terbit' : 'Diterbitkan'} ${formatDate(articleDate)}`}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Eye className="h-3.5 w-3.5" />
                            {article.viewCount.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <h3 className="mt-2 line-clamp-2 text-lg font-extrabold leading-snug text-slate-900">
                          {article.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
                          {article.excerpt}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span className="font-mono">/blog/{article.slug}</span>
                          <span>•</span>
                          <span>{article.authorName}</span>
                          <span>•</span>
                          <span>{words} kata</span>
                          {article.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 lg:w-44 lg:flex-col">
                        <Button size="sm" variant="secondary" onClick={() => setPreviewArticle(article)} leftIcon={<Eye className="h-4 w-4" />}>
                          Preview
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(article)} leftIcon={<Pencil className="h-4 w-4" />}>
                          Edit
                        </Button>
                        {article.status !== 'published' ? (
                          <Button size="sm" onClick={() => publishNow(article)} leftIcon={<Check className="h-4 w-4" />}>
                            Publish
                          </Button>
                        ) : null}
                        <div className="flex gap-1 lg:justify-end">
                          <button
                            type="button"
                            onClick={() => duplicateArticle(article)}
                            aria-label={`Duplikat ${article.title}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-50 hover:text-[#0066CC]"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteArticle(article)}
                            aria-label={`Hapus ${article.title}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0066CC]">
                  <ImageIcon className="h-7 w-7" />
                </span>
                <h3 className="mt-4 font-extrabold text-slate-900">Artikel tidak ditemukan</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  Coba ubah pencarian/filter atau tulis artikel baru untuk blog AAA Sport Academy.
                </p>
              </div>
            )}
          </Card>
        </>
      )}

      <ArticlePreviewModal article={previewArticle} onClose={() => setPreviewArticle(null)} />
    </div>
  );
}
