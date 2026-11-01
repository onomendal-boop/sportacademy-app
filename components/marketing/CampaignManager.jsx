'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Megaphone,
  TicketPercent,
  Gift,
  Users,
  Copy,
  Check,
  Plus,
  Search,
  X,
  ChevronDown,
  Download,
  Sparkles,
  Pencil,
  Trash2,
  Power,
  RefreshCw,
  CalendarDays,
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Table from '../ui/Table';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { promotionApi } from '@/lib/marketing/marketingClient';

/* -------------------------------------------------------------------------- */
/* CONSTANTS & DATABASE ADAPTERS                                            */
/* -------------------------------------------------------------------------- */

const PROMOTION_TYPES = {
  flash_sale: { label: 'Flash Sale', icon: Sparkles },
  referral: { label: 'Referral', icon: Users },
  voucher: { label: 'Voucher', icon: Gift },
  seasonal: { label: 'Seasonal', icon: Megaphone },
  partner: { label: 'Partner', icon: Megaphone },
};

const PROGRAM_OPTIONS = ['ALL', 'AAA', 'A3', 'SWDC', 'PRIVATE'];
const PROGRAM_LABELS = {
  ALL: 'Semua Program',
  AAA: 'AAA Sport Academy',
  A3: 'A3',
  SWDC: 'SWDC Swimmer',
  PRIVATE: 'Private',
};

const DB_TYPE_TO_UI = {
  FLASH_SALE: 'flash_sale',
  REFERRAL: 'referral',
  VOUCHER: 'voucher',
  SEASONAL: 'seasonal',
  PARTNER: 'partner',
};
const UI_TYPE_TO_DB = {
  flash_sale: 'FLASH_SALE',
  referral: 'REFERRAL',
  voucher: 'VOUCHER',
  seasonal: 'SEASONAL',
  partner: 'PARTNER',
};
const DB_DISCOUNT_TO_UI = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  FREE_SESSION: 'free_session',
};
const UI_DISCOUNT_TO_DB = {
  percentage: 'PERCENTAGE',
  fixed_amount: 'FIXED_AMOUNT',
  free_session: 'FREE_SESSION',
};

function toUiPromotion(promotion) {
  return {
    id: promotion.id,
    title: promotion.title,
    description: promotion.description ?? '',
    type: DB_TYPE_TO_UI[promotion.type] ?? 'seasonal',
    code: promotion.code ?? '',
    discountType: DB_DISCOUNT_TO_UI[promotion.discountType] ?? 'percentage',
    discountValue: promotion.discountValue,
    minPurchaseAmount: promotion.minPurchaseAmount ?? 0,
    program: promotion.program ?? 'ALL',
    startsAt: promotion.startsAt,
    endsAt: promotion.endsAt,
    startDateValue: toDateInputValue(new Date(promotion.startsAt)),
    endDateValue: toDateInputValue(new Date(promotion.endsAt)),
    usageLimit: promotion.usageLimit ?? null,
    redeemedCount: promotion.redeemedCount ?? 0,
    manualStatus:
      promotion.status === 'INACTIVE' || promotion.status === 'DRAFT'
        ? 'inactive'
        : 'active',
    dbStatus: promotion.status,
    batchId: promotion.batchId ?? '',
    poolName: promotion.poolName ?? '',
    maxDiscountAmount: promotion.maxDiscountAmount ?? null,
    perUserLimit: promotion.perUserLimit ?? 1,
    referrerBenefit: promotion.referrerBenefit ?? '',
    refereeBenefit: promotion.refereeBenefit ?? '',
    terms: promotion.terms ?? '',
  };
}

