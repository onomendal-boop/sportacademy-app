'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function getInitials(name = '') {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return initials || 'AA';
}

export function formatDate(value) {
  if (!value) return '-';

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function inputClassName(hasError = false, additionalClassName = '') {
  return cn(
    'mt-1.5 h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
      : 'border-slate-200 focus:border-[#0066CC] focus:ring-blue-600/10',
    additionalClassName
  );
}

export function DataMasterHeader({
  title,
  description,
  addLabel,
  canManage,
  onAdd,
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#0066CC]">
          Data Master
        </p>
        <h2 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      </div>

      {canManage ? (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] focus:outline-none focus:ring-4 focus:ring-blue-600/20"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {addLabel}
        </button>
      ) : null}
    </div>
  );
}

const statTones = {
  blue: 'bg-blue-50 text-[#0066CC] ring-blue-100',
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
};

export function StatCard({ icon: Icon, label, value, description, tone = 'blue' }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </p>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
          ) : null}
        </div>
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1',
            statTones[tone] ?? statTones.blue
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

export function DataMasterToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  children,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02] lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:bg-white focus:ring-4 focus:ring-blue-600/10"
        />
      </div>

      {children ? <div className="grid gap-3 sm:grid-cols-2 lg:flex">{children}</div> : null}
    </div>
  );
}

export function StatusBadge({ label, tone = 'slate' }) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    slate: 'bg-slate-100 text-slate-600 ring-slate-500/10',
    blue: 'bg-blue-50 text-[#0066CC] ring-blue-600/15',
    violet: 'bg-violet-50 text-violet-700 ring-violet-600/15',
    red: 'bg-red-50 text-red-700 ring-red-600/15',
  };

  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1',
        styles[tone] ?? styles.slate
      )}
    >
      {label}
    </span>
  );
}

export function Avatar({ name, imageUrl, className = '' }) {
  const [hasError, setHasError] = useState(false);

  if (imageUrl && !hasError) {
    return (
      <img
        src={imageUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={cn('h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200', className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-extrabold text-[#0066CC] ring-1 ring-blue-100',
        className
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

export function FormField({ label, htmlFor, error, required = false, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-bold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

export function DataMasterModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  disableClose = false,
  maxWidthClassName = 'max-w-2xl',
}) {
  useEffect(() => {
    if (!open) return undefined;

    function handleEscape(event) {
      if (event.key === 'Escape' && !disableClose) onClose();
    }

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose, disableClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Tutup modal"
        disabled={disableClose}
        onClick={onClose}
        className="absolute inset-0 cursor-default disabled:cursor-not-allowed"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]',
          maxWidthClassName
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h3 className="font-heading text-xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={disableClose}
            aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function DeleteConfirmModal({
  open,
  title,
  itemName,
  description,
  isDeleting,
  onCancel,
  onConfirm,
}) {
  return (
    <DataMasterModal
      open={open}
      title={title}
      description="Tindakan ini tidak dapat dibatalkan."
      onClose={onCancel}
      disableClose={isDeleting}
      maxWidthClassName="max-w-md"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="text-sm leading-relaxed text-slate-600">
          <p>
            Hapus <strong className="text-slate-900">{itemName}</strong>?
          </p>
          {description ? <p className="mt-2">{description}</p> : null}
        </div>
      </div>
    </DataMasterModal>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-[#0066CC] ring-1 ring-blue-100">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-heading text-lg font-extrabold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

export function ReadOnlyNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
      Mode lihat saja: hanya akun Superadmin/Owner/Admin yang dapat menambah atau mengubah Data
      Master; penghapusan permanen khusus Superadmin/Owner.
    </div>
  );
}
