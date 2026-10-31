'use client';

import {
  Briefcase,
  CalendarDays,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Phone,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import useStaffManager from '@/hooks/useStaffManager';
import {
  STAFF_DEPARTMENTS,
  STAFF_POSITIONS,
  STAFF_STATUS_LABELS,
  STAFF_STATUS_OPTIONS,
} from '@/lib/data-master/constants';
import {
  Avatar,
  DataMasterHeader,
  DataMasterModal,
  DataMasterToolbar,
  DeleteConfirmModal,
  EmptyState,
  FormField,
  ReadOnlyNotice,
  StatCard,
  StatusBadge,
  formatDate,
  inputClassName,
} from './DataMasterUI';

function statusTone(status) {
  if (status === 'ACTIVE') return 'green';
  if (status === 'ON_LEAVE') return 'amber';
  return 'slate';
}

export default function StaffManager({ initialStaff = [], canManage = false, canDelete = false }) {
  const manager = useStaffManager(initialStaff, canManage, canDelete);
  const {
    filteredStaff,
    stats,
    search,
    statusFilter,
    positionFilter,
    isFormOpen,
    editingStaff,
    formData,
    formErrors,
    isSaving,
    deleteTarget,
    isDeleting,
  } = manager;

  const positionOptions = formData.position && !STAFF_POSITIONS.includes(formData.position)
    ? [formData.position, ...STAFF_POSITIONS]
    : STAFF_POSITIONS;

  return (
    <div className="space-y-6">
      <DataMasterHeader
        title="Staff"
        description="Kelola pegawai operasional, administrasi, finance, customer service, dan tim pendukung akademi."
        addLabel="Tambah Staff"
        canManage={canManage}
        onAdd={manager.onCreate}
      />

      {!canManage ? <ReadOnlyNotice /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Staff" value={stats.total} description="Semua data pegawai" />
        <StatCard icon={UserCheck} label="Aktif" value={stats.active} description="Staff yang sedang bertugas" tone="green" />
        <StatCard icon={CalendarDays} label="Cuti" value={stats.onLeave} description="Staff yang sedang cuti" tone="amber" />
        <StatCard icon={UserX} label="Nonaktif" value={stats.inactive} description="Staff yang tidak aktif" tone="slate" />
      </div>

      <DataMasterToolbar
        searchValue={search}
        onSearchChange={manager.onSearchChange}
        searchPlaceholder="Cari nama, posisi, departemen, email, atau telepon..."
      >
        <select
          value={positionFilter}
          onChange={(event) => manager.onPositionFilterChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-52"
          aria-label="Filter posisi staff"
        >
          <option value="ALL">Semua Posisi</option>
          {STAFF_POSITIONS.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => manager.onStatusFilterChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-44"
          aria-label="Filter status staff"
        >
          <option value="ALL">Semua Status</option>
          {STAFF_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </DataMasterToolbar>

      {filteredStaff.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
          <div className="overflow-x-auto">
            <table className="min-w-[880px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-extrabold">Staff</th>
                  <th className="px-5 py-4 font-extrabold">Posisi</th>
                  <th className="px-5 py-4 font-extrabold">Kontak</th>
                  <th className="px-5 py-4 font-extrabold">Bergabung</th>
                  <th className="px-5 py-4 font-extrabold">Status</th>
                  <th className="px-5 py-4 text-right font-extrabold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((item) => (
                  <tr key={item.id} className="transition hover:bg-blue-50/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={item.name} imageUrl={item.profileImage} />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {item.department || 'Tanpa departemen'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={item.position} tone="blue" />
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="truncate">{item.email || '-'}</span>
                      </p>
                      <p className="mt-1.5 flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        {item.phone}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {formatDate(item.joinedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        label={STAFF_STATUS_LABELS[item.status] ?? item.status}
                        tone={statusTone(item.status)}
                      />
                    </td>
                    <td className="px-5 py-4">
                      {canManage || canDelete ? (
                        <div className="flex justify-end gap-2">
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => manager.onEdit(item)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0066CC]"
                              aria-label={`Edit ${item.name}`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => manager.onDeleteRequest(item)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                              aria-label={`Hapus ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <span className="flex justify-end text-slate-300">
                          <Lock className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="Data staff tidak ditemukan"
          description="Belum ada staff yang sesuai dengan pencarian atau filter. Tambahkan staff baru atau ubah filter yang digunakan."
        />
      )}

      <DataMasterModal
        open={isFormOpen}
        title={editingStaff ? 'Edit Staff' : 'Tambah Staff'}
        description="Lengkapi data pegawai. Staff tidak otomatis mendapatkan akun login."
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
              form="staff-form"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSaving ? 'Menyimpan...' : editingStaff ? 'Simpan Perubahan' : 'Tambah Staff'}
            </button>
          </>
        }
      >
        <form id="staff-form" onSubmit={manager.onSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
          <FormField label="Nama Lengkap" htmlFor="staff-name" error={formErrors.name} required>
            <input
              id="staff-name"
              value={formData.name}
              onChange={(event) => manager.onFieldChange('name', event.target.value)}
              placeholder="Nama staff"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.name))}
            />
          </FormField>

          <FormField label="Posisi" htmlFor="staff-position" error={formErrors.position} required>
            <select
              id="staff-position"
              value={formData.position}
              onChange={(event) => manager.onFieldChange('position', event.target.value)}
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.position))}
            >
              <option value="">Pilih posisi</option>
              {positionOptions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Departemen" htmlFor="staff-department" error={formErrors.department}>
            <input
              id="staff-department"
              value={formData.department}
              onChange={(event) => manager.onFieldChange('department', event.target.value)}
              placeholder="Operasional"
              list="staff-departments"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.department))}
            />
            <datalist id="staff-departments">
              {STAFF_DEPARTMENTS.map((department) => (
                <option key={department} value={department} />
              ))}
            </datalist>
          </FormField>

          <FormField label="Status" htmlFor="staff-status" error={formErrors.status} required>
            <select
              id="staff-status"
              value={formData.status}
              onChange={(event) => manager.onFieldChange('status', event.target.value)}
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.status))}
            >
              {STAFF_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Email" htmlFor="staff-email" error={formErrors.email}>
            <input
              id="staff-email"
              type="email"
              value={formData.email}
              onChange={(event) => manager.onFieldChange('email', event.target.value)}
              placeholder="Masukkan email staff"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.email))}
            />
          </FormField>

          <FormField label="Nomor Telepon/WA" htmlFor="staff-phone" error={formErrors.phone} required>
            <input
              id="staff-phone"
              type="tel"
              value={formData.phone}
              onChange={(event) => manager.onFieldChange('phone', event.target.value)}
              placeholder="081234567890"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.phone))}
            />
          </FormField>

          <FormField label="Tanggal Bergabung" htmlFor="staff-joined-at" error={formErrors.joinedAt}>
            <input
              id="staff-joined-at"
              type="date"
              value={formData.joinedAt}
              onChange={(event) => manager.onFieldChange('joinedAt', event.target.value)}
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.joinedAt))}
            />
          </FormField>

          <FormField label="URL Foto Profil" htmlFor="staff-profile-image" error={formErrors.profileImage}>
            <input
              id="staff-profile-image"
              type="url"
              value={formData.profileImage}
              onChange={(event) => manager.onFieldChange('profileImage', event.target.value)}
              placeholder="https://..."
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.profileImage))}
            />
          </FormField>
        </form>
      </DataMasterModal>

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Staff"
        itemName={deleteTarget?.name ?? ''}
        description="Data pegawai akan dihapus dari Data Master. Akun login yang terhubung, bila ada, tidak ikut terhapus."
        isDeleting={isDeleting}
        onCancel={manager.onDeleteCancel}
        onConfirm={manager.onDeleteConfirm}
      />
    </div>
  );
}