function toApiPromotion(promotion, original = null) {
  const startDateValue = promotion.startDate ?? promotion.startDateValue;
  const endDateValue = promotion.endDate ?? promotion.endDateValue;
  const startsAt = dateFromInputValue(startDateValue);
  const endsAt = dateFromInputValue(endDateValue);
  endsAt.setHours(23, 59, 59, 999);

  const type = UI_TYPE_TO_DB[promotion.type] ?? 'SEASONAL';
  const discountType = UI_DISCOUNT_TO_DB[promotion.discountType] ?? 'PERCENTAGE';
  const discountValue = Number(promotion.discountValue) || 0;
  const discountLabel =
    discountType === 'PERCENTAGE'
      ? `${discountValue}%`
      : discountType === 'FREE_SESSION'
        ? `${discountValue} sesi gratis`
        : formatRupiah(discountValue);
  const hasReferralBenefit = Boolean(
    (original?.referrerBenefit || promotion.referrerBenefit) ||
      (original?.refereeBenefit || promotion.refereeBenefit)
  );

  return {
    title: promotion.title,
    description: promotion.description,
    type,
    code: promotion.code || null,
    batchId: promotion.batchId || original?.batchId || null,
    discountType,
    discountValue,
    maxDiscountAmount: original?.maxDiscountAmount ?? promotion.maxDiscountAmount ?? null,
    minPurchaseAmount: Number(promotion.minPurchaseAmount) || 0,
    program: promotion.program === 'ALL' ? null : promotion.program,
    poolName: original?.poolName || promotion.poolName || null,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    usageLimit:
      promotion.usageLimit === '' || promotion.usageLimit === null
        ? null
        : Number(promotion.usageLimit),
    perUserLimit: original?.perUserLimit ?? promotion.perUserLimit ?? 1,
    referrerBenefit:
      original?.referrerBenefit || promotion.referrerBenefit ||
      (type === 'REFERRAL' && !hasReferralBenefit
        ? 'Benefit pemberi referral mengikuti ketentuan campaign.'
        : null),
    refereeBenefit:
      original?.refereeBenefit || promotion.refereeBenefit ||
      (type === 'REFERRAL' && !hasReferralBenefit
        ? `Diskon ${discountLabel} untuk pendaftar baru.`
        : null),
    status: promotion.manualStatus === 'inactive' ? 'INACTIVE' : 'ACTIVE',
    terms: original?.terms || promotion.terms || promotion.description || null,
  };
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromInputValue(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function differenceInDays(fromDate, toDate) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.round((startOfDay(toDate) - startOfDay(fromDate)) / millisecondsPerDay);
}

function formatDate(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function sanitizeCodePart(value, fallback = 'AAA') {
  const sanitized = String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);
  return sanitized || fallback;
}

function randomCodePart(length = 6) {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
}

function generateUniqueCode(prefix, existingCodes) {
  const cleanPrefix = sanitizeCodePart(prefix);
  let code = '';

  do {
    code = `${cleanPrefix}-${randomCodePart(6)}`;
  } while (existingCodes.has(code));

  existingCodes.add(code);
  return code;
}

function getPromotionStatus(promotion, today) {
  if (!today) return { key: 'loading', label: 'Memuat', badgeStatus: 'pending' };
  if (promotion.manualStatus !== 'active') {
    return { key: 'inactive', label: 'Nonaktif', badgeStatus: 'inactive' };
  }

  const current = startOfDay(today);
  const start = startOfDay(new Date(promotion.startsAt));
  const end = startOfDay(new Date(promotion.endsAt));

  if (current > end) return { key: 'expired', label: 'Expired', badgeStatus: 'cancelled' };
  if (current < start) return { key: 'scheduled', label: 'Scheduled', badgeStatus: 'pending' };
  if (promotion.usageLimit && promotion.redeemedCount >= promotion.usageLimit) {
    return { key: 'redeemed', label: 'Habis', badgeStatus: 'cancelled' };
  }

  return { key: 'active', label: 'Active', badgeStatus: 'active' };
}

function getDiscountLabel(promotion) {
  if (promotion.discountType === 'percentage') return `${promotion.discountValue}%`;
  if (promotion.discountType === 'fixed_amount') return formatRupiah(promotion.discountValue);
  return `${promotion.discountValue} sesi gratis`;
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

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function CampaignSkeleton() {
  return (
    <div role="status" aria-label="Memuat campaign" className="space-y-4 sm:space-y-6">
      <span className="sr-only">Memuat data campaign...</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padded>
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
            <div className="mt-4 h-4 w-28 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-7 w-20 animate-pulse rounded bg-slate-200" />
          </Card>
        ))}
      </div>
      <Card padded>
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <Card padded hover>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0066CC] text-white shadow-sm shadow-blue-600/25">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="truncate text-2xl font-extrabold leading-tight text-slate-900">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{description}</p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* PROMOTION FORM MODAL                                                       */
/* -------------------------------------------------------------------------- */

