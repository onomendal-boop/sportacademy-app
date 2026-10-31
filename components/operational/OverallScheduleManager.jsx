'use client';

import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  LayoutGrid,
  List,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import useOverallScheduleManager from '@/hooks/useOverallScheduleManager';
import {
  DAY_LABELS,
  DAY_OF_WEEK_VALUES,
  PROGRAM_OPTIONS,
  SCHEDULE_STATUS_OPTIONS,
} from '@/lib/operational/constants';
import {
  Avatar,
  DataMasterModal,
  DataMasterToolbar,
  DeleteConfirmModal,
  EmptyState,
  FormField,
  StatCard,
  formatDate,
  inputClassName,
} from '@/components/data-master/DataMasterUI';
import {
  OperationalHeader,
  OperationalReadOnlyNotice,
  ProgramBadge,
  ScheduleStatusBadge,
} from './OperationalUI';

function ScheduleActions({ schedule, canManage, canDelete = false, onEdit, onDelete }) {
  if (!canManage && !canDelete) {
    return (
      <span className="flex justify-end text-slate-300">
        <Lock className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      {canManage ? (
        <button
          type="button"
          onClick={() => onEdit(schedule)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0066CC]"
          aria-label={`Edit ${schedule.title}`}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={() => onDelete(schedule)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-700"
          aria-label={`Hapus ${schedule.title}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function ScheduleCard({ schedule, canManage, canDelete = false, onEdit, onDelete }) {
  const coach = schedule.leadAssignment?.coach;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/[0.02] transition hover:border-blue-200 hover:shadow-md hover:shadow-blue-600/5">
      <div className="flex items-start justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
          <Clock className="h-4 w-4 shrink-0 text-[#0066CC]" aria-hidden="true" />
          {schedule.startTime} - {schedule.endTime}
        </p>
        <ScheduleStatusBadge status={schedule.status} />
      </div>

      <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-extrabold leading-snug text-slate-900">
        {schedule.title}
      </h3>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <ProgramBadge program={schedule.program} />
      </div>

      <div className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-500">
        <p className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0066CC]" aria-hidden="true" />
          <span>
            {schedule.venueName}
            {schedule.lane ? ` • ${schedule.lane}` : ''}
          </span>
        </p>
        <p className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 shrink-0 text-[#0066CC]" aria-hidden="true" />
          Kapasitas {schedule.capacity} peserta
        </p>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {coach ? (
          <div className="flex items-center gap-2.5">
            <Avatar
              name={coach.name}
              imageUrl={coach.profileImage}
              className="h-9 w-9 text-[11px]"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">{coach.name}</p>
              <p className="text-[11px] font-medium text-[#0066CC]">Pelatih Utama</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Belum ada pelatih
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <Link
          href={`/dashboard/schedule/${schedule.program.toLowerCase()}`}
          className="text-xs font-extrabold text-[#0066CC] transition hover:text-[#0052A3]"
        >
          Buka Kalender
        </Link>
        <ScheduleActions
          schedule={schedule}
          canManage={canManage}
          canDelete={canDelete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}

export default function OverallScheduleManager({
  initialSchedules = [],
  venues = [],
  coaches = [],
  canManage = false,
  canDelete = false,
}) {
  const manager = useOverallScheduleManager(initialSchedules, canManage, canDelete);
  const {
    filteredSchedules,
    schedulesByDay,
    stats,
    search,
    programFilter,
    dayFilter,
    venueFilter,
    statusFilter,
    coachFilter,
    viewMode,
    isFormOpen,
    editingSchedule,
    formData,
    formErrors,
    isSaving,
    deleteTarget,
    isDeleting,
  } = manager;

  const coachOptions = coaches.filter(
    (coach) => coach.isActive || coach.id === formData.leadCoachId
  );

  return (
    <div className="space-y-6">
      <OperationalHeader
        title="Jadwal Keseluruhan"
        description="Kelola template jadwal mingguan seluruh program, tempat latihan, kapasitas, dan pelatih utama dari satu tempat."
        addLabel="Tambah Jadwal"
        canManage={canManage}
        onAdd={manager.onCreate}
      >
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => manager.onViewModeChange('board')}
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-xs font-extrabold transition ${
              viewMode === 'board'
                ? 'bg-[#0066CC] text-white shadow-sm shadow-blue-600/25'
                : 'text-slate-500 hover:bg-blue-50 hover:text-[#0066CC]'
            }`}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" /> Board
          </button>
          <button
            type="button"
            onClick={() => manager.onViewModeChange('list')}
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-xs font-extrabold transition ${
              viewMode === 'list'
                ? 'bg-[#0066CC] text-white shadow-sm shadow-blue-600/25'
                : 'text-slate-500 hover:bg-blue-50 hover:text-[#0066CC]'
            }`}
          >
            <List className="h-4 w-4" aria-hidden="true" /> List
          </button>
        </div>
      </OperationalHeader>

      {!canManage ? <OperationalReadOnlyNotice /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Total Jadwal" value={stats.total} description="Template jadwal mingguan" />
        <StatCard icon={CalendarDays} label="Jadwal Aktif" value={stats.active} description={`${stats.programs} program berjalan`} tone="green" />
        <StatCard icon={UserCheck} label="Pelatih Bertugas" value={stats.assignedCoaches} description="Pelatih utama unik" tone="violet" />
        <StatCard icon={UserX} label="Belum Ada Pelatih" value={stats.unassigned} description="Jadwal aktif tanpa pelatih utama" tone="amber" />
      </div>

      <DataMasterToolbar
        searchValue={search}
        onSearchChange={manager.onSearchChange}
        searchPlaceholder="Cari kelas, program, tempat latihan, jalur, atau pelatih..."
      >
        <select value={programFilter} onChange={(event) => manager.onProgramFilterChange(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-44" aria-label="Filter program">
          <option value="ALL">Semua Program</option>
          {PROGRAM_OPTIONS.map((program) => (
            <option key={program.value} value={program.value}>{program.label}</option>
          ))}
        </select>

        <select value={dayFilter} onChange={(event) => manager.onDayFilterChange(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-40" aria-label="Filter hari">
          <option value="ALL">Semua Hari</option>
          {DAY_OF_WEEK_VALUES.map((day) => (
            <option key={day} value={day}>{DAY_LABELS[day]}</option>
          ))}
        </select>

        <select value={venueFilter} onChange={(event) => manager.onVenueFilterChange(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-52" aria-label="Filter tempat latihan">
          <option value="ALL">Semua Tempat</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name} - {venue.location}
            </option>
          ))}
        </select>

        <select value={coachFilter} onChange={(event) => manager.onCoachFilterChange(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-48" aria-label="Filter pelatih">
          <option value="ALL">Semua Pelatih</option>
          <option value="UNASSIGNED">Belum Ada Pelatih</option>
          {coaches.map((coach) => (
            <option key={coach.id} value={coach.id}>{coach.name}</option>
          ))}
        </select>

        <select value={statusFilter} onChange={(event) => manager.onStatusFilterChange(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-40" aria-label="Filter status jadwal">
          <option value="ALL">Semua Status</option>
          {SCHEDULE_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </DataMasterToolbar>

      {filteredSchedules.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Jadwal tidak ditemukan"
          description="Belum ada jadwal yang sesuai dengan pencarian atau filter. Tambahkan jadwal baru atau ubah filter yang digunakan."
        />
      ) : viewMode === 'board' ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
          <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-400 lg:hidden">
            Geser board ke kanan untuk melihat hari berikutnya.
          </p>
          <div className="overflow-x-auto">
            <div className="grid min-w-[1240px] grid-cols-7">
              {DAY_OF_WEEK_VALUES.map((day) => {
                const daySchedules = schedulesByDay[day] ?? [];

                return (
                  <section key={day} className="border-r border-slate-100 last:border-r-0" aria-label={`Jadwal ${DAY_LABELS[day]}`}>
                    <header className="border-b border-slate-100 bg-white px-3 py-3 text-center">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        {DAY_LABELS[day]}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#0066CC]">
                        {daySchedules.length} jadwal
                      </p>
                    </header>

                    <div className="min-h-[420px] space-y-3 bg-slate-50/60 p-2.5">
                      {daySchedules.length ? (
                        daySchedules.map((schedule) => (
                          <ScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            canManage={canManage}
                            canDelete={canDelete}
                            onEdit={manager.onEdit}
                            onDelete={manager.onDeleteRequest}
                          />
                        ))
                      ) : (
                        <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 px-3 py-6 text-center text-xs font-medium leading-relaxed text-slate-400">
                          Tidak ada jadwal
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-extrabold">Jadwal</th>
                  <th className="px-5 py-4 font-extrabold">Program</th>
                  <th className="px-5 py-4 font-extrabold">Tempat Latihan</th>
                  <th className="px-5 py-4 font-extrabold">Pelatih Utama</th>
                  <th className="px-5 py-4 font-extrabold">Periode</th>
                  <th className="px-5 py-4 font-extrabold">Status</th>
                  <th className="px-5 py-4 text-right font-extrabold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.map((schedule) => {
                  const coach = schedule.leadAssignment?.coach;

                  return (
                    <tr key={schedule.id} className="transition hover:bg-blue-50/40">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{schedule.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {DAY_LABELS[schedule.dayOfWeek]} • {schedule.startTime} - {schedule.endTime} • {schedule.capacity} peserta
                        </p>
                      </td>
                      <td className="px-5 py-4"><ProgramBadge program={schedule.program} /></td>
                      <td className="px-5 py-4 text-slate-600">
                        <p className="font-semibold text-slate-800">{schedule.venueName}</p>
                        <p className="mt-0.5 text-xs">{schedule.lane || schedule.trainingVenue?.location || '-'}</p>
                      </td>
                      <td className="px-5 py-4">
                        {coach ? (
                          <div className="flex items-center gap-2.5">
                            <Avatar name={coach.name} imageUrl={coach.profileImage} className="h-9 w-9 text-[11px]" />
                            <div>
                              <p className="text-xs font-bold text-slate-900">{coach.name}</p>
                              <p className="text-[11px] text-slate-500">@{coach.username}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="font-semibold text-amber-600">Belum ditugaskan</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs leading-relaxed text-slate-500">
                        {schedule.effectiveStartDate ? formatDate(schedule.effectiveStartDate) : 'Mulai segera'}
                        {' - '}
                        {schedule.effectiveEndDate ? formatDate(schedule.effectiveEndDate) : 'Terbuka'}
                      </td>
                      <td className="px-5 py-4"><ScheduleStatusBadge status={schedule.status} /></td>
                      <td className="px-5 py-4">
                        <ScheduleActions schedule={schedule} canManage={canManage} canDelete={canDelete} onEdit={manager.onEdit} onDelete={manager.onDeleteRequest} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DataMasterModal
        open={isFormOpen}
        title={editingSchedule ? 'Edit Jadwal Mingguan' : 'Tambah Jadwal Mingguan'}
        description="Template ini akan muncul setiap minggu pada kalender program terkait."
        onClose={manager.onCloseForm}
        disableClose={isSaving}
        maxWidthClassName="max-w-3xl"
        footer={
          <>
            <button type="button" onClick={manager.onCloseForm} disabled={isSaving} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              Batal
            </button>
            <button type="submit" form="schedule-form" disabled={isSaving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSaving ? 'Menyimpan...' : editingSchedule ? 'Simpan Perubahan' : 'Tambah Jadwal'}
            </button>
          </>
        }
      >
        <form id="schedule-form" onSubmit={manager.onSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <FormField label="Nama Kelas/Jadwal" htmlFor="schedule-title" error={formErrors.title} required>
              <input id="schedule-title" value={formData.title} onChange={(event) => manager.onFieldChange('title', event.target.value)} placeholder="Contoh: Bintang Laut A" disabled={isSaving} className={inputClassName(Boolean(formErrors.title))} />
            </FormField>
          </div>

          <FormField label="Program" htmlFor="schedule-program" error={formErrors.program} required>
            <select id="schedule-program" value={formData.program} onChange={(event) => manager.onFieldChange('program', event.target.value)} disabled={isSaving} className={inputClassName(Boolean(formErrors.program))}>
              {PROGRAM_OPTIONS.map((program) => (
                <option key={program.value} value={program.value}>{program.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Hari" htmlFor="schedule-day" error={formErrors.dayOfWeek} required>
            <select id="schedule-day" value={formData.dayOfWeek} onChange={(event) => manager.onFieldChange('dayOfWeek', event.target.value)} disabled={isSaving} className={inputClassName(Boolean(formErrors.dayOfWeek))}>
              {DAY_OF_WEEK_VALUES.map((day) => (
                <option key={day} value={day}>{DAY_LABELS[day]}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Jam Mulai" htmlFor="schedule-start" error={formErrors.startTime} required>
            <input id="schedule-start" type="time" value={formData.startTime} onChange={(event) => manager.onFieldChange('startTime', event.target.value)} disabled={isSaving} className={inputClassName(Boolean(formErrors.startTime))} />
          </FormField>

          <FormField label="Jam Selesai" htmlFor="schedule-end" error={formErrors.endTime} required>
            <input id="schedule-end" type="time" value={formData.endTime} onChange={(event) => manager.onFieldChange('endTime', event.target.value)} disabled={isSaving} className={inputClassName(Boolean(formErrors.endTime))} />
          </FormField>

          <FormField label="Tempat Latihan" htmlFor="schedule-venue" error={formErrors.trainingVenueId} required>
            <select id="schedule-venue" value={formData.trainingVenueId} onChange={(event) => manager.onFieldChange('trainingVenueId', event.target.value)} disabled={isSaving} className={inputClassName(Boolean(formErrors.trainingVenueId))}>
              <option value="">Pilih tempat latihan</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} - {venue.location}{venue.status === 'MAINTENANCE' ? ' (Maintenance)' : ''}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Jalur/Area" htmlFor="schedule-lane" error={formErrors.lane}>
            <input id="schedule-lane" value={formData.lane} onChange={(event) => manager.onFieldChange('lane', event.target.value)} placeholder="Contoh: Jalur 1-2" disabled={isSaving} className={inputClassName(Boolean(formErrors.lane))} />
          </FormField>

          <FormField label="Kapasitas" htmlFor="schedule-capacity" error={formErrors.capacity} required>
            <input id="schedule-capacity" type="number" min="1" max="100" value={formData.capacity} onChange={(event) => manager.onFieldChange('capacity', event.target.value)} disabled={isSaving || formData.program === 'PRIVATE'} className={inputClassName(Boolean(formErrors.capacity))} />
            {formData.program === 'PRIVATE' ? (
              <p className="mt-1.5 text-xs text-slate-400">Kapasitas Private selalu 1 siswa.</p>
            ) : null}
          </FormField>

          <FormField label="Status Jadwal" htmlFor="schedule-status" error={formErrors.status} required>
            <select id="schedule-status" value={formData.status} onChange={(event) => manager.onFieldChange('status', event.target.value)} disabled={isSaving} className={inputClassName(Boolean(formErrors.status))}>
              {SCHEDULE_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Pelatih Utama Rutin" htmlFor="schedule-coach" error={formErrors.leadCoachId}>
            <select id="schedule-coach" value={formData.leadCoachId} onChange={(event) => manager.onFieldChange('leadCoachId', event.target.value)} disabled={isSaving} className={inputClassName(Boolean(formErrors.leadCoachId))}>
              <option value="">Belum ditugaskan</option>
              {coachOptions.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.name} • {coach.specialization || 'Tanpa spesialisasi'}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Mulai Berlaku" htmlFor="schedule-effective-start" error={formErrors.effectiveStartDate}>
            <input id="schedule-effective-start" type="date" value={formData.effectiveStartDate} onChange={(event) => manager.onFieldChange('effectiveStartDate', event.target.value)} disabled={isSaving} className={inputClassName(Boolean(formErrors.effectiveStartDate))} />
          </FormField>

          <FormField label="Berakhir Pada" htmlFor="schedule-effective-end" error={formErrors.effectiveEndDate}>
            <input id="schedule-effective-end" type="date" value={formData.effectiveEndDate} onChange={(event) => manager.onFieldChange('effectiveEndDate', event.target.value)} disabled={isSaving} className={inputClassName(Boolean(formErrors.effectiveEndDate))} />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Catatan" htmlFor="schedule-notes" error={formErrors.notes}>
              <textarea id="schedule-notes" value={formData.notes} onChange={(event) => manager.onFieldChange('notes', event.target.value)} rows={3} maxLength={1000} placeholder="Catatan operasional untuk jadwal ini..." disabled={isSaving} className={inputClassName(Boolean(formErrors.notes), 'h-auto resize-none py-3 leading-relaxed')} />
            </FormField>
          </div>
        </form>
      </DataMasterModal>

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Jadwal Mingguan"
        itemName={deleteTarget?.title ?? ''}
        description={
          deleteTarget?.slotCount > 0
            ? `Jadwal ini sudah memiliki ${deleteTarget.slotCount} slot. Server akan menolak penghapusan; nonaktifkan atau batalkan jadwal sebagai gantinya.`
            : 'Template jadwal dan penugasan rutinnya akan dihapus permanen.'
        }
        isDeleting={isDeleting}
        onCancel={manager.onDeleteCancel}
        onConfirm={manager.onDeleteConfirm}
      />
    </div>
  );
}
