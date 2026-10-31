'use client';

import {
  BadgeCheck,
  CalendarClock,
  Clock3,
  CreditCard,
  Loader2,
  Package,
  ReceiptText,
  RefreshCw,
  Ticket,
} from 'lucide-react';
import {
  DataMasterModal,
  EmptyState,
  FormField,
  StatusBadge,
  inputClassName,
} from '@/components/data-master/DataMasterUI';
import useMyPackageManager from '@/hooks/useMyPackageManager';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  SUBSCRIPTION_STATUS_LABELS,
  TRANSACTION_STATUS_LABELS,
} from '@/lib/finance/constants';
import {
  formatCurrency,
  formatDateKey,
} from '@/lib/finance/financeUtils';
import { cn } from '@/lib/utils';
import { getFinanceProgramLabel } from './FinanceUI';

// Halaman Paket Saya khusus siswa: melihat langganan sendiri dan
// mengajukan perpanjangan paket (dibuat sebagai transaksi PENDING
// yang dikonfirmasi admin di grup Finance).

function subscriptionTone(status) {
  if (status === 'ACTIVE') return 'green';
  if (status === 'PENDING') return 'amber';
  return 'slate';
}

function RenewalModal({ manager }) {
  const pkg = manager.selectedPackage;

  return (
    <DataMasterModal
      open={Boolean(pkg)}
      title="Ajukan Perpanjangan Paket"
      description="Pengajuan dibuat sebagai tagihan menunggu pembayaran. Paket diperpanjang otomatis setelah admin mengonfirmasi pembayaran Anda."
      onClose={manager.onCloseRenewal}
      disableClose={manager.isSubmitting}
      footer={
        <>
          <button
            type="button"
            onClick={manager.onCloseRenewal}
            disabled={manager.isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="submit"
            form="renewal-request-form"
            disabled={manager.isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {manager.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            {manager.isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
          </button>
        </>
      }
    >
      {pkg ? (
        <form id="renewal-request-form" onSubmit={manager.onSubmitRenewal} className="space-y-5" noValidate>
          <div className="rounded-2xl bg-blue-50 px-4 py-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0066CC]">
              {getFinanceProgramLabel(pkg.program)}
            </p>
            <p className="mt-1 font-heading text-lg font-extrabold text-slate-900">
              {pkg.name}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {pkg.durationLabel}
              {pkg.totalSessions ? ` • ${pkg.totalSessions} sesi` : ''}
              {pkg.poolName ? ` • ${pkg.poolName}` : ''}
            </p>
            <p className="mt-2 font-heading text-2xl font-extrabold text-[#0066CC]">
              {formatCurrency(pkg.price)}
            </p>
          </div>

          <FormField label="Metode Pembayaran" htmlFor="renewal-payment-method" required>
            <select
              id="renewal-payment-method"
              value={manager.paymentMethod}
              onChange={(event) => manager.onPaymentMethodChange(event.target.value)}
              disabled={manager.isSubmitting}
              className={inputClassName(false)}
            >
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Setelah pengajuan terkirim, selesaikan pembayaran sesuai metode
              yang dipilih lalu tunjukkan bukti bayar ke admin akademi agar
              tagihan dikonfirmasi LUNAS.
            </p>
          </FormField>
        </form>
      ) : null}
    </DataMasterModal>
  );
}

export default function MyPackageManager({
  profile = null,
  initialSubscriptions = [],
  initialTransactions = [],
  packages = [],
}) {
  const manager = useMyPackageManager({
    initialSubscriptions,
    initialTransactions,
    packages,
  });
  const active = manager.activeSubscription;
  const pending = manager.pendingRequest;

  if (!profile) {
    return (
      <EmptyState
        icon={Package}
        title="Profil siswa belum terhubung"
        description="Akun login Anda belum terhubung ke data siswa, sehingga langganan tidak dapat ditampilkan. Hubungi admin akademi untuk menghubungkan akun Anda."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#0066CC]">
          Area Siswa
        </p>
        <h2 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Paket Saya
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">
          Halo, {profile.name}. Lihat masa aktif & sisa sesi paket Anda, lalu
          ajukan perpanjangan sebelum paket berakhir.
        </p>
      </div>

      {pending ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-medium">
            <Clock3 className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <span>
              Pengajuan <strong>{pending.invoiceNumber}</strong> sebesar{' '}
              <strong>{formatCurrency(pending.amount)}</strong> via{' '}
              {PAYMENT_METHOD_LABELS[pending.paymentMethod] ?? pending.paymentMethod}{' '}
              menunggu konfirmasi admin.
            </span>
          </p>
          <StatusBadge
            label={TRANSACTION_STATUS_LABELS[pending.status] ?? pending.status}
            tone="amber"
          />
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
        <div className="flex items-center gap-3 px-5 pt-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0066CC]">
            <Ticket className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-heading text-lg font-extrabold text-slate-900">
              Langganan Aktif
            </h3>
            <p className="text-sm text-slate-500">Paket yang sedang berjalan saat ini.</p>
          </div>
        </div>

        {active ? (
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Paket</p>
              <p className="mt-1 font-bold text-slate-900">{active.packageName}</p>
              <p className="text-sm text-slate-500">
                {getFinanceProgramLabel(active.program)}
                {active.poolName ? ` • ${active.poolName}` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Periode</p>
              <p className="mt-1 font-bold text-slate-900">
                {formatDateKey(active.startsAt)} – {formatDateKey(active.expiresAt)}
              </p>
              <p className="text-sm text-slate-500">
                {manager.activeDaysLeft !== null
                  ? manager.activeDaysLeft >= 0
                    ? `${manager.activeDaysLeft} hari lagi`
                    : 'Sudah melewati tanggal berakhir'
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Sisa Sesi</p>
              <p className="mt-1 font-heading text-2xl font-extrabold text-slate-900">
                {active.remainingSessions ?? '-'}
                {active.totalSessions ? (
                  <span className="ml-1 text-sm font-bold text-slate-400">
                    / {active.totalSessions}
                  </span>
                ) : null}
              </p>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Status</p>
              <div className="mt-1.5">
                <StatusBadge
                  label={SUBSCRIPTION_STATUS_LABELS[active.status] ?? active.status}
                  tone={subscriptionTone(active.status)}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-2 px-5 py-5 text-sm text-slate-500">
            <CalendarClock className="h-5 w-5 text-slate-400" aria-hidden="true" />
            Belum ada langganan aktif. Pilih paket di bawah untuk mulai berlatih.
          </p>
        )}
      </section>

      <section>
        <h3 className="font-heading text-lg font-extrabold text-slate-900">
          Pilihan Paket
        </h3>
        <p className="mt-0.5 text-sm text-slate-500">
          Pengajuan perpanjangan diteruskan ke admin sebagai tagihan resmi.
        </p>

        {manager.packages.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {manager.packages.map((pkg) => (
              <article
                key={pkg.id}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02]"
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0066CC]">
                  {getFinanceProgramLabel(pkg.program)}
                </p>
                <h4 className="mt-1 font-heading text-lg font-extrabold text-slate-900">
                  {pkg.name}
                </h4>
                {pkg.description ? (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
                    {pkg.description}
                  </p>
                ) : null}
                <p className="mt-3 font-heading text-2xl font-extrabold text-slate-900">
                  {formatCurrency(pkg.price)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {pkg.durationLabel}
                  {pkg.totalSessions ? ` • ${pkg.totalSessions} sesi` : ''}
                  {pkg.poolName ? ` • ${pkg.poolName}` : ''}
                </p>
                <button
                  type="button"
                  onClick={() => manager.onOpenRenewal(pkg)}
                  disabled={Boolean(pending)}
                  className={cn(
                    'mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition',
                    pending
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : 'bg-[#0066CC] text-white shadow-sm shadow-blue-600/25 hover:bg-[#0052A3]'
                  )}
                >
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  {active ? 'Perpanjang dengan Paket Ini' : 'Beli Paket Ini'}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={Package}
              title="Belum ada paket tersedia"
              description="Katalog paket sedang kosong. Hubungi admin akademi untuk informasi paket latihan."
            />
          </div>
        )}
      </section>

      {manager.subscriptions.length > 0 ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
          <h3 className="flex items-center gap-2 px-5 pt-5 font-heading text-lg font-extrabold text-slate-900">
            <ReceiptText className="h-5 w-5 text-[#0066CC]" aria-hidden="true" />
            Riwayat Langganan
          </h3>
          <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
            {manager.subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="flex items-center gap-2 font-bold text-slate-900">
                    {subscription.packageName}
                    {subscription.status === 'ACTIVE' ? (
                      <BadgeCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {formatDateKey(subscription.startsAt)} –{' '}
                    {formatDateKey(subscription.expiresAt)}
                    {subscription.remainingSessions !== null
                      ? ` • Sisa ${subscription.remainingSessions} sesi`
                      : ''}
                  </p>
                </div>
                <StatusBadge
                  label={SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
                  tone={subscriptionTone(subscription.status)}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <RenewalModal manager={manager} />
    </div>
  );
}