function PromotionFormModal({ initialData, existingCodes, today, onClose, onSave }) {
  const isEdit = Boolean(initialData?.id);
  const [formData, setFormData] = useState(() => {
    const baseDate = today ?? new Date();
    return {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      type: initialData?.type ?? 'flash_sale',
      code: initialData?.code ?? `FLASH-${randomCodePart(6)}`,
      discountType: initialData?.discountType ?? 'percentage',
      discountValue: initialData?.discountValue ? String(initialData.discountValue) : '20',
      minPurchaseAmount: initialData?.minPurchaseAmount ? String(initialData.minPurchaseAmount) : '500000',
      program: initialData?.program ?? 'ALL',
      startDate: initialData?.startDateValue ?? toDateInputValue(baseDate),
      endDate: initialData?.endDateValue ?? toDateInputValue(addDays(baseDate, 7)),
      usageLimit: initialData?.usageLimit ? String(initialData.usageLimit) : '100',
    };
  });
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function regenerateCode() {
    const prefix =
      formData.type === 'flash_sale'
        ? 'FLASH'
        : formData.type === 'referral'
          ? 'REF'
          : formData.type === 'voucher'
            ? 'VCR'
            : 'AAA';
    setFormData((prev) => ({ ...prev, code: `${prefix}-${randomCodePart(6)}` }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    const normalizedCode = formData.code.trim().toUpperCase();
    const startDate = dateFromInputValue(formData.startDate);
    const endDate = dateFromInputValue(formData.endDate);
    const discountValue = Number(formData.discountValue);

    if (formData.title.trim().length < 5) nextErrors.title = 'Nama campaign minimal 5 karakter.';
    if (formData.description.trim() && formData.description.trim().length < 10) {
      nextErrors.description = 'Deskripsi minimal 10 karakter bila diisi.';
    }
    if (!normalizedCode) nextErrors.code = 'Kode campaign wajib diisi.';
    if (existingCodes.has(normalizedCode) && normalizedCode !== initialData?.code) {
      nextErrors.code = 'Kode ini sudah digunakan campaign/voucher lain.';
    }
    if (!discountValue || discountValue <= 0) nextErrors.discountValue = 'Nilai diskon harus lebih dari 0.';
    if (formData.discountType === 'percentage' && discountValue > 100) {
      nextErrors.discountValue = 'Diskon persentase maksimal 100%.';
    }
    if (!formData.startDate || !formData.endDate || endDate < startDate) {
      nextErrors.endDate = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
    }
    if (!Number(formData.usageLimit) || Number(formData.usageLimit) <= 0) {
      nextErrors.usageLimit = 'Batas penggunaan harus lebih dari 0.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSave({
      id: initialData?.id,
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      code: normalizedCode,
      discountType: formData.discountType,
      discountValue,
      minPurchaseAmount: Number(formData.minPurchaseAmount) || 0,
      program: formData.program,
      startDate: formData.startDate,
      endDate: formData.endDate,
      usageLimit: Number(formData.usageLimit),
      redeemedCount: initialData?.redeemedCount ?? 0,
      manualStatus: initialData?.manualStatus ?? 'active',
      batchId: initialData?.batchId ?? '',
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Tutup form campaign"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-form-title"
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h3 id="promotion-form-title" className="text-lg font-extrabold text-slate-900">
              {isEdit ? 'Edit Campaign' : 'Buat Campaign / Flash Sale'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Status akan mengikuti tanggal berlaku: Scheduled, Active, atau Expired.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto" noValidate>
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div>
              <label htmlFor="promo-title" className="text-sm font-bold text-slate-700">
                Nama Campaign <span className="text-red-500">*</span>
              </label>
              <input
                id="promo-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: Flash Sale Weekend Renang"
                className={getInputClassName(errors.title)}
              />
              {errors.title ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.title}</p> : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="promo-type" className="text-sm font-bold text-slate-700">Tipe Campaign</label>
                <div className="relative">
                  <select id="promo-type" name="type" value={formData.type} onChange={handleChange} className={getSelectClassName(false)}>
                    {Object.entries(PROMOTION_TYPES).map(([value, meta]) => (
                      <option key={value} value={value}>{meta.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="promo-program" className="text-sm font-bold text-slate-700">Program Tujuan</label>
                <div className="relative">
                  <select id="promo-program" name="program" value={formData.program} onChange={handleChange} className={getSelectClassName(false)}>
                    {PROGRAM_OPTIONS.map((program) => (
                      <option key={program} value={program}>{PROGRAM_LABELS[program] ?? program}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="promo-code" className="text-sm font-bold text-slate-700">
                Kode Promo <span className="text-red-500">*</span>
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="promo-code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="FLASHAAA25"
                  className={getInputClassName(errors.code, 'mt-0 uppercase')}
                />
                <Button type="button" variant="secondary" onClick={regenerateCode} leftIcon={<RefreshCw className="h-4 w-4" />}>
                  Generate
                </Button>
              </div>
              {errors.code ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.code}</p> : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="promo-discount-type" className="text-sm font-bold text-slate-700">Jenis Diskon</label>
                <div className="relative">
                  <select id="promo-discount-type" name="discountType" value={formData.discountType} onChange={handleChange} className={getSelectClassName(false)}>
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed_amount">Nominal Tetap</option>
                    <option value="free_session">Sesi Gratis</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
                </div>
              </div>
              <div>
                <label htmlFor="promo-discount-value" className="text-sm font-bold text-slate-700">
                  Nilai Diskon <span className="text-red-500">*</span>
                </label>
                <input
                  id="promo-discount-value"
                  name="discountValue"
                  type="number"
                  min="0"
                  value={formData.discountValue}
                  onChange={handleChange}
                  className={getInputClassName(errors.discountValue)}
                />
              </div>
              <div>
                <label htmlFor="promo-minimum" className="text-sm font-bold text-slate-700">Min. Belanja (Rp)</label>
                <input
                  id="promo-minimum"
                  name="minPurchaseAmount"
                  type="number"
                  min="0"
                  value={formData.minPurchaseAmount}
                  onChange={handleChange}
                  className={getInputClassName(false)}
                />
              </div>
            </div>
            {errors.discountValue ? <p className="-mt-3 text-xs font-medium text-red-600">{errors.discountValue}</p> : null}

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="promo-start" className="text-sm font-bold text-slate-700">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <input id="promo-start" name="startDate" type="date" value={formData.startDate} onChange={handleChange} className={getInputClassName(false)} />
              </div>
              <div>
                <label htmlFor="promo-end" className="text-sm font-bold text-slate-700">
                  Tanggal Selesai <span className="text-red-500">*</span>
                </label>
                <input id="promo-end" name="endDate" type="date" value={formData.endDate} onChange={handleChange} className={getInputClassName(errors.endDate)} />
              </div>
              <div>
                <label htmlFor="promo-usage" className="text-sm font-bold text-slate-700">
                  Batas Penggunaan <span className="text-red-500">*</span>
                </label>
                <input id="promo-usage" name="usageLimit" type="number" min="1" value={formData.usageLimit} onChange={handleChange} className={getInputClassName(errors.usageLimit)} />
              </div>
            </div>
            {(errors.endDate || errors.usageLimit) ? (
              <p className="-mt-3 text-xs font-medium text-red-600">{errors.endDate || errors.usageLimit}</p>
            ) : null}

            <div>
              <label htmlFor="promo-description" className="text-sm font-bold text-slate-700">Deskripsi / Syarat Promo</label>
              <textarea
                id="promo-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                placeholder="Tulis manfaat dan syarat campaign..."
                className={cn(
                  'mt-1.5 w-full resize-none rounded-xl border px-3.5 py-3 text-sm leading-relaxed outline-none transition placeholder:text-slate-400 focus:ring-4',
                  errors.description
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-200 focus:border-[#0066CC] focus:ring-blue-600/10'
                )}
              />
              {errors.description ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.description}</p> : null}
            </div>
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit">{isEdit ? 'Simpan Perubahan' : 'Buat Campaign'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function CampaignManager({ initialPromotions = [] }) {
  const router = useRouter();
  const [promotions, setPromotions] = useState(() => initialPromotions.map(toUiPromotion));
  const [today, setToday] = useState(null);
  const [notification, setNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [voucherForm, setVoucherForm] = useState({
    prefix: 'AAA',
    quantity: '10',
    discountType: 'percentage',
    discountValue: '15',
    expiryDays: '30',
    program: 'ALL',
  });
  const [generatedCodes, setGeneratedCodes] = useState([]);

  const [referralForm, setReferralForm] = useState({
    referrerName: '',
    discountValue: '10',
  });
  const [generatedReferralCode, setGeneratedReferralCode] = useState('');

  useEffect(() => {
    setToday(new Date());
  }, []);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(''), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    document.body.style.overflow = isFormOpen ? 'hidden' : '';

    function handleEscape(event) {
      if (event.key === 'Escape') setIsFormOpen(false);
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isFormOpen]);

  const derivedPromotions = useMemo(
    () =>
      promotions.map((promotion) => ({
        ...promotion,
        derivedStatus: getPromotionStatus(promotion, today),
        startDate: promotion.startsAt ? new Date(promotion.startsAt) : null,
        endDate: promotion.endsAt ? new Date(promotion.endsAt) : null,
      })),
    [promotions, today]
  );

  const filteredPromotions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return derivedPromotions.filter((promotion) => {
      const matchesType = typeFilter === 'all' || promotion.type === typeFilter;
      const matchesSearch =
        !keyword ||
        promotion.title.toLowerCase().includes(keyword) ||
        promotion.code.toLowerCase().includes(keyword) ||
        promotion.description.toLowerCase().includes(keyword);

      return matchesType && matchesSearch;
    });
  }, [derivedPromotions, searchQuery, typeFilter]);

  const campaignStats = useMemo(
    () => ({
      active: derivedPromotions.filter((item) => item.derivedStatus.key === 'active').length,
      scheduled: derivedPromotions.filter((item) => item.derivedStatus.key === 'scheduled').length,
      redemptions: derivedPromotions.reduce((sum, item) => sum + item.redeemedCount, 0),
      unusedVouchers: derivedPromotions.reduce((sum, item) => {
        if (item.type !== 'voucher' || item.derivedStatus.key !== 'active') return sum;
        return sum + (item.usageLimit ? Math.max(item.usageLimit - item.redeemedCount, 0) : 1);
      }, 0),
    }),
    [derivedPromotions]
  );

  const existingCodes = useMemo(
    () => new Set(promotions.map((promotion) => promotion.code.toUpperCase())),
    [promotions]
  );

  async function handleCopy(text, successMessage) {
    try {
      await copyText(text);
      setNotification(successMessage);
    } catch {
      setNotification('Gagal menyalin otomatis. Salin kode secara manual.');
    }
  }

  function openCreate() {
    setEditingPromotion(null);
    setIsFormOpen(true);
  }

  function openEdit(promotion) {
    setEditingPromotion(promotion);
    setIsFormOpen(true);
  }

  async function handleSavePromotion(payload) {
    const original = payload.id
      ? promotions.find((promotion) => promotion.id === payload.id)
      : null;

    try {
      const apiPayload = toApiPromotion(payload, original);
      const saved = payload.id
        ? await promotionApi.update(payload.id, apiPayload)
        : await promotionApi.create(apiPayload);
      const uiPromotion = toUiPromotion(saved);

      setPromotions((prev) =>
        payload.id
          ? prev.map((item) => (item.id === payload.id ? uiPromotion : item))
          : [uiPromotion, ...prev]
      );
      setNotification(
        payload.id
          ? `Campaign ${uiPromotion.title} berhasil diperbarui di database.`
          : `Campaign ${uiPromotion.title} berhasil dibuat dengan kode ${uiPromotion.code}.`
      );
      setIsFormOpen(false);
      setEditingPromotion(null);
      router.refresh();
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menyimpan campaign ke database.');
    }
  }

  async function togglePromotion(promotion) {
    const original = promotions.find((item) => item.id === promotion.id) ?? promotion;
    const nextPromotion = {
      ...original,
      manualStatus: original.manualStatus === 'active' ? 'inactive' : 'active',
    };

    try {
      const saved = await promotionApi.update(
        original.id,
        toApiPromotion(nextPromotion, original)
      );
      const uiPromotion = toUiPromotion(saved);
      setPromotions((prev) =>
        prev.map((item) => (item.id === original.id ? uiPromotion : item))
      );
      setNotification(
        `Campaign ${uiPromotion.title} berhasil ${
          original.manualStatus === 'active' ? 'dinonaktifkan' : 'diaktifkan kembali'
        }.`
      );
      router.refresh();
    } catch (error) {
      toast.error(error?.message ?? 'Gagal mengubah status campaign.');
    }
  }

  async function deletePromotion(promotion) {
    try {
      await promotionApi.remove(promotion.id);
      setPromotions((prev) => prev.filter((item) => item.id !== promotion.id));
      setNotification(`Campaign ${promotion.title} berhasil dihapus dari database.`);
      router.refresh();
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menghapus campaign dari database.');
    }
  }

  function handleVoucherFieldChange(event) {
    const { name, value } = event.target;
    setVoucherForm((prev) => ({ ...prev, [name]: value }));
  }

  async function generateVouchers(event) {
    event.preventDefault();

    const quantity = Math.min(50, Math.max(1, Number(voucherForm.quantity) || 1));
    const discountValue = Number(voucherForm.discountValue) || 0;
    const expiryDays = Number(voucherForm.expiryDays) || 30;

    if (discountValue <= 0 || (voucherForm.discountType === 'percentage' && discountValue > 100)) {
      toast.error('Nilai voucher tidak valid. Persentase harus berada pada rentang 1-100%.');
      return;
    }

    const usedCodes = new Set(existingCodes);
    const batchId = `BATCH-${Date.now()}`;
    const newCodes = Array.from({ length: quantity }).map(() =>
      generateUniqueCode(voucherForm.prefix, usedCodes)
    );
    const baseDate = today ?? new Date();
    const startDate = toDateInputValue(baseDate);
    const endDate = toDateInputValue(addDays(baseDate, expiryDays));
    const items = newCodes.map((code) =>
      toApiPromotion(
        {
          title: `Voucher ${sanitizeCodePart(voucherForm.prefix)} Batch`,
          description: 'Voucher satu kali pakai hasil Voucher Generator.',
          type: 'voucher',
          code,
          discountType: voucherForm.discountType,
          discountValue,
          minPurchaseAmount: 0,
          program: voucherForm.program,
          startDate,
          endDate,
          usageLimit: 1,
          redeemedCount: 0,
          manualStatus: 'active',
          batchId,
        },
        null
      )
    );

    try {
      const saved = await promotionApi.createBatch(items);
      setPromotions((prev) => [...saved.map(toUiPromotion), ...prev]);
      setGeneratedCodes(newCodes);
      setNotification(`${newCodes.length} voucher unik berhasil disimpan dalam ${batchId}.`);
      router.refresh();
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menyimpan batch voucher ke database.');
    }
  }

  function downloadGeneratedCodes() {
    const csv = ['code', ...generatedCodes].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'voucher-aaa-sport-academy.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function generateReferral(event) {
    event.preventDefault();

    const name = referralForm.referrerName.trim();
    const discountValue = Number(referralForm.discountValue);

    if (name.length < 2) {
      toast.error('Masukkan nama pemberi referral terlebih dahulu.');
      return;
    }
    if (!discountValue || discountValue < 1 || discountValue > 100) {
      toast.error('Diskon referral harus berada pada rentang 1-100%.');
      return;
    }

    const firstName = sanitizeCodePart(name.split(' ')[0], 'TEMAN').slice(0, 8);
    const usedCodes = new Set(existingCodes);
    let code = '';
    do {
      code = `AAA-${firstName}-${randomCodePart(4)}`;
    } while (usedCodes.has(code));

    const baseDate = today ?? new Date();
    const payload = toApiPromotion(
      {
        title: `Referral ${name}`,
        description: `Kode referral pribadi untuk ${name}. Teman yang mendaftar dan pemberi referral mengikuti ketentuan benefit yang berlaku.`,
        type: 'referral',
        code,
        discountType: 'percentage',
        discountValue,
        minPurchaseAmount: 0,
        program: 'ALL',
        startDate: toDateInputValue(baseDate),
        endDate: toDateInputValue(addDays(baseDate, 90)),
        usageLimit: 999,
        manualStatus: 'active',
        batchId: '',
        referrerBenefit: `Pemberi referral memperoleh benefit sesuai ketentuan campaign.`,
        refereeBenefit: `Pendaftar baru memperoleh diskon ${discountValue}%.`,
      },
      null
    );

    try {
      const saved = await promotionApi.create(payload);
      setPromotions((prev) => [toUiPromotion(saved), ...prev]);
      setGeneratedReferralCode(code);
      setNotification(`Referral code ${code} berhasil disimpan untuk ${name}.`);
      router.refresh();
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menyimpan referral code ke database.');
    }
  }

  const promotionColumns = [
    {
      key: 'campaign',
      label: 'Campaign',
      render: (row) => {
        const TypeIcon = PROMOTION_TYPES[row.type]?.icon ?? Megaphone;
        return (
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0066CC] ring-1 ring-blue-100">
              <TypeIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900">{row.title}</p>
              <p className="mt-0.5 text-xs font-semibold text-[#0066CC]">
                {PROMOTION_TYPES[row.type]?.label} • {PROGRAM_LABELS[row.program] ?? row.program}
              </p>
              <p className="mt-1 line-clamp-2 max-w-sm text-xs leading-relaxed text-slate-500">{row.description}</p>
              {row.batchId ? <p className="mt-1 text-[11px] text-slate-400">{row.batchId}</p> : null}
            </div>
          </div>
        );
      },
    },
    {
      key: 'code',
      label: 'Kode',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleCopy(row.code, `Kode ${row.code} berhasil disalin.`)}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-800 transition-colors hover:bg-blue-50 hover:text-[#0066CC]"
          title="Klik untuk menyalin kode"
        >
          {row.code}
          <Copy className="h-3.5 w-3.5" />
        </button>
      ),
    },
    {
      key: 'discount',
      label: 'Diskon',
      render: (row) => (
        <div>
          <p className="whitespace-nowrap font-extrabold text-[#0066CC]">{getDiscountLabel(row)}</p>
          <p className="mt-0.5 whitespace-nowrap text-[11px] text-slate-400">
            Min. {row.minPurchaseAmount ? formatRupiah(row.minPurchaseAmount) : 'tanpa minimum'}
          </p>
        </div>
      ),
    },
    {
      key: 'period',
      label: 'Periode Berlaku',
      render: (row) => (
        <div className="whitespace-nowrap text-xs">
          <p className="font-bold text-slate-800">{formatDate(row.startDate)}</p>
          <p className="mt-0.5 text-slate-400">s/d {formatDate(row.endDate)}</p>
        </div>
      ),
    },
    {
      key: 'usage',
      label: 'Pemakaian',
      render: (row) => {
        const percentage = row.usageLimit
          ? Math.min(100, Math.round((row.redeemedCount / row.usageLimit) * 100))
          : 0;
        return (
          <div className="min-w-28">
            <p className="text-xs font-bold text-slate-800">
              {row.redeemedCount}/{row.usageLimit ?? '∞'} <span className="font-medium text-slate-400">({percentage}%)</span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-50">
              <div className="h-full rounded-full bg-[#0066CC]" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.derivedStatus.badgeStatus}>{row.derivedStatus.label}</Badge>,
    },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => openEdit(row)}
            aria-label={`Edit ${row.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-50 hover:text-[#0066CC]"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => togglePromotion(row)}
            aria-label={`${row.manualStatus === 'active' ? 'Nonaktifkan' : 'Aktifkan'} ${row.title}`}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-blue-50',
              row.manualStatus === 'active' ? 'text-emerald-600' : 'text-slate-400'
            )}
          >
            <Power className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => deletePromotion(row)}
            aria-label={`Hapus ${row.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge status="active">Marketing</Badge>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {today ? formatDate(today) : 'Memuat tanggal...'}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Campaign Manager
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Buat flash sale dengan periode berlaku, hasilkan referral code, dan generate voucher
            unik dalam batch untuk promosi pendaftaran.
          </p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />} className="shrink-0">
          Buat Campaign
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

      {!today ? (
        <CampaignSkeleton />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Megaphone} label="Campaign Active" value={campaignStats.active} description="Promo yang sedang berjalan hari ini" />
            <StatCard icon={CalendarDays} label="Scheduled" value={campaignStats.scheduled} description="Campaign yang belum memasuki tanggal mulai" />
            <StatCard icon={TicketPercent} label="Total Redemption" value={campaignStats.redemptions} description="Total kode yang tercatat sudah dipakai di database" />
            <StatCard icon={Gift} label="Voucher Tersedia" value={campaignStats.unusedVouchers} description="Voucher aktif yang dapat dibagikan" />
          </section>

          <section className="grid items-start gap-4 sm:gap-6 xl:grid-cols-3">
            {/* Campaign List */}
            <Card
              title="Daftar Campaign & Promo"
              description="Status dihitung dari tanggal berlaku, status manual, dan batas penggunaan."
              contentClassName="p-0 sm:p-0"
              className="xl:col-span-2"
            >
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari campaign atau kode..."
                    aria-label="Cari campaign"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>
                <div className="relative sm:w-56">
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    aria-label="Filter tipe campaign"
                    className={getSelectClassName(false, 'mt-0 bg-white')}
                  >
                    <option value="all">Semua Tipe</option>
                    {Object.entries(PROMOTION_TYPES).map(([value, meta]) => (
                      <option key={value} value={value}>{meta.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <Table
                data={filteredPromotions}
                columns={promotionColumns}
                containerClassName="rounded-none border-0 shadow-none"
                minWidthClassName="min-w-[980px]"
                emptyMessage="Campaign tidak ditemukan"
                emptyDescription="Coba ubah pencarian/filter atau buat campaign baru."
              />
            </Card>

            {/* Tools */}
            <div className="space-y-4 sm:space-y-6">
              <Card title="Voucher Generator" description="Buat banyak kode unik satu kali pakai dalam satu batch.">
                <form onSubmit={generateVouchers} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="voucher-prefix" className="text-xs font-bold text-slate-600">Prefix</label>
                      <input id="voucher-prefix" name="prefix" value={voucherForm.prefix} onChange={handleVoucherFieldChange} className={getInputClassName(false, 'uppercase')} />
                    </div>
                    <div>
                      <label htmlFor="voucher-quantity" className="text-xs font-bold text-slate-600">Jumlah (1-50)</label>
                      <input id="voucher-quantity" name="quantity" type="number" min="1" max="50" value={voucherForm.quantity} onChange={handleVoucherFieldChange} className={getInputClassName(false)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="voucher-type" className="text-xs font-bold text-slate-600">Jenis Diskon</label>
                      <div className="relative">
                        <select id="voucher-type" name="discountType" value={voucherForm.discountType} onChange={handleVoucherFieldChange} className={getSelectClassName(false)}>
                          <option value="percentage">Persentase</option>
                          <option value="fixed_amount">Nominal</option>
                          <option value="free_session">Sesi Gratis</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="voucher-value" className="text-xs font-bold text-slate-600">Nilai</label>
                      <input id="voucher-value" name="discountValue" type="number" min="1" value={voucherForm.discountValue} onChange={handleVoucherFieldChange} className={getInputClassName(false)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="voucher-expiry" className="text-xs font-bold text-slate-600">Berlaku (hari)</label>
                      <input id="voucher-expiry" name="expiryDays" type="number" min="1" value={voucherForm.expiryDays} onChange={handleVoucherFieldChange} className={getInputClassName(false)} />
                    </div>
                    <div>
                      <label htmlFor="voucher-program" className="text-xs font-bold text-slate-600">Program</label>
                      <div className="relative">
                        <select id="voucher-program" name="program" value={voucherForm.program} onChange={handleVoucherFieldChange} className={getSelectClassName(false)}>
                          {PROGRAM_OPTIONS.map((program) => (
                            <option key={program} value={program}>{PROGRAM_LABELS[program] ?? program}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" fullWidth leftIcon={<Gift className="h-4 w-4" />}>
                    Generate Voucher
                  </Button>
                </form>

                {generatedCodes.length ? (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">Kode Terakhir Dibuat</p>
                      <span className="text-xs text-slate-400">{generatedCodes.length} kode</span>
                    </div>
                    <div className="mt-3 max-h-36 space-y-1.5 overflow-y-auto rounded-2xl bg-slate-50 p-3 font-mono text-xs text-slate-700">
                      {generatedCodes.map((code) => <p key={code}>{code}</p>)}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => handleCopy(generatedCodes.join('\n'), 'Semua kode voucher berhasil disalin.')}
                        leftIcon={<Copy className="h-4 w-4" />}
                      >
                        Salin Semua
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        onClick={downloadGeneratedCodes}
                        leftIcon={<Download className="h-4 w-4" />}
                      >
                        CSV
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Card>

              <Card title="Referral Code Generator" description="Buat kode referral personal untuk siswa/orang tua.">
                <form onSubmit={generateReferral} className="space-y-4">
                  <div>
                    <label htmlFor="referral-name" className="text-xs font-bold text-slate-600">Nama Pemberi Referral</label>
                    <input
                      id="referral-name"
                      value={referralForm.referrerName}
                      onChange={(event) => setReferralForm((prev) => ({ ...prev, referrerName: event.target.value }))}
                      placeholder="Contoh: Ibu Nadia Prasetyo"
                      className={getInputClassName(false)}
                    />
                  </div>
                  <div>
                    <label htmlFor="referral-discount" className="text-xs font-bold text-slate-600">Diskon Teman (%)</label>
                    <input
                      id="referral-discount"
                      type="number"
                      min="1"
                      max="100"
                      value={referralForm.discountValue}
                      onChange={(event) => setReferralForm((prev) => ({ ...prev, discountValue: event.target.value }))}
                      className={getInputClassName(false)}
                    />
                  </div>
                  <Button type="submit" fullWidth variant="secondary" leftIcon={<Users className="h-4 w-4" />}>
                    Generate Referral Code
                  </Button>
                </form>

                {generatedReferralCode ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedReferralCode, `Referral code ${generatedReferralCode} berhasil disalin.`)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 font-mono text-sm font-extrabold text-[#0066CC] transition-colors hover:bg-blue-100"
                    title="Klik untuk menyalin referral code"
                  >
                    {generatedReferralCode}
                    <Copy className="h-4 w-4" />
                  </button>
                ) : null}
              </Card>
            </div>
          </section>
        </>
      )}

      {isFormOpen && today ? (
        <PromotionFormModal
          key={editingPromotion?.id ?? 'new-promotion'}
          initialData={editingPromotion}
          existingCodes={existingCodes}
          today={today}
          onClose={() => {
            setIsFormOpen(false);
            setEditingPromotion(null);
          }}
          onSave={handleSavePromotion}
        />
      ) : null}
    </div>
  );
}
