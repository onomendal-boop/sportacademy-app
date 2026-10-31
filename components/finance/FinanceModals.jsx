'use client';

import {
  BadgeCheck,
  CalendarDays,
  Loader2,
  Printer,
  ReceiptText,
} from 'lucide-react';
import {
  DataMasterModal,
  DeleteConfirmModal,
  FormField,
  StatusBadge,
  inputClassName,
} from '@/components/data-master/DataMasterUI';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  SUBSCRIPTION_STATUS_OPTIONS,
  TRANSACTION_STATUS_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  getAllowedTransactionStatuses,
} from '@/lib/finance/constants';
import {
  formatCurrency,
  formatDateKey,
  formatTransactionDateTime,
  getTransactionDateKey,
} from '@/lib/finance/financeUtils';
import { PROGRAM_OPTIONS } from '@/lib/operational/constants';
import { cn } from '@/lib/utils';
import {
  ProgramBadge,
  TransactionStatusBadge,
  getFinanceProgramLabel,
} from './FinanceUI';

function ModalFooter({ formId, onClose, isSaving, submitLabel }) {
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isSaving}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Batal
      </button>
      <button
        type="submit"
        form={formId}
        disabled={isSaving}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : null}
        {isSaving ? 'Menyimpan...' : submitLabel}
      </button>
    </>
  );
}

function TextArea({
  id,
  value,
  onChange,
  disabled,
  hasError,
  placeholder,
  rows = 3,
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      rows={rows}
      placeholder={placeholder}
      className={cn(
        inputClassName(hasError),
        'h-auto min-h-24 resize-y py-3 leading-relaxed'
      )}
    />
  );
}

function VenueOptions({ venues }) {
  return venues.map((venue) => (
    <option key={venue.id} value={venue.id}>
      {venue.name} - {venue.location}
      {venue.status === 'MAINTENANCE' ? ' (Maintenance)' : ''}
    </option>
  ));
}

