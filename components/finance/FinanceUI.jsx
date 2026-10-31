'use client';

import {
  Banknote,
  BarChart3,
  Landmark,
  MapPin,
  Package,
  Plus,
  QrCode,
  ReceiptText,
} from 'lucide-react';
import { StatusBadge } from '@/components/data-master/DataMasterUI';
import {
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_LABELS,
} from '@/lib/finance/constants';
import { formatCurrency } from '@/lib/finance/financeUtils';
import { PROGRAM_CONFIG } from '@/lib/operational/constants';
import { cn } from '@/lib/utils';

export function getFinanceProgramLabel(program) {
  return PROGRAM_CONFIG[program]?.title ?? program ?? 'Tanpa Program';
}

export function FinanceHeader({ canManage, onCreatePayment }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#0066CC]">
          Grup Finance
        </p>
        <h2 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Finance
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
          Catat pembayaran, kelola katalog paket dan langganan siswa, pantau
          jatuh tempo, serta buat laporan pendapatan dari database.
        </p>
      </div>

      {canManage ? (
        <button
          type="button"
          onClick={() => onCreatePayment()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] focus:outline-none focus:ring-4 focus:ring-blue-600/20"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Catat Pembayaran
        </button>
      ) : null}
    </div>
  );
}

const tabItems = [
  { value: 'transactions', label: 'Transaksi', icon: ReceiptText },
  { value: 'subscriptions', label: 'Paket & Langganan', icon: Package },
  { value: 'reports', label: 'Laporan', icon: BarChart3 },
];

export function FinanceTabs({ activeTab, onChange, counts = {} }) {
  return (
    <div className="grid gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-900/[0.02] sm:grid-cols-3">
      {tabItems.map(({ value, label, icon: Icon }) => {
        const isActive = activeTab === value;
        const count = counts[value];

        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-600/15',
              isActive
                ? 'bg-[#0066CC] text-white shadow-sm shadow-blue-600/25'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
            {typeof count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-extrabold',
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function TransactionStatusBadge({ status }) {
  const tones = {
    PAID: 'green',
    PENDING: 'amber',
    FAILED: 'red',
    CANCELLED: 'slate',
    REFUNDED: 'violet',
  };

  return (
    <StatusBadge
      label={TRANSACTION_STATUS_LABELS[status] ?? status}
      tone={tones[status] ?? 'slate'}
    />
  );
}

export function SubscriptionDueBadge({ dueState }) {
  if (!dueState) return <StatusBadge label="Memuat" tone="slate" />;

  return <StatusBadge label={dueState.label} tone={dueState.tone} />;
}

export function PaymentMethodLabel({ method }) {
  const Icon =
    method === 'CASH' ? Banknote : method === 'QRIS' ? QrCode : Landmark;

  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
      <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
      {PAYMENT_METHOD_LABELS[method] ?? method}
    </span>
  );
}

export function ProgramBadge({ program }) {
  return <StatusBadge label={getFinanceProgramLabel(program)} tone="blue" />;
}

export function VenueLabel({ venueName, location }) {
  if (!venueName) return <span className="text-slate-400">-</span>;

  return (
    <span className="inline-flex min-w-0 items-start gap-1.5">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-700">
          {venueName}
        </span>
        {location ? (
          <span className="block truncate text-xs text-slate-400">
            {location}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function FinanceReadOnlyNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
      Mode lihat saja: hanya akun Superadmin/Owner/Admin yang dapat mencatat pembayaran,
      mengubah paket/langganan, atau mengelola transaksi Finance.
    </div>
  );
}

export function ReportGroupCard({ title, icon: Icon, groups = [], emptyText }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#0066CC] ring-1 ring-blue-100">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="font-heading text-base font-extrabold text-slate-900">
          {title}
        </h3>
      </div>

      {groups.length > 0 ? (
        <div className="mt-5 space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-700">
                    {group.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {group.count} transaksi • {group.percentage.toFixed(1)}%
                  </p>
                </div>
                <p className="shrink-0 font-extrabold text-slate-900">
                  {formatCurrency(group.amount)}
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#0066CC]"
                  style={{ width: `${Math.min(group.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
          {emptyText ?? 'Belum ada pendapatan lunas pada periode ini.'}
        </p>
      )}
    </section>
  );
}
