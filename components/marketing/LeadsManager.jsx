'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Inbox,
  UserPlus,
  Search,
  MessageCircle,
  Phone,
  CalendarDays,
  Check,
  X,
  ChevronDown,
  Clock,
  Send,
  BellRing,
  GraduationCap,
  MapPin,
  UserCheck,
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { leadApi } from '@/lib/marketing/marketingClient';

/* -------------------------------------------------------------------------- */
/* CONSTANTS & DATABASE ADAPTERS                                            */
/* -------------------------------------------------------------------------- */

const STATUS_META = {
  new: { label: 'Baru', badgeStatus: 'active' },
  contacted: { label: 'Dihubungi', badgeStatus: 'pending' },
  waiting_response: { label: 'Menunggu Respons', badgeStatus: 'pending' },
  trial_scheduled: { label: 'Trial Dijadwalkan', badgeStatus: 'active' },
  trial_completed: { label: 'Trial Selesai', badgeStatus: 'completed' },
  registered: { label: 'Terdaftar', badgeStatus: 'completed' },
  not_interested: { label: 'Tidak Berminat', badgeStatus: 'inactive' },
  unreachable: { label: 'Tidak Terhubung', badgeStatus: 'cancelled' },
};

const SOURCE_LABELS = {
  website: 'Website',
  landing_page: 'Landing Page Promo',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  referral: 'Referral',
  walk_in: 'Walk-in',
  event: 'Event Sekolah',
  other: 'Lainnya',
};

const PROGRAM_OPTIONS = ['AAA', 'A3', 'SWDC', 'PRIVATE'];
const PROGRAM_LABELS = {
  AAA: 'AAA Sport Academy',
  A3: 'A3',
  SWDC: 'SWDC Swimmer',
  PRIVATE: 'Private',
};

function formatRelativeLabel(value) {
  if (!value) return '-';

  const date = new Date(value);
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSeconds < 60) return 'Baru saja';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} menit lalu`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} jam lalu`;
  if (diffSeconds < 7 * 86400) {
    const days = Math.floor(diffSeconds / 86400);
    return days === 1 ? 'Kemarin' : `${days} hari lalu`;
  }
  if (diffSeconds < 30 * 86400) {
    const weeks = Math.floor(diffSeconds / (7 * 86400));
    return weeks <= 1 ? '1 minggu lalu' : `${weeks} minggu lalu`;
  }

  return formatDate(date);
}

function getFollowUpOffset(value) {
  if (!value) return null;
  return Math.round(
    (startOfDay(new Date(value)) - startOfDay(new Date())) / (1000 * 60 * 60 * 24)
  );
}