export function PackageFormModal({ finance }) {
  const form = finance.packageFormData;
  const errors = finance.packageFormErrors;
  const isSaving = finance.isSavingPackage;

  return (
    <DataMasterModal
      open={finance.isPackageFormOpen}
      title={finance.editingPackage ? 'Ubah Paket' : 'Tambah Paket'}
      description="Katalog paket digunakan pada form pembayaran dan pembuatan langganan. Perubahan katalog tidak mengubah snapshot histori lama."
      onClose={finance.closePackageForm}
      disableClose={isSaving}
      maxWidthClassName="max-w-3xl"
      footer={
        <ModalFooter
          formId="finance-package-form"
          onClose={finance.closePackageForm}
          isSaving={isSaving}
          submitLabel={
            finance.editingPackage ? 'Simpan Perubahan' : 'Tambah Paket'
          }
        />
      }
    >
      <form
        id="finance-package-form"
        onSubmit={finance.submitPackageForm}
        className="grid gap-5 sm:grid-cols-2"
        noValidate
      >
        <FormField
          label="Nama Paket"
          htmlFor="package-name"
          error={errors.name}
          required
        >
          <input
            id="package-name"
            value={form.name}
            onChange={(event) =>
              finance.updatePackageField('name', event.target.value)
            }
            placeholder="AAA Pemula 1 Bulan"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.name))}
          />
        </FormField>

        <FormField
          label="Program"
          htmlFor="package-program"
          error={errors.program}
          required
        >
          <select
            id="package-program"
            value={form.program}
            onChange={(event) =>
              finance.updatePackageField('program', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.program))}
          >
            {PROGRAM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Harga (Rupiah)"
          htmlFor="package-price"
          error={errors.price}
          required
        >
          <input
            id="package-price"
            type="number"
            min="1"
            step="1"
            value={form.price}
            onChange={(event) =>
              finance.updatePackageField('price', event.target.value)
            }
            placeholder="650000"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.price))}
          />
          {form.price ? (
            <p className="mt-1.5 text-xs font-semibold text-slate-500">
              {formatCurrency(Number(form.price) || 0)}
            </p>
          ) : null}
        </FormField>

        <FormField
          label="Tempat Latihan Default"
          htmlFor="package-venue"
          error={errors.defaultTrainingVenueId}
        >
          <select
            id="package-venue"
            value={form.defaultTrainingVenueId}
            onChange={(event) =>
              finance.updatePackageField(
                'defaultTrainingVenueId',
                event.target.value
              )
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.defaultTrainingVenueId))}
          >
            <option value="">Pilih saat pembayaran</option>
            <VenueOptions venues={finance.venues} />
          </select>
        </FormField>

        <FormField
          label="Label Durasi"
          htmlFor="package-duration-label"
          error={errors.durationLabel}
          required
        >
          <input
            id="package-duration-label"
            value={form.durationLabel}
            onChange={(event) =>
              finance.updatePackageField('durationLabel', event.target.value)
            }
            placeholder="1 Bulan"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.durationLabel))}
          />
        </FormField>

        <FormField
          label="Durasi (hari)"
          htmlFor="package-duration-days"
          error={errors.durationDays}
          required
        >
          <input
            id="package-duration-days"
            type="number"
            min="1"
            step="1"
            value={form.durationDays}
            onChange={(event) =>
              finance.updatePackageField('durationDays', event.target.value)
            }
            placeholder="30"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.durationDays))}
          />
        </FormField>

        <FormField
          label="Total Sesi"
          htmlFor="package-sessions"
          error={errors.totalSessions}
        >
          <input
            id="package-sessions"
            type="number"
            min="1"
            step="1"
            value={form.totalSessions}
            onChange={(event) =>
              finance.updatePackageField('totalSessions', event.target.value)
            }
            placeholder="Kosongkan jika berbasis waktu"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.totalSessions))}
          />
        </FormField>

        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                finance.updatePackageField('isActive', event.target.checked)
              }
              disabled={isSaving}
              className="h-4 w-4 rounded border-slate-300 accent-[#0066CC]"
            />
            Paket aktif dan dapat dijual
          </label>
        </div>

        <div className="sm:col-span-2">
          <FormField
            label="Deskripsi Paket"
            htmlFor="package-description"
            error={errors.description}
          >
            <TextArea
              id="package-description"
              value={form.description}
              onChange={(event) =>
                finance.updatePackageField('description', event.target.value)
              }
              disabled={isSaving}
              hasError={Boolean(errors.description)}
              placeholder="Jelaskan manfaat, frekuensi latihan, atau ketentuan paket..."
            />
          </FormField>
        </div>
      </form>
    </DataMasterModal>
  );
}

