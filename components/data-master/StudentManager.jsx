'use client';

import {
  CalendarDays,
  GraduationCap,
  HeartPulse,
  KeyRound,
  Loader2,
  Lock,
  MessageCircle,
  Pencil,
  Phone,
  Trash2,
  TrendingUp,
  Trophy,
  Waves,
} from 'lucide-react';
import useStudentManager from '@/hooks/useStudentManager';
import {
  STUDENT_LEVEL_LABELS,
  STUDENT_LEVEL_OPTIONS,
  STUDENT_STATUS_LABELS,
  STUDENT_STATUS_OPTIONS,
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

function levelTone(level) {
  if (level === 'SWDC') return 'amber';
  if (level === 'A3') return 'violet';
  return 'blue';
}

function statusTone(status) {
  if (status === 'ACTIVE') return 'green';
  if (status === 'PENDING') return 'amber';
  if (status === 'COMPLETED') return 'blue';
  return 'slate';
}

function toWhatsAppUrl(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith('0')) normalized = `62${normalized.slice(1)}`;
  else if (normalized.startsWith('8')) normalized = `62${normalized}`;

  return `https://wa.me/${normalized}`;
}

export default function StudentManager({
  initialStudents = [],
  canManage = false,
  canDelete = false,
}) {
  const manager = useStudentManager(initialStudents, canManage, canDelete);
  const {
    filteredStudents,
    stats,
    search,
    levelFilter,
    statusFilter,
    isFormOpen,
    editingStudent,
    formData,
    formErrors,
    isSaving,
    deleteTarget,
    isDeleting,
  } = manager;

  return (
    <div className="space-y-6">
      <DataMasterHeader
        title="Siswa"
        description="Kelola siswa AAA, A3, dan SWDC beserta kontak orang tua/wali serta informasi kesehatan dasar untuk keselamatan latihan."
        addLabel="Tambah Siswa"
        canManage={canManage}
        onAdd={manager.onCreate}
      />

      {!canManage ? <ReadOnlyNotice /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={GraduationCap}
          label="Total Siswa"
          value={stats.total}
          description={`${stats.active} aktif • ${stats.pending} menunggu`}
        />
        <StatCard
          icon={Waves}
          label="Level AAA"
          value={stats.AAA}
          description="Program pemula"
          tone="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Level A3"
          value={stats.A3}
          description="Program menengah"
          tone="violet"
        />
        <StatCard
          icon={Trophy}
          label="Level SWDC"
          value={stats.SWDC}
          description="Program atlet/prestasi"
          tone="amber"
        />
      </div>

      <DataMasterToolbar
        searchValue={search}
        onSearchChange={manager.onSearchChange}
        searchPlaceholder="Cari nama siswa, kontak ortu, atau username akun..."
      >
        <select
          value={levelFilter}
          onChange={(event) => manager.onLevelFilterChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-48"
          aria-label="Filter level siswa"
        >
          <option value="ALL">Semua Level</option>
          {STUDENT_LEVEL_OPTIONS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => manager.onStatusFilterChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-44"
          aria-label="Filter status siswa"
        >
          <option value="ALL">Semua Status</option>
          {STUDENT_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </DataMasterToolbar>

      {filteredStudents.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
          <div className="overflow-x-auto">
            <table className="min-w-[1020px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-extrabold">Siswa</th>
                  <th className="px-5 py-4 font-extrabold">Level</th>
                  <th className="px-5 py-4 font-extrabold">Kontak Ortu/Wali</th>
                  <th className="px-5 py-4 font-extrabold">Kesehatan</th>
                  <th className="px-5 py-4 font-extrabold">Aktivitas</th>
                  <th className="px-5 py-4 font-extrabold">Status</th>
                  <th className="px-5 py-4 text-right font-extrabold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const whatsappUrl = toWhatsAppUrl(student.parentContact);

                  return (
                    <tr key={student.id} className="transition hover:bg-blue-50/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={student.name}
                            imageUrl={student.account?.profileImage}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900">
                              {student.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {student.age} tahun
                              {student.dateOfBirth
                                ? ` • ${formatDate(student.dateOfBirth)}`
                                : ''}
                            </p>
                            {student.account ? (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                                <KeyRound className="h-3 w-3 shrink-0" aria-hidden="true" />
                                @{student.account.username}
                                {student.account.isActive ? '' : ' (akun nonaktif)'}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-xs text-slate-400">
                                Belum ada akun login
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          label={STUDENT_LEVEL_LABELS[student.level] ?? student.level}
                          tone={levelTone(student.level)}
                        />
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        <p className="flex items-center gap-2 whitespace-nowrap">
                          <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                          {student.parentContact}
                        </p>
                        {whatsappUrl ? (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 transition hover:text-emerald-700"
                          >
                            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            Chat WhatsApp
                          </a>
                        ) : null}
                      </td>

                      <td className="px-5 py-4">
                        {student.healthHistory ? (
                          <p
                            className="flex max-w-[230px] items-start gap-2 text-slate-600"
                            title={student.healthHistory}
                          >
                            <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
                            <span className="line-clamp-2 leading-relaxed">
                              {student.healthHistory}
                            </span>
                          </p>
                        ) : (
                          <span className="text-slate-400">Tidak ada catatan</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        <p>{student.subscriptionCount} langganan</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {student.bookingCount} booking • {student.transactionCount} transaksi • {student.reportCount} raport
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          label={STUDENT_STATUS_LABELS[student.status] ?? student.status}
                          tone={statusTone(student.status)}
                        />
                      </td>

                      <td className="px-5 py-4">
                        {canManage || canDelete ? (
                          <div className="flex justify-end gap-2">
                            {canManage ? (
                              <button
                                type="button"
                                onClick={() => manager.onEdit(student)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0066CC]"
                                aria-label={`Edit ${student.name}`}
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : null}
                            {canDelete ? (
                              <button
                                type="button"
                                onClick={() => manager.onDeleteRequest(student)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                aria-label={`Hapus ${student.name}`}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="Data siswa tidak ditemukan"
          description="Belum ada siswa yang sesuai dengan pencarian atau filter. Tambahkan siswa baru atau ubah filter yang digunakan."
        />
      )}

      <DataMasterModal
        open={isFormOpen}
        title={editingStudent ? 'Edit Siswa' : 'Tambah Siswa'}
        description={
          editingStudent
            ? 'Perbarui informasi siswa, level kelas, dan statusnya.'
            : 'Siswa baru otomatis berstatus Menunggu sampai pembayaran/penjadwalan selesai, kecuali status dipilih lain.'
        }
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
              form="student-form"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSaving ? 'Menyimpan...' : editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </button>
          </>
        }
      >
        <form id="student-form" onSubmit={manager.onSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
          <FormField label="Nama Siswa" htmlFor="student-name" error={formErrors.name} required>
            <input
              id="student-name"
              value={formData.name}
              onChange={(event) => manager.onFieldChange('name', event.target.value)}
              placeholder="Contoh: Aira"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.name))}
            />
          </FormField>

          <FormField label="Tanggal Lahir" htmlFor="student-date-of-birth" error={formErrors.dateOfBirth}>
            <input
              id="student-date-of-birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(event) => manager.onFieldChange('dateOfBirth', event.target.value)}
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.dateOfBirth))}
            />
          </FormField>

          <FormField label="Usia (tahun)" htmlFor="student-age" error={formErrors.age} required>
            <input
              id="student-age"
              type="number"
              min="3"
              max="18"
              step="1"
              value={formData.age}
              onChange={(event) => manager.onFieldChange('age', event.target.value)}
              placeholder="Contoh: 7"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.age))}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Terisi otomatis dari tanggal lahir dan tetap dapat disesuaikan.
            </p>
          </FormField>

          <FormField label="Level" htmlFor="student-level" error={formErrors.level} required>
            <select
              id="student-level"
              value={formData.level}
              onChange={(event) => manager.onFieldChange('level', event.target.value)}
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.level))}
            >
              {STUDENT_LEVEL_OPTIONS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Kontak Ortu/Wali (WhatsApp)" htmlFor="student-parent-contact" error={formErrors.parentContact} required>
            <input
              id="student-parent-contact"
              type="tel"
              value={formData.parentContact}
              onChange={(event) => manager.onFieldChange('parentContact', event.target.value)}
              placeholder="081234567890"
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.parentContact))}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Digunakan untuk pengingat jadwal, jatuh tempo, dan pembayaran.
            </p>
          </FormField>

          <FormField label="Status" htmlFor="student-status" error={formErrors.status} required>
            <select
              id="student-status"
              value={formData.status}
              onChange={(event) => manager.onFieldChange('status', event.target.value)}
              disabled={isSaving}
              className={inputClassName(Boolean(formErrors.status))}
            >
              {STUDENT_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Riwayat Kesehatan" htmlFor="student-health-history" error={formErrors.healthHistory}>
              <textarea
                id="student-health-history"
                value={formData.healthHistory}
                onChange={(event) => manager.onFieldChange('healthHistory', event.target.value)}
                placeholder="Contoh: asma ringan, alergi kaporit, atau kosongkan bila tidak ada riwayat khusus..."
                rows={4}
                maxLength={500}
                disabled={isSaving}
                className={`${inputClassName(Boolean(formErrors.healthHistory))} h-auto resize-none py-3 leading-relaxed`}
              />
            </FormField>

            <div className="mt-3 flex gap-2.5 rounded-2xl bg-blue-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
              <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-[#0066CC]" aria-hidden="true" />
              <p>
                Informasi kesehatan bersifat sensitif. Catat seperlunya untuk
                keselamatan latihan dan atas persetujuan orang tua/wali.
              </p>
            </div>
          </div>

          {editingStudent?.account ? (
            <div className="flex gap-2.5 rounded-2xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600 sm:col-span-2">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <p>
                Siswa ini memiliki akun login{' '}
                <strong className="text-slate-900">
                  @{editingStudent.account.username}
                </strong>{' '}
                ({editingStudent.account.email}). Perubahan nama siswa akan
                ikut menyelaraskan nama pada akun login tersebut.
              </p>
            </div>
          ) : null}

          {editingStudent ? (
            <p className="flex items-center gap-1.5 text-xs text-slate-400 sm:col-span-2">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Terdaftar sejak {formatDate(editingStudent.createdAt?.slice(0, 10))}
            </p>
          ) : null}
        </form>
      </DataMasterModal>

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Siswa"
        itemName={deleteTarget?.name ?? ''}
        description="Siswa yang sudah memiliki langganan, transaksi, booking, atau raport tidak dapat dihapus dan harus diubah menjadi Nonaktif. Akun login siswa yang terhubung, bila ada, akan ikut terhapus."
        isDeleting={isDeleting}
        onCancel={manager.onDeleteCancel}
        onConfirm={manager.onDeleteConfirm}
      />
    </div>
  );
}