function toUiLead(lead) {
  return {
    id: lead.id,
    studentName: lead.studentName,
    studentAge: lead.studentAge ?? null,
    parentName: lead.parentName,
    parentPhone: lead.parentPhone,
    parentEmail: lead.parentEmail ?? '',
    program: lead.program ?? '',
    poolPreference: lead.poolPreference || 'Belum memilih',
    source: String(lead.source ?? 'WEBSITE').toLowerCase(),
    referralCode: lead.referralCode ?? '',
    message: lead.message ?? '',
    status: String(lead.status ?? 'NEW').toLowerCase(),
    priority: String(lead.priority ?? 'MEDIUM').toLowerCase(),
    assignedToId: lead.assignedToId ?? '',
    assignedTo: lead.assignedTo?.name ?? 'Belum ditugaskan',
    receivedLabel: formatRelativeLabel(lead.createdAt),
    nextFollowUpAt: lead.nextFollowUpAt ?? null,
    nextFollowUpDateValue: lead.nextFollowUpAt
      ? toDateInputValue(new Date(lead.nextFollowUpAt))
      : '',
    nextFollowUpOffset: getFollowUpOffset(lead.nextFollowUpAt),
    trialScheduledAt: lead.trialScheduledAt ?? null,
    trialDateValue: lead.trialScheduledAt
      ? toDateInputValue(new Date(lead.trialScheduledAt))
      : '',
    activities: (lead.activities ?? []).map((activity) => ({
      id: activity.id,
      label: activity.description || activity.title,
      timeLabel: formatRelativeLabel(activity.createdAt),
    })),
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

function toApiLeadCreate(payload) {
  return {
    studentName: payload.studentName,
    studentAge: payload.studentAge,
    parentName: payload.parentName,
    parentPhone: payload.parentPhone,
    parentEmail: payload.parentEmail || null,
    program: payload.program,
    poolPreference: payload.poolPreference || null,
    source: String(payload.source ?? 'website').toUpperCase(),
    message: payload.message || null,
    priority: 'HIGH',
  };
}

function toApiLeadUpdate(values) {
  return {
    status: String(values.status).toUpperCase(),
    assignedToId: values.assignedToId || null,
    nextFollowUpAt: values.nextFollowUpAt
      ? new Date(`${values.nextFollowUpAt}T09:00:00`).toISOString()
      : null,
    trialScheduledAt: values.trialScheduledAt
      ? new Date(`${values.trialScheduledAt}T09:00:00`).toISOString()
      : null,
  };
}

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

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function normalizeWhatsAppNumber(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

function buildWhatsAppLink(lead) {
  const message = `Halo ${lead.parentName}, terima kasih telah menghubungi AAA Sport Academy. Saya membantu follow-up pendaftaran ${lead.studentName} untuk program ${PROGRAM_LABELS[lead.program] ?? lead.program}. Apakah berkenan kami bantu pilih jadwal trial yang cocok?`;
  return `https://wa.me/${normalizeWhatsAppNumber(lead.parentPhone)}?text=${encodeURIComponent(message)}`;
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

function PriorityBadge({ priority }) {
  const styles = {
    high: 'bg-red-50 text-red-700 ring-red-600/15',
    medium: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    low: 'bg-slate-100 text-slate-500 ring-slate-500/10',
  };
  const labels = { high: 'Prioritas Tinggi', medium: 'Prioritas Sedang', low: 'Prioritas Rendah' };

  return (
    <span className={cn('inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-extrabold ring-1 ring-inset', styles[priority])}>
      {labels[priority] ?? labels.medium}
    </span>
  );
}

function LeadsSkeleton() {
  return (
    <div role="status" aria-label="Memuat leads" className="space-y-4 sm:space-y-6">
      <span className="sr-only">Memuat inbox leads...</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padded>
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
            <div className="mt-4 h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <Card padded className="xl:col-span-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="mb-3 h-20 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </Card>
        <Card padded className="xl:col-span-3">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        </Card>
      </div>
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
/* ADD LEAD MODAL                                                             */
/* -------------------------------------------------------------------------- */

function AddLeadModal({ poolOptions = [], onClose, onSave }) {
  const [formData, setFormData] = useState({
    studentName: '',
    studentAge: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    program: 'AAA',
    poolPreference: poolOptions[0] ?? '',
    source: 'whatsapp',
    message: '',
  });
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    const cleanedPhone = formData.parentPhone.replace(/[\s-]/g, '');

    if (formData.studentName.trim().length < 3) nextErrors.studentName = 'Nama siswa minimal 3 karakter.';
    if (formData.parentName.trim().length < 3) nextErrors.parentName = 'Nama orang tua minimal 3 karakter.';
    if (!/^(?:\+62|62|0)8\d{7,13}$/.test(cleanedPhone)) {
      nextErrors.parentPhone = 'Masukkan nomor WhatsApp Indonesia yang valid.';
    }
    if (formData.studentAge && (Number(formData.studentAge) < 3 || Number(formData.studentAge) > 18)) {
      nextErrors.studentAge = 'Usia harus berada pada rentang 3-18 tahun.';
    }
    if (formData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      nextErrors.parentEmail = 'Format email tidak valid.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSave({
      ...formData,
      studentName: formData.studentName.trim(),
      parentName: formData.parentName.trim(),
      parentPhone: cleanedPhone,
      parentEmail: formData.parentEmail.trim(),
      studentAge: formData.studentAge ? Number(formData.studentAge) : null,
      message: formData.message.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Tutup form lead"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-lead-title"
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h3 id="add-lead-title" className="text-lg font-extrabold text-slate-900">Tambah Lead Manual</h3>
            <p className="mt-1 text-sm text-slate-500">Untuk pendaftaran dari telepon, walk-in, event, atau chat manual.</p>
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
          <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:px-6">
            <div>
              <label htmlFor="lead-student-name" className="text-sm font-bold text-slate-700">
                Nama Siswa <span className="text-red-500">*</span>
              </label>
              <input id="lead-student-name" name="studentName" value={formData.studentName} onChange={handleChange} className={getInputClassName(errors.studentName)} />
              {errors.studentName ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.studentName}</p> : null}
            </div>
            <div>
              <label htmlFor="lead-student-age" className="text-sm font-bold text-slate-700">Usia Siswa</label>
              <input id="lead-student-age" name="studentAge" type="number" min="3" max="18" value={formData.studentAge} onChange={handleChange} className={getInputClassName(errors.studentAge)} />
              {errors.studentAge ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.studentAge}</p> : null}
            </div>
            <div>
              <label htmlFor="lead-parent-name" className="text-sm font-bold text-slate-700">
                Nama Orang Tua <span className="text-red-500">*</span>
              </label>
              <input id="lead-parent-name" name="parentName" value={formData.parentName} onChange={handleChange} className={getInputClassName(errors.parentName)} />
              {errors.parentName ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.parentName}</p> : null}
            </div>
            <div>
              <label htmlFor="lead-phone" className="text-sm font-bold text-slate-700">
                WhatsApp Orang Tua <span className="text-red-500">*</span>
              </label>
              <input id="lead-phone" name="parentPhone" type="tel" value={formData.parentPhone} onChange={handleChange} placeholder="081234567890" className={getInputClassName(errors.parentPhone)} />
              {errors.parentPhone ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.parentPhone}</p> : null}
            </div>
            <div>
              <label htmlFor="lead-email" className="text-sm font-bold text-slate-700">Email Orang Tua</label>
              <input id="lead-email" name="parentEmail" type="email" value={formData.parentEmail} onChange={handleChange} className={getInputClassName(errors.parentEmail)} />
              {errors.parentEmail ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.parentEmail}</p> : null}
            </div>
            <div>
              <label htmlFor="lead-program" className="text-sm font-bold text-slate-700">Program Diminati</label>
              <div className="relative">
                <select id="lead-program" name="program" value={formData.program} onChange={handleChange} className={getSelectClassName(false)}>
                  {PROGRAM_OPTIONS.map((program) => <option key={program} value={program}>{PROGRAM_LABELS[program] ?? program}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
              </div>
            </div>
            <div>
              <label htmlFor="lead-pool" className="text-sm font-bold text-slate-700">Preferensi Kolam</label>
              <div className="relative">
                <select id="lead-pool" name="poolPreference" value={formData.poolPreference} onChange={handleChange} className={getSelectClassName(false)}>
                  <option value="">Belum Memilih</option>
                  {poolOptions.map((pool) => <option key={pool} value={pool}>{pool}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
              </div>
            </div>
            <div>
              <label htmlFor="lead-source" className="text-sm font-bold text-slate-700">Sumber Lead</label>
              <div className="relative">
                <select id="lead-source" name="source" value={formData.source} onChange={handleChange} className={getSelectClassName(false)}>
                  {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="lead-message" className="text-sm font-bold text-slate-700">Pesan / Kebutuhan</label>
              <textarea
                id="lead-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                maxLength={600}
                placeholder="Tulis kebutuhan jadwal, pengalaman anak, atau pertanyaan orang tua..."
                className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-relaxed outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10"
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" leftIcon={<UserPlus className="h-4 w-4" />}>Tambah ke Inbox</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* LEAD DETAIL / FOLLOW-UP PANEL                                              */
/* -------------------------------------------------------------------------- */

function LeadDetail({ lead, today, assignees = [], onUpdateLead, onAddActivity }) {
  const [status, setStatus] = useState(lead.status);
  const [assignedToId, setAssignedToId] = useState(lead.assignedToId ?? '');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(() =>
    lead.nextFollowUpDateValue || toDateInputValue(addDays(today, 1))
  );
  const [trialDate, setTrialDate] = useState(() => {
    if (lead.trialDateValue) return lead.trialDateValue;
    return lead.status === 'trial_scheduled' ? toDateInputValue(addDays(today, 1)) : '';
  });
  const [activityNote, setActivityNote] = useState('');

  const dueOffset = lead.nextFollowUpOffset ?? 0;
  const dueLabel =
    dueOffset < 0
      ? `Terlambat ${Math.abs(dueOffset)} hari`
      : dueOffset === 0
        ? 'Follow-up hari ini'
        : `Follow-up ${dueOffset} hari lagi`;

  async function saveFollowUp(nextStatus = status) {
    const success = await onUpdateLead(lead.id, {
      status: nextStatus,
      assignedToId: assignedToId || null,
      nextFollowUpAt: nextFollowUpDate || null,
      trialScheduledAt: nextStatus === 'trial_scheduled' ? trialDate || null : lead.trialDateValue || null,
    });

    if (success && nextStatus !== status) setStatus(nextStatus);
  }

  async function submitActivity(event) {
    event.preventDefault();
    const trimmed = activityNote.trim();
    if (!trimmed) return;

    const success = await onAddActivity(lead.id, trimmed);
    if (success) setActivityNote('');
  }

  return (
    <Card>
      {/* Lead Identity */}
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0066CC] text-sm font-extrabold text-white">
              {getInitials(lead.studentName)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-xl font-extrabold text-slate-900">{lead.studentName}</h3>
                <PriorityBadge priority={lead.priority} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {lead.studentAge ? `${lead.studentAge} tahun • ` : ''}Orang tua: {lead.parentName}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge status={STATUS_META[lead.status]?.badgeStatus}>{STATUS_META[lead.status]?.label}</Badge>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                  <Clock className="h-3.5 w-3.5" /> Masuk {lead.receivedLabel}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-bold',
                    dueOffset < 0 ? 'text-red-600' : dueOffset === 0 ? 'text-amber-600' : 'text-slate-400'
                  )}
                >
                  <BellRing className="h-3.5 w-3.5" /> {dueLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              href={buildWhatsAppLink(lead)}
              target="_blank"
              rel="noreferrer"
              leftIcon={<MessageCircle className="h-4 w-4" />}
            >
              WhatsApp
            </Button>
            <Button
              href={`tel:${lead.parentPhone}`}
              variant="secondary"
              leftIcon={<Phone className="h-4 w-4" />}
            >
              Telepon
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Program', PROGRAM_LABELS[lead.program] ?? lead.program, GraduationCap],
            ['Preferensi Kolam', lead.poolPreference, MapPin],
            ['Sumber', SOURCE_LABELS[lead.source] ?? lead.source, Inbox],
            ['Penanggung Jawab', lead.assignedTo, UserCheck],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl bg-slate-50 px-3.5 py-3">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Icon className="h-3.5 w-3.5 text-[#0066CC]" />
                {label}
              </p>
              <p className="mt-1 truncate text-sm font-bold text-slate-900" title={value}>{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0066CC]">Pesan Pendaftaran</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{lead.message || 'Tidak ada pesan tambahan.'}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>WhatsApp: {lead.parentPhone}</span>
            {lead.parentEmail ? <span>Email: {lead.parentEmail}</span> : null}
            {lead.referralCode ? <span>Kode: <strong className="font-mono text-[#0066CC]">{lead.referralCode}</strong></span> : null}
          </div>
        </div>
      </div>

      {/* Follow-up Controls */}
      <div className="grid gap-6 px-5 py-5 sm:px-6 xl:grid-cols-2">
        <div>
          <h4 className="font-extrabold text-slate-900">Update Follow-Up</h4>
          <p className="mt-1 text-sm text-slate-500">Atur status funnel, penanggung jawab, dan jadwal kontak berikutnya.</p>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="follow-status" className="text-sm font-bold text-slate-700">Status Follow-Up</label>
              <div className="relative">
                <select id="follow-status" value={status} onChange={(event) => setStatus(event.target.value)} className={getSelectClassName(false)}>
                  {Object.entries(STATUS_META).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="follow-assigned" className="text-sm font-bold text-slate-700">Ditangani Oleh</label>
                <div className="relative">
                  <select id="follow-assigned" value={assignedToId} onChange={(event) => setAssignedToId(event.target.value)} className={getSelectClassName(false)}>
                    <option value="">Belum ditugaskan</option>
                    {assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name} • {assignee.role}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
                </div>
              </div>
              <div>
                <label htmlFor="follow-date" className="text-sm font-bold text-slate-700">Follow-Up Berikutnya</label>
                <input id="follow-date" type="date" value={nextFollowUpDate} onChange={(event) => setNextFollowUpDate(event.target.value)} className={getInputClassName(false)} />
              </div>
            </div>

            <div>
              <label htmlFor="trial-date" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                <CalendarDays className="h-4 w-4 text-[#0066CC]" /> Tanggal Trial
              </label>
              <input id="trial-date" type="date" value={trialDate} onChange={(event) => setTrialDate(event.target.value)} className={getInputClassName(false)} />
              {trialDate ? <p className="mt-1.5 text-xs text-slate-400">Trial: {formatDate(new Date(`${trialDate}T00:00:00`))}</p> : null}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => saveFollowUp()} leftIcon={<Check className="h-4 w-4" />}>
                Simpan Follow-Up
              </Button>
              <Button
                variant="secondary"
                onClick={() => saveFollowUp('trial_scheduled')}
                disabled={!trialDate}
                leftIcon={<CalendarDays className="h-4 w-4" />}
              >
                Jadwalkan Trial
              </Button>
              <Button variant="ghost" onClick={() => saveFollowUp('registered')}>
                Tandai Terdaftar
              </Button>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div>
          <h4 className="font-extrabold text-slate-900">Catatan & Aktivitas</h4>
          <p className="mt-1 text-sm text-slate-500">Riwayat kontak agar follow-up tidak terduplikasi antarstaff.</p>

          <ol className="mt-4 space-y-4">
            {lead.activities.map((activity, index) => (
              <li key={activity.id} className="relative flex gap-3">
                {index < lead.activities.length - 1 ? (
                  <span className="absolute left-[7px] top-5 h-[calc(100%-8px)] w-px bg-slate-200" aria-hidden="true" />
                ) : null}
                <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white bg-[#0066CC] ring-1 ring-blue-200" />
                <div className="min-w-0 pb-1">
                  <p className="text-sm leading-relaxed text-slate-700">{activity.label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{activity.timeLabel}</p>
                </div>
              </li>
            ))}
          </ol>

          <form onSubmit={submitActivity} className="mt-5">
            <label htmlFor="activity-note" className="text-sm font-bold text-slate-700">Tambah Catatan</label>
            <textarea
              id="activity-note"
              value={activityNote}
              onChange={(event) => setActivityNote(event.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Contoh: Ibu meminta dihubungi kembali Jumat sore setelah melihat jadwal sekolah..."
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-relaxed outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10"
            />
            <Button type="submit" size="sm" className="mt-2" leftIcon={<Send className="h-4 w-4" />} disabled={!activityNote.trim()}>
              Simpan Catatan
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function LeadsManager({ initialLeads = [], poolOptions = [], assignees = [] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(() => initialLeads.map(toUiLead));
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0]?.id ?? null);
  const [today, setToday] = useState(null);
  const [notification, setNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    setToday(new Date());
  }, []);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(''), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    document.body.style.overflow = isAddModalOpen ? 'hidden' : '';

    function handleEscape(event) {
      if (event.key === 'Escape') setIsAddModalOpen(false);
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAddModalOpen]);

  const filteredLeads = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      const matchesSearch =
        !keyword ||
        lead.studentName.toLowerCase().includes(keyword) ||
        lead.parentName.toLowerCase().includes(keyword) ||
        lead.parentPhone.includes(keyword) ||
        (lead.program ?? '').toLowerCase().includes(keyword);

      return matchesStatus && matchesSource && matchesSearch;
    });
  }, [leads, searchQuery, statusFilter, sourceFilter]);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? filteredLeads[0] ?? leads[0] ?? null,
    [leads, filteredLeads, selectedLeadId]
  );

  const leadStats = useMemo(() => {
    const registered = leads.filter((lead) => lead.status === 'registered').length;
    return {
      newLeads: leads.filter((lead) => lead.status === 'new').length,
      dueToday: leads.filter(
        (lead) =>
          !['registered', 'not_interested'].includes(lead.status) && (lead.nextFollowUpOffset ?? 0) <= 0
      ).length,
      trials: leads.filter((lead) => lead.status === 'trial_scheduled').length,
      conversion: leads.length ? Math.round((registered / leads.length) * 100) : 0,
    };
  }, [leads]);

  async function updateLead(leadId, values) {
    const lead = leads.find((item) => item.id === leadId);

    try {
      const saved = await leadApi.update(leadId, toApiLeadUpdate(values));
      setLeads((prev) =>
        prev.map((item) => (item.id === leadId ? toUiLead(saved) : item))
      );
      setNotification(`Follow-up ${lead?.studentName ?? 'lead'} berhasil disimpan ke database.`);
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error?.message ?? 'Gagal memperbarui follow-up lead.');
      return false;
    }
  }

  async function addActivity(leadId, label) {
    try {
      const saved = await leadApi.addActivity(leadId, label);
      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? toUiLead(saved) : lead))
      );
      setNotification('Catatan follow-up berhasil disimpan ke database.');
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menambahkan catatan follow-up.');
      return false;
    }
  }

  async function handleAddLead(payload) {
    try {
      const saved = await leadApi.create(toApiLeadCreate(payload));
      const uiLead = toUiLead(saved);
      setLeads((prev) => [uiLead, ...prev]);
      setSelectedLeadId(uiLead.id);
      setIsAddModalOpen(false);
      setNotification(`Lead ${uiLead.studentName} berhasil ditambahkan ke inbox database.`);
      router.refresh();
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menambahkan lead ke database.');
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge status="active">Marketing</Badge>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Inbox className="h-3.5 w-3.5" />
              Inbox pendaftaran & funnel follow-up
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Leads / Funnel
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Kelola calon siswa dari website, campaign, referral, media sosial, dan walk-in sampai
            menjadi trial atau pendaftaran terkonfirmasi.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} leftIcon={<UserPlus className="h-4 w-4" />} className="shrink-0">
          Tambah Lead
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
        <LeadsSkeleton />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Inbox} label="Lead Baru" value={leadStats.newLeads} description="Belum pernah dihubungi oleh admin" />
            <StatCard icon={BellRing} label="Perlu Follow-Up" value={leadStats.dueToday} description="Jatuh tempo hari ini atau sudah terlambat" />
            <StatCard icon={CalendarDays} label="Trial Dijadwalkan" value={leadStats.trials} description="Calon siswa menunggu sesi trial" />
            <StatCard icon={UserCheck} label="Konversi Terdaftar" value={`${leadStats.conversion}%`} description="Persentase lead menjadi siswa terdaftar" />
          </section>

          <section className="grid items-start gap-4 sm:gap-6 xl:grid-cols-5">
            {/* Inbox List */}
            <Card
              title="Inbox Pendaftaran"
              description={`${filteredLeads.length} dari ${leads.length} lead ditampilkan.`}
              contentClassName="p-0 sm:p-0"
              className="xl:col-span-2"
            >
              <div className="space-y-3 border-b border-slate-100 p-4 sm:p-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari siswa, orang tua, WhatsApp..."
                    aria-label="Cari lead"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      aria-label="Filter status lead"
                      className={getSelectClassName(false, 'mt-0 bg-white')}
                    >
                      <option value="all">Semua Status</option>
                      {Object.entries(STATUS_META).map(([value, meta]) => (
                        <option key={value} value={value}>{meta.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <div className="relative">
                    <select
                      value={sourceFilter}
                      onChange={(event) => setSourceFilter(event.target.value)}
                      aria-label="Filter sumber lead"
                      className={getSelectClassName(false, 'mt-0 bg-white')}
                    >
                      <option value="all">Semua Sumber</option>
                      {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="max-h-[760px] divide-y divide-slate-100 overflow-y-auto">
                {filteredLeads.length ? (
                  filteredLeads.map((lead) => {
                    const isSelected = selectedLead?.id === lead.id;
                    const isOverdue =
                      !['registered', 'not_interested'].includes(lead.status) &&
                      (lead.nextFollowUpOffset ?? 0) < 0;

                    return (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => setSelectedLeadId(lead.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          'block w-full px-4 py-4 text-left transition-colors sm:px-5',
                          isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ring-1',
                              isSelected
                                ? 'bg-[#0066CC] text-white ring-blue-600'
                                : 'bg-blue-50 text-[#0066CC] ring-blue-100'
                            )}
                          >
                            {getInitials(lead.studentName)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate font-bold text-slate-900">{lead.studentName}</p>
                              <span className="shrink-0 text-[11px] font-medium text-slate-400">{lead.receivedLabel}</span>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {lead.parentName} • {lead.parentPhone}
                            </p>
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{lead.message}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              <Badge status={STATUS_META[lead.status]?.badgeStatus} size="sm">
                                {STATUS_META[lead.status]?.label}
                              </Badge>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600">
                                {PROGRAM_LABELS[lead.program] ?? lead.program}
                              </span>
                              <span className="text-[11px] text-slate-400">{SOURCE_LABELS[lead.source]}</span>
                              {isOverdue ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600">
                                  <BellRing className="h-3 w-3" /> Terlambat
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-6 py-14 text-center">
                    <p className="font-extrabold text-slate-900">Lead tidak ditemukan</p>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
                      Coba ubah pencarian atau filter status/sumber lead.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Detail */}
            <div className="xl:col-span-3">
              {selectedLead ? (
                <LeadDetail
                  key={selectedLead.id}
                  lead={selectedLead}
                  today={today}
                  assignees={assignees}
                  onUpdateLead={updateLead}
                  onAddActivity={addActivity}
                />
              ) : (
                <Card padded className="text-center">
                  <h3 className="font-extrabold text-slate-900">Belum ada lead</h3>
                  <p className="mt-1 text-sm text-slate-500">Tambahkan lead manual untuk memulai funnel.</p>
                </Card>
              )}
            </div>
          </section>
        </>
      )}

      {isAddModalOpen ? (
        <AddLeadModal poolOptions={poolOptions} onClose={() => setIsAddModalOpen(false)} onSave={handleAddLead} />
      ) : null}
    </div>
  );
}