export function PaymentFormModal({ finance }) {
  const form = finance.paymentFormData;
  const errors = finance.paymentFormErrors;
  const isSaving = finance.isSavingPayment;
  const isEditing = Boolean(finance.editingTransaction);
  const isEntitlementType = ['SUBSCRIPTION_PAYMENT', 'PRIVATE_VOUCHER'].includes(
    form.type
  );
  const createStatusOptions = TRANSACTION_STATUS_OPTIONS.filter((option) =>
    ['PAID', 'PENDING'].includes(option.value)
  );
  const statusOptions = isEditing
    ? getAllowedTransactionStatuses(finance.editingTransaction.status)
    : createStatusOptions;
  const referenceRequired =
    form.status === 'PAID' && form.paymentMethod !== 'CASH';
  const selectedPackage = finance.selectedPaymentPackage;
  const editingStudentMissingFromOptions =
    isEditing &&
    finance.editingTransaction.student &&
    !finance.studentById[finance.editingTransaction.student.id];
  const editingPackageMissingFromOptions =
    isEditing &&
    finance.editingTransaction.package &&
    !finance.activePackages.some(
      (pkg) => pkg.id === finance.editingTransaction.package.id
    );

  return (
    <DataMasterModal
      open={finance.isPaymentFormOpen}
      title={
        isEditing
          ? 'Ubah Transaksi'
          : form.subscriptionId
            ? 'Pembayaran / Perpanjangan Langganan'
            : 'Catat Pembayaran'
      }
      description={
        isEditing
          ? 'Siswa, paket, dan jenis transaksi dikunci demi audit. Perubahan status mengikuti aturan transisi Finance.'
          : 'Pembayaran paket berstatus Lunas akan membuat/memperpanjang langganan; status Menunggu membuat langganan pending.'
      }
      onClose={finance.closePaymentForm}
      disableClose={isSaving}
      maxWidthClassName="max-w-3xl"
      footer={
        <ModalFooter
          formId="finance-payment-form"
          onClose={finance.closePaymentForm}
          isSaving={isSaving}
          submitLabel={isEditing ? 'Simpan Perubahan' : 'Simpan Pembayaran'}
        />
      }
    >
      <form
        id="finance-payment-form"
        onSubmit={finance.submitPaymentForm}
        className="grid gap-5 sm:grid-cols-2"
        noValidate
      >
        {isEditing ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Invoice
                </p>
                <p className="mt-1 font-extrabold text-slate-900">
                  {finance.editingTransaction.invoiceNumber}
                </p>
              </div>
              <TransactionStatusBadge
                status={finance.editingTransaction.status}
              />
            </div>
          </div>
        ) : null}

        <FormField
          label="Siswa"
          htmlFor="payment-student"
          error={errors.studentId}
          required={!isEditing}
        >
          <select
            id="payment-student"
            value={form.studentId}
            onChange={(event) =>
              finance.updatePaymentField('studentId', event.target.value)
            }
            disabled={isSaving || isEditing}
            className={inputClassName(Boolean(errors.studentId))}
          >
            <option value="">Pilih siswa</option>
            {finance.students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} • {getFinanceProgramLabel(student.level)}
                {student.status === 'PENDING' ? ' • Pending' : ''}
              </option>
            ))}
            {editingStudentMissingFromOptions ? (
              <option value={finance.editingTransaction.student.id}>
                {finance.editingTransaction.student.name}
              </option>
            ) : null}
          </select>
        </FormField>

        <FormField
          label="Jenis Transaksi"
          htmlFor="payment-type"
          error={errors.type}
          required={!isEditing}
        >
          <select
            id="payment-type"
            value={form.type}
            onChange={(event) =>
              finance.updatePaymentField('type', event.target.value)
            }
            disabled={isSaving || isEditing}
            className={inputClassName(Boolean(errors.type))}
          >
            {TRANSACTION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        {isEntitlementType ? (
          <FormField
            label="Paket"
            htmlFor="payment-package"
            error={errors.packageId}
            required={!isEditing}
          >
            <select
              id="payment-package"
              value={form.packageId}
              onChange={(event) =>
                finance.updatePaymentField('packageId', event.target.value)
              }
              disabled={isSaving || isEditing}
              className={inputClassName(Boolean(errors.packageId))}
            >
              <option value="">Pilih paket aktif</option>
              {finance.activePackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} • {formatCurrency(pkg.price)}
                </option>
              ))}
              {editingPackageMissingFromOptions ? (
                <option value={finance.editingTransaction.package.id}>
                  {finance.editingTransaction.package.name}
                </option>
              ) : null}
            </select>
          </FormField>
        ) : (
          <div className="flex items-end pb-1">
            <p className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-500">
              Jenis ini tidak membuat langganan otomatis.
            </p>
          </div>
        )}

        <FormField
          label="Tempat Latihan"
          htmlFor="payment-venue"
          error={errors.trainingVenueId}
        >
          <select
            id="payment-venue"
            value={form.trainingVenueId}
            onChange={(event) =>
              finance.updatePaymentField('trainingVenueId', event.target.value)
            }
            disabled={isSaving || isEditing}
            className={inputClassName(Boolean(errors.trainingVenueId))}
          >
            <option value="">Ikuti default paket / tanpa tempat</option>
            <VenueOptions venues={finance.venues} />
          </select>
        </FormField>

        {selectedPackage && !isEditing ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-slate-900">
                  {selectedPackage.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedPackage.durationLabel} ({selectedPackage.durationDays}{' '}
                  hari)
                  {selectedPackage.totalSessions
                    ? ` • ${selectedPackage.totalSessions} sesi`
                    : ' • Berbasis masa berlaku'}
                </p>
              </div>
              <ProgramBadge program={selectedPackage.program} />
            </div>
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <FormField
            label="Keterangan Transaksi"
            htmlFor="payment-description"
            error={errors.description}
            required={isEditing}
          >
            <input
              id="payment-description"
              value={form.description}
              onChange={(event) =>
                finance.updatePaymentField('description', event.target.value)
              }
              placeholder="Pembayaran AAA Pemula 1 Bulan"
              disabled={isSaving}
              className={inputClassName(Boolean(errors.description))}
            />
          </FormField>
        </div>

        <FormField
          label="Nominal Bayar (Rupiah)"
          htmlFor="payment-amount"
          error={errors.amount}
          required
        >
          <input
            id="payment-amount"
            type="number"
            min="1"
            step="1"
            value={form.amount}
            onChange={(event) =>
              finance.updatePaymentField('amount', event.target.value)
            }
            placeholder="650000"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.amount))}
          />
          {form.amount ? (
            <p className="mt-1.5 text-xs font-semibold text-slate-500">
              {formatCurrency(Number(form.amount) || 0)}
            </p>
          ) : null}
        </FormField>

        <FormField
          label="Metode Pembayaran"
          htmlFor="payment-method"
          error={errors.paymentMethod}
          required
        >
          <select
            id="payment-method"
            value={form.paymentMethod}
            onChange={(event) =>
              finance.updatePaymentField('paymentMethod', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.paymentMethod))}
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Status"
          htmlFor="payment-status"
          error={errors.status}
          required
        >
          <select
            id="payment-status"
            value={form.status}
            onChange={(event) =>
              finance.updatePaymentField('status', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.status))}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Nomor Referensi"
          htmlFor="payment-reference"
          error={errors.referenceNumber}
          required={referenceRequired}
        >
          <input
            id="payment-reference"
            value={form.referenceNumber}
            onChange={(event) =>
              finance.updatePaymentField('referenceNumber', event.target.value)
            }
            placeholder={
              form.paymentMethod === 'CASH'
                ? 'Opsional untuk tunai'
                : 'Nomor referensi transfer/QRIS'
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.referenceNumber))}
          />
        </FormField>

        <FormField
          label="Tanggal Transaksi"
          htmlFor="payment-date"
          error={errors.paymentDate}
          required
        >
          <input
            id="payment-date"
            type="date"
            value={form.paymentDate}
            onChange={(event) =>
              finance.updatePaymentField('paymentDate', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.paymentDate))}
          />
        </FormField>

        {!isEditing && isEntitlementType ? (
          <FormField
            label="Tanggal Mulai Langganan"
            htmlFor="payment-start-date"
            error={errors.startDate}
          >
            <input
              id="payment-start-date"
              type="date"
              value={form.startDate}
              onChange={(event) =>
                finance.updatePaymentField('startDate', event.target.value)
              }
              disabled={isSaving}
              className={inputClassName(Boolean(errors.startDate))}
            />
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Untuk perpanjangan aktif, masa berlaku ditambahkan dari tanggal
              kedaluwarsa saat ini agar tidak ada masa aktif yang hilang.
            </p>
          </FormField>
        ) : null}

        {!isEditing && isEntitlementType ? (
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={form.autoRenew}
                onChange={(event) =>
                  finance.updatePaymentField('autoRenew', event.target.checked)
                }
                disabled={isSaving}
                className="h-4 w-4 rounded border-slate-300 accent-[#0066CC]"
              />
              Tandai auto-renew
            </label>
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <FormField label="Catatan" htmlFor="payment-notes" error={errors.notes}>
            <TextArea
              id="payment-notes"
              value={form.notes}
              onChange={(event) =>
                finance.updatePaymentField('notes', event.target.value)
              }
              disabled={isSaving}
              hasError={Boolean(errors.notes)}
              placeholder="Catatan internal transaksi (opsional)..."
              rows={2}
            />
          </FormField>
        </div>
      </form>
    </DataMasterModal>
  );
}

