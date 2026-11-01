'use client';

import {
  ClipboardList,
  Dumbbell,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Trash2,
  User,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import useCoachManager from '@/hooks/useCoachManager';
import { COACH_SPECIALIZATIONS } from '@/lib/data-master/constants';
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
  inputClassName,
} from './DataMasterUI';

function specializationTone(specialization) {
  if (specialization === 'SWDC Swimmer') return 'violet';
  if (specialization === 'A3') return 'blue';
  if (specialization === 'Private') return 'amber';
  return 'green';
}

export default function CoachManager({ initialCoaches = [], canManage = false, canDelete = false, initialSearch = '' }) {
  const manager = useCoachManager(initialCoaches, canManage, canDelete, initialSearch);
  const {
    filteredCoaches,
    stats,
    search,
    specializationFilter,
    statusFilter,
    isFormOpen,
    editingCoach,
    formData,
    formErrors,
    isSaving,
    deleteTarget,
    isDeleting,
  } = manager;

  return (
    <div className="space-y-6">
      <DataMasterHeader
        title="Pelatih"
        description="Kelola akun dan profil pelatih AAA Sport Academy berdasarkan data user role COACH di database."
        addLabel="Tambah Pelatih"
        canManage={canManage}
        onAdd={manager.onCreate}
      />

      {!canManage ? <ReadOnlyNotice /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Pelatih" value={stats.total} description="Semua akun pelatih" />
        <StatCard icon={UserCheck} label="Aktif" value={stats.active} description="Dapat login dan ditugaskan" tone="green" />
        <StatCard icon={UserX} label="Nonaktif" value={stats.inactive} description="Tidak dapat login" tone="slate" />
        <StatCard icon={ClipboardList} label="Penugasan" value={stats.assignments} description="Total penugasan jadwal" tone="violet" />
      </div>

      <DataMasterToolbar
        searchValue={search}
        onSearchChange={manager.onSearchChange}
        searchPlaceholder="Cari nama, username, email, atau spesialisasi..."
      >
        <select
          value={specializationFilter}
          onChange={(event) => manager.onSpecializationFilterChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-48"
          aria-label="Filter spesialisasi pelatih"
        >
          <option value="ALL">Semua Spesialisasi</option>
          {COACH_SPECIALIZATIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => manager.onStatusFilterChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-44"
          aria-label="Filter status pelatih"
        >
          <option value="ALL">Semua Status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
        </select>
      </DataMasterToolbar>

      {filteredCoaches.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-extrabold">Pelatih</th>
                  <th className="px-5 py-4 font-extrabold">Akun Login</th>
                  <th className="px-5 py-4 font-extrabold">Spesialisasi</th>
                  <th className="px-5 py-4 font-extrabold">Penugasan</th>
                  <th className="px-5 py-4 font-extrabold">Status</th>
                  <th className="px-5 py-4 text-right font-extrabold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoaches.map((coach) => (
                  <tr key={coach.id} className="transition hover:bg-blue-50/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={coach.name} imageUrl={coach.profileImage} />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{coach.name}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {coach.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-600">
                        <User className="h-3.5 w-3.5" aria-hidden="true" />@{coach.username}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        label={coach.specialization || 'AAA Sport Academy'}
                        tone={specializationTone(coach.specialization)}
                      />
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {coach.assignmentCount ?? 0} jadwal
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        label={coach.isActive ? 'Aktif' : 'Nonaktif'}
                        tone={coach.isActive ? 'green' : 'slate'}
                      />
                    </td>
                    <td className="px-5 py-4">
                      {canManage || canDelete ? (
                        <div className="flex justify-end gap-2">
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => manager.onEdit(coach)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0066CC]"
                              aria-label={`Edit ${coach.name}`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => manager.onDeleteRequest(coach)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                              aria-label={`Hapus ${coach.name}`}
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
          icon={Dumbbell}
          title="Data pelatih tidak ditemukan"
          description="Belum ada pelatih yang sesuai dengan pencarian atau filter. Tambahkan pelatih baru atau ubah filter yang digunakan."
        />
      )}

      <DataMasterModal
        open={isFormOpen}
        title={editingCoach ? 'Edit Pelatih' : 'Tambah Pelatih'}
        description="Pelatih disimpan sebagai akun User role COACH dan dapat login menggunakan username."
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
              form="coach-form"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSaving ? 'Menyimpan...' : editingCoach ? 'Simpan Perubahan' : 'Tambah Pelatih'}
            </button>
          </>
        }
      >
        <form id="coach-form" onSubmit={manager.onSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
          <FormField label="Nama Lengkap" htmlFor="coach-name" error={formErrors.name} required>
            <input
              id="coach-name"
              value={formData.name}
              onChange={(event) => manager.onFieldChange('name', event.target.value)}
              placeholder="Nama pelatih"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.name))}
            />
          </FormField>

          <FormField label="Username Login" htmlFor="coach-username" error={formErrors.username} required>
            <input
              id="coach-username"
              value={formData.username}
              onChange={(event) => manager.onFieldChange('username', event.target.value)}
              placeholder="coach11"
              autoComplete="off"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.username))}
            />
          </FormField>

          <FormField label="Email" htmlFor="coach-email" error={formErrors.email} required>
            <input
              id="coach-email"
              type="email"
              value={formData.email}
              onChange={(event) => manager.onFieldChange('email', event.target.value)}
              placeholder="Masukkan email pelatih"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.email))}
            />
          </FormField>

          <FormField label="Spesialisasi" htmlFor="coach-specialization" error={formErrors.specialization} required>
            <select
              id="coach-specialization"
              value={formData.specialization}
              onChange={(event) => manager.onFieldChange('specialization', event.target.value)}
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.specialization))}
            >
              {COACH_SPECIALIZATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label={editingCoach ? 'Password Baru (opsional)' : 'Password Awal (opsional)'}
            htmlFor="coach-password"
            error={formErrors.password}
          >
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-[26px] h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="coach-password"
                type="password"
                value={formData.password}
                onChange={(event) => manager.onFieldChange('password', event.target.value)}
                placeholder={editingCoach ? 'Kosongkan jika tidak diganti' : 'Default: password123'}
                autoComplete="new-password"
                disabled={isSaving}
                className={inputClassName(Boolean(formErrors.password), 'pl-10')}
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              {editingCoach
                ? 'Isi hanya apabila ingin mereset password pelatih.'
                : 'Jika dikosongkan, password awal adalah password123.'}
            </p>
          </FormField>

          <FormField label="Status Akun" htmlFor="coach-status" error={formErrors.isActive} required>
            <select
              id="coach-status"
              value={formData.status}
              onChange={(event) => manager.onFieldChange('status', event.target.value)}
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.isActive))}
            >
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="URL Foto Profil" htmlFor="coach-profile-image" error={formErrors.profileImage}>
              <input
                id="coach-profile-image"
                type="url"
                value={formData.profileImage}
                onChange={(event) => manager.onFieldChange('profileImage', event.target.value)}
                placeholder="Kosongkan untuk avatar otomatis dari nama"
                disabled={isSaving}
                className={inputClassName(Boolean(formErrors.profileImage))}
              />
            </FormField>
          </div>
        </form>
      </DataMasterModal>

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Pelatih"
        itemName={deleteTarget?.name ?? ''}
        description={
          deleteTarget?.assignmentCount > 0
            ? `Pelatih ini memiliki ${deleteTarget.assignmentCount} penugasan. Server akan menolak penghapusan; nonaktifkan akun sebagai gantinya.`
            : 'Akun login dan profil pelatih akan dihapus permanen dari database.'
        }
        isDeleting={isDeleting}
        onCancel={manager.onDeleteCancel}
        onConfirm={manager.onDeleteConfirm}
      />
    </div>
  );
}
