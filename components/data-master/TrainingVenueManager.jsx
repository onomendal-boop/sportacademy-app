'use client';

import { useState } from 'react';
import {
  Building2,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  Ruler,
  Trash2,
  Users,
  Waves,
  Wrench,
} from 'lucide-react';
import useTrainingVenueManager from '@/hooks/useTrainingVenueManager';
import {
  TRAINING_VENUE_STATUS_LABELS,
  TRAINING_VENUE_STATUS_OPTIONS,
} from '@/lib/data-master/constants';
import {
  DataMasterHeader,
  DataMasterModal,
  DataMasterToolbar,
  DeleteConfirmModal,
  EmptyState,
  FormField,
  ReadOnlyNotice,
  StatCard,
  StatusBadge,
  inputClassName,
} from './DataMasterUI';

function VenueImage({ venue }) {
  const [hasError, setHasError] = useState(false);

  if (!venue.imageUrl || hasError) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-[#0066CC] via-sky-400 to-cyan-300 text-white">
        <Waves className="h-16 w-16 opacity-80" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={venue.imageUrl}
      alt={venue.name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className="aspect-[16/9] w-full object-cover"
    />
  );
}

function formatDepth(depth) {
  const value = Number(depth);
  if (!Number.isFinite(value)) return '-';

  return value.toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

export default function TrainingVenueManager({
  initialVenues = [],
  canManage = false,
  canDelete = false,
}) {
  const manager = useTrainingVenueManager(initialVenues, canManage, canDelete);
  const {
    filteredVenues,
    locations,
    stats,
    search,
    statusFilter,
    locationFilter,
    isFormOpen,
    editingVenue,
    formData,
    formErrors,
    isSaving,
    deleteTarget,
    isDeleting,
  } = manager;

  return (
    <div className="space-y-6">
      <DataMasterHeader
        title="Tempat Latihan"
        description="Kelola lokasi latihan, kedalaman area latihan, kapasitas, dan status operasional tempat latihan."
        addLabel="Tambah Tempat Latihan"
        canManage={canManage}
        onAdd={manager.onCreate}
      />

      {!canManage ? <ReadOnlyNotice /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Building2} label="Total Tempat" value={stats.total} description="Semua tempat latihan" />
        <StatCard icon={MapPin} label="Aktif" value={stats.active} description="Siap digunakan untuk kelas" tone="green" />
        <StatCard icon={Wrench} label="Maintenance" value={stats.maintenance} description="Sedang dalam perawatan" tone="amber" />
        <StatCard icon={Users} label="Total Kapasitas" value={stats.capacity} description="Akumulasi seluruh tempat" tone="violet" />
      </div>

      <DataMasterToolbar
        searchValue={search}
        onSearchChange={manager.onSearchChange}
        searchPlaceholder="Cari nama tempat latihan atau lokasi..."
      >
        <select
          value={locationFilter}
          onChange={(event) => manager.onLocationFilterChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-48"
          aria-label="Filter lokasi tempat latihan"
        >
          <option value="ALL">Semua Lokasi</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => manager.onStatusFilterChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-44"
          aria-label="Filter status tempat latihan"
        >
          <option value="ALL">Semua Status</option>
          {TRAINING_VENUE_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </DataMasterToolbar>

      {filteredVenues.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredVenues.map((venue) => (
            <article
              key={venue.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-600/5"
            >
              <div className="relative">
                <VenueImage venue={venue} />
                <div className="absolute right-4 top-4">
                  <StatusBadge
                    label={TRAINING_VENUE_STATUS_LABELS[venue.status] ?? venue.status}
                    tone={venue.status === 'ACTIVE' ? 'green' : 'amber'}
                  />
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-heading text-lg font-extrabold tracking-tight text-slate-900">
                      {venue.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="h-4 w-4 shrink-0 text-[#0066CC]" aria-hidden="true" />
                      {venue.location}
                    </p>
                  </div>

                  {canManage || canDelete ? (
                    <div className="flex shrink-0 gap-2">
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => manager.onEdit(venue)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0066CC]"
                          aria-label={`Edit ${venue.name}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => manager.onDeleteRequest(venue)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                          aria-label={`Hapus ${venue.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-slate-300">
                      <Lock className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                      <Ruler className="h-3.5 w-3.5" aria-hidden="true" /> Kedalaman
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-slate-800">
                      {formatDepth(venue.depth)} meter
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" /> Kapasitas
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-slate-800">
                      {venue.capacity} peserta
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="Tempat latihan tidak ditemukan"
          description="Belum ada tempat latihan yang sesuai dengan pencarian atau filter. Tambahkan tempat latihan baru atau ubah filter yang digunakan."
        />
      )}

      <DataMasterModal
        open={isFormOpen}
        title={editingVenue ? 'Edit Tempat Latihan' : 'Tambah Tempat Latihan'}
        description="Data ini digunakan sebagai master lokasi untuk penjadwalan kelas."
        onClose={manager.onCloseForm}
        disableClose={isSaving}
        footer={
          <>
            <button
              type="button"
              onClick={manager.onCloseForm}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              form="training-venue-form"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSaving ? 'Menyimpan...' : editingVenue ? 'Simpan Perubahan' : 'Tambah Tempat'}
            </button>
          </>
        }
      >
        <form id="training-venue-form" onSubmit={manager.onSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
          <FormField label="Nama Tempat Latihan" htmlFor="venue-name" error={formErrors.name} required>
            <input
              id="venue-name"
              value={formData.name}
              onChange={(event) => manager.onFieldChange('name', event.target.value)}
              placeholder="Kolam Utama AAA"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.name))}
            />
          </FormField>

          <FormField label="Lokasi" htmlFor="venue-location" error={formErrors.location} required>
            <input
              id="venue-location"
              value={formData.location}
              onChange={(event) => manager.onFieldChange('location', event.target.value)}
              placeholder="Jakarta Selatan"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.location))}
            />
          </FormField>

          <FormField label="Kedalaman (meter)" htmlFor="venue-depth" error={formErrors.depth} required>
            <input
              id="venue-depth"
              type="number"
              min="0.1"
              step="0.1"
              value={formData.depth}
              onChange={(event) => manager.onFieldChange('depth', event.target.value)}
              placeholder="1.2"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.depth))}
            />
          </FormField>

          <FormField label="Kapasitas Peserta" htmlFor="venue-capacity" error={formErrors.capacity} required>
            <input
              id="venue-capacity"
              type="number"
              min="1"
              step="1"
              value={formData.capacity}
              onChange={(event) => manager.onFieldChange('capacity', event.target.value)}
              placeholder="20"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.capacity))}
            />
          </FormField>

          <FormField label="Status" htmlFor="venue-status" error={formErrors.status} required>
            <select
              id="venue-status"
              value={formData.status}
              onChange={(event) => manager.onFieldChange('status', event.target.value)}
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.status))}
            >
              {TRAINING_VENUE_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="URL Gambar" htmlFor="venue-image" error={formErrors.imageUrl}>
            <input
              id="venue-image"
              type="url"
              value={formData.imageUrl}
              onChange={(event) => manager.onFieldChange('imageUrl', event.target.value)}
              placeholder="https://..."
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.imageUrl))}
            />
          </FormField>
        </form>
      </DataMasterModal>

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Tempat Latihan"
        itemName={deleteTarget?.name ?? ''}
        description="Tempat latihan akan dihapus dari Data Master dan tidak lagi tersedia sebagai pilihan lokasi."
        isDeleting={isDeleting}
        onCancel={manager.onDeleteCancel}
        onConfirm={manager.onDeleteConfirm}
      />
    </div>
  );
}