export function SubscriptionFormModal({ finance }) {
  const form = finance.subscriptionFormData;
  const errors = finance.subscriptionFormErrors;
  const isSaving = finance.isSavingSubscription;
  const isEditing = Boolean(finance.editingSubscription);
  const editingStudentMissingFromOptions =
    isEditing &&
    finance.editingSubscription.student &&
    !finance.studentById[finance.editingSubscription.student.id];

  return (
    <DataMasterModal
      open={finance.isSubscriptionFormOpen}
      title={isEditing ? 'Ubah Langganan' : 'Tambah Langganan Manual'}
      description="Form manual berguna untuk migrasi/koreksi data. Alur normal tetap melalui Catat Pembayaran agar invoice dan langganan terhubung."
      onClose={finance.closeSubscriptionForm}
      disableClose={isSaving}
      maxWidthClassName="max-w-3xl"
      footer={
        <ModalFooter
          formId="finance-subscription-form"
          onClose={finance.closeSubscriptionForm}
          isSaving={isSaving}
          submitLabel={isEditing ? 'Simpan Perubahan' : 'Tambah Langganan'}
        />
      }
    >
      <form
        id="finance-subscription-form"
        onSubmit={finance.submitSubscriptionForm}
        className="grid gap-5 sm:grid-cols-2"
        noValidate
      >
        <FormField
          label="Siswa"
          htmlFor="subscription-student"
          error={errors.studentId}
          required
        >
          <select
            id="subscription-student"
            value={form.studentId}
            onChange={(event) =>
              finance.updateSubscriptionField('studentId', event.target.value)
            }
            disabled={isSaving || isEditing}
            className={inputClassName(Boolean(errors.studentId))}
          >
            <option value="">Pilih siswa</option>
            {finance.students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} • {getFinanceProgramLabel(student.level)}
              </option>
            ))}
            {editingStudentMissingFromOptions ? (
              <option value={finance.editingSubscription.student.id}>
                {finance.editingSubscription.student.name}
              </option>
            ) : null}
          </select>
        </FormField>

        <FormField
          label="Paket Katalog"
          htmlFor="subscription-package"
          error={errors.packageId}
        >
          <select
            id="subscription-package"
            value={form.packageId}
            onChange={(event) =>
              finance.updateSubscriptionField('packageId', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.packageId))}
          >
            <option value="">Paket custom / tanpa katalog</option>
            {finance.packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} • {formatCurrency(pkg.price)}
                {pkg.isActive ? '' : ' • Nonaktif'}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Nama Paket Snapshot"
          htmlFor="subscription-package-name"
          error={errors.packageName}
          required
        >
          <input
            id="subscription-package-name"
            value={form.packageName}
            onChange={(event) =>
              finance.updateSubscriptionField('packageName', event.target.value)
            }
            placeholder="AAA Pemula 1 Bulan"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.packageName))}
          />
        </FormField>

        <FormField
          label="Program"
          htmlFor="subscription-program"
          error={errors.program}
          required
        >
          <select
            id="subscription-program"
            value={form.program}
            onChange={(event) =>
              finance.updateSubscriptionField('program', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.program))}
          >
            {PROGRAM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Harga Snapshot (Rupiah)"
          htmlFor="subscription-price"
          error={errors.price}
          required
        >
          <input
            id="subscription-price"
            type="number"
            min="1"
            step="1"
            value={form.price}
            onChange={(event) =>
              finance.updateSubscriptionField('price', event.target.value)
            }
            placeholder="650000"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.price))}
          />
        </FormField>

        <FormField
          label="Tempat Latihan"
          htmlFor="subscription-venue"
          error={errors.trainingVenueId}
        >
          <select
            id="subscription-venue"
            value={form.trainingVenueId}
            onChange={(event) =>
              finance.updateSubscriptionField(
                'trainingVenueId',
                event.target.value
              )
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.trainingVenueId))}
          >
            <option value="">Ikuti default paket / tanpa tempat</option>
            <VenueOptions venues={finance.venues} />
          </select>
        </FormField>

        <FormField
          label="Tanggal Mulai"
          htmlFor="subscription-start"
          error={errors.startsAt}
          required
        >
          <input
            id="subscription-start"
            type="date"
            value={form.startsAt}
            onChange={(event) =>
              finance.updateSubscriptionField('startsAt', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.startsAt))}
          />
        </FormField>

        <FormField
          label="Tanggal Berakhir"
          htmlFor="subscription-expire"
          error={errors.expiresAt}
          required
        >
          <input
            id="subscription-expire"
            type="date"
            value={form.expiresAt}
            onChange={(event) =>
              finance.updateSubscriptionField('expiresAt', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.expiresAt))}
          />
        </FormField>

        <FormField
          label="Total Sesi"
          htmlFor="subscription-total-sessions"
          error={errors.totalSessions}
        >
          <input
            id="subscription-total-sessions"
            type="number"
            min="1"
            step="1"
            value={form.totalSessions}
            onChange={(event) =>
              finance.updateSubscriptionField('totalSessions', event.target.value)
            }
            placeholder="Kosongkan jika berbasis waktu"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.totalSessions))}
          />
        </FormField>

        <FormField
          label="Sisa Sesi"
          htmlFor="subscription-remaining-sessions"
          error={errors.remainingSessions}
        >
          <input
            id="subscription-remaining-sessions"
            type="number"
            min="0"
            step="1"
            value={form.remainingSessions}
            onChange={(event) =>
              finance.updateSubscriptionField(
                'remainingSessions',
                event.target.value
              )
            }
            placeholder="Otomatis sama dengan total sesi"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.remainingSessions))}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Isi 0 dan status Selesai apabila kuota sesi sudah habis.
          </p>
        </FormField>

        <FormField
          label="Status"
          htmlFor="subscription-status"
          error={errors.status}
          required
        >
          <select
            id="subscription-status"
            value={form.status}
            onChange={(event) =>
              finance.updateSubscriptionField('status', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.status))}
          >
            {SUBSCRIPTION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.autoRenew}
              onChange={(event) =>
                finance.updateSubscriptionField(
                  'autoRenew',
                  event.target.checked
                )
              }
              disabled={isSaving}
              className="h-4 w-4 rounded border-slate-300 accent-[#0066CC]"
            />
            Auto-renew
          </label>
        </div>

        <div className="sm:col-span-2">
          <FormField label="Catatan" htmlFor="subscription-notes" error={errors.notes}>
            <TextArea
              id="subscription-notes"
              value={form.notes}
              onChange={(event) =>
                finance.updateSubscriptionField('notes', event.target.value)
              }
              disabled={isSaving}
              hasError={Boolean(errors.notes)}
              placeholder="Catatan internal langganan (opsional)..."
              rows={2}
            />
          </FormField>
        </div>
      </form>
    </DataMasterModal>
  );
}

function ReceiptRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-slate-200 py-3 text-sm last:border-none">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-900">{children}</span>
    </div>
  );
}

export function ReceiptModal({ finance }) {
  const transaction = finance.receiptTransaction;

  return (
    <DataMasterModal
      open={Boolean(transaction)}
      title="Kwitansi Pembayaran"
      description={
        transaction
          ? `${transaction.invoiceNumber} • ${formatTransactionDateTime(transaction.transactionDate)} WIB`
          : ''
      }
      onClose={finance.closeReceipt}
      maxWidthClassName="max-w-xl"
      footer={
        <>
          <button
            type="button"
            onClick={finance.closeReceipt}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => finance.printReceipt(transaction)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white transition hover:bg-[#0052A3]"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Cetak / Simpan PDF
          </button>
        </>
      }
    >
      {transaction ? (
        <div>
          <div className="rounded-3xl bg-gradient-to-br from-[#0066CC] to-cyan-500 p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 font-heading text-xl font-extrabold">
                  <ReceiptText className="h-6 w-6" aria-hidden="true" />
                  AAA Sport Academy
                </p>
                <p className="mt-1 text-sm text-blue-50">
                  Kwitansi pembayaran resmi
                </p>
              </div>
              <BadgeCheck className="h-9 w-9" aria-hidden="true" />
            </div>

            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-100">
              Total Bayar
            </p>
            <p className="mt-1 font-heading text-3xl font-extrabold">
              {formatCurrency(transaction.amount)}
            </p>
          </div>

          <div className="mt-5">
            <ReceiptRow label="Status">
              <TransactionStatusBadge status={transaction.status} />
            </ReceiptRow>
            <ReceiptRow label="Siswa">
              {transaction.student?.name ?? 'Siswa Terhapus'}
            </ReceiptRow>
            <ReceiptRow label="Keterangan">
              {transaction.description}
            </ReceiptRow>
            <ReceiptRow label="Paket">
              {transaction.package?.name ??
                transaction.subscription?.packageName ??
                '-'}
            </ReceiptRow>
            <ReceiptRow label="Program">
              <ProgramBadge program={transaction.program} />
            </ReceiptRow>
            <ReceiptRow label="Tempat Latihan">
              {transaction.poolName || '-'}
            </ReceiptRow>
            <ReceiptRow label="Metode Pembayaran">
              {PAYMENT_METHOD_LABELS[transaction.paymentMethod] ??
                transaction.paymentMethod}
            </ReceiptRow>
            <ReceiptRow label="Nomor Referensi">
              {transaction.referenceNumber || '-'}
            </ReceiptRow>
            <ReceiptRow label="Tanggal">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
                {formatDateKey(getTransactionDateKey(transaction), {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </ReceiptRow>
            {transaction.subscription ? (
              <ReceiptRow label="Masa Langganan">
                {formatDateKey(transaction.subscription.startsAt)} -{' '}
                {formatDateKey(transaction.subscription.expiresAt)}
              </ReceiptRow>
            ) : null}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            Terima kasih telah berlatih bersama AAA Sport Academy.
          </div>

          <div className="mt-4">
            <StatusBadge label={transaction.invoiceNumber} tone="blue" />
          </div>
        </div>
      ) : null}
    </DataMasterModal>
  );
}

export function FinanceDeleteModal({ finance }) {
  const target = finance.deleteTarget;
  const item = target?.item;

  const copy = !target
    ? { title: 'Hapus Data', itemName: '', description: '' }
    : target.kind === 'package'
      ? {
          title: 'Hapus Paket',
          itemName: item.name,
          description:
            'Paket yang sudah memiliki histori tidak dapat dihapus dan sebaiknya dinonaktifkan.',
        }
      : target.kind === 'subscription'
        ? {
            title: 'Hapus Langganan',
            itemName: `${item.packageName} - ${item.student?.name ?? 'Siswa'}`,
            description:
              'Langganan yang sudah memiliki transaksi tidak dapat dihapus demi menjaga histori.',
          }
        : {
            title: 'Hapus Transaksi',
            itemName: item.invoiceNumber,
            description:
              'Hanya transaksi belum lunas yang dapat dihapus. Transaksi lunas harus direfund, bukan dihapus.',
          };

  return (
    <DeleteConfirmModal
      open={Boolean(target)}
      title={copy.title}
      itemName={copy.itemName}
      description={copy.description}
      isDeleting={finance.isDeleting}
      onCancel={finance.cancelDelete}
      onConfirm={finance.confirmDelete}
    />
  );
}
