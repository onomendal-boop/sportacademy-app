'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  MapPin,
  RefreshCw,
  Sprout,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  Users,
  Waves,
  X,
} from 'lucide-react';
import useScheduleCalendar from '@/hooks/useScheduleCalendar';
import {
  ASSIGNMENT_ROLE_LABELS,
  ASSIGNMENT_ROLE_OPTIONS,
  DAY_LABELS,
  DAY_OF_WEEK_VALUES,
  PROGRAM_CONFIG,
} from '@/lib/operational/constants';
import {
  formatFullDateKey,
  formatShortDateKey,
} from '@/lib/operational/dateUtils';
import { cn } from '@/lib/utils';
import {
  Avatar,
  DataMasterModal,
  FormField,
  StatCard,
  StatusBadge,
  inputClassName,
} from '@/components/data-master/DataMasterUI';
import {
  AssignmentRoleBadge,
  OperationalReadOnlyNotice,
  getSlotStatus,
} from './OperationalUI';
import OperationalSkeleton from './OperationalSkeleton';

const PROGRAM_ICONS = {
  AAA: Sprout,
  A3: TrendingUp,
  SWDC: Trophy,
  PRIVATE: User,
};

const EXPECTED_SPECIALIZATION = {
  AAA: 'AAA Sport Academy',
  A3: 'A3',
  SWDC: 'SWDC Swimmer',
  PRIVATE: 'Private',
};

function SlotSummary({ occurrence }) {
  return (
    <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-slate-600">
      <p className="font-extrabold text-slate-900">{occurrence.title}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-[#0066CC]" aria-hidden="true" />
          {formatFullDateKey(occurrence.dateKey)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#0066CC]" aria-hidden="true" />
          {occurrence.startTime} - {occurrence.endTime} WIB
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[#0066CC]" aria-hidden="true" />
          {occurrence.venueName}
        </span>
      </div>
    </div>
  );
}

function ScheduleSlotCard({
  occurrence,
  canManage,
  canBook,
  currentStudentId,
  programScope,
  onAssignCoach,
  onBookPrivate,
  onCancelBooking,
}) {
  const status = getSlotStatus(occurrence);
  const isPrivate = occurrence.program === 'PRIVATE';
  const capacityPercent =
    occurrence.capacity > 0
      ? Math.min(100, Math.round((occurrence.bookedCount / occurrence.capacity) * 100))
      : 0;
  const isOwnBooking =
    Boolean(currentStudentId) && occurrence.bookedStudent?.id === currentStudentId;
  const isScopedProgramBooking =
    Boolean(programScope) && occurrence.bookedStudent?.level === programScope;
  const canCancelBooking =
    canManage || isOwnBooking || isScopedProgramBooking;
  const canShowActions =
    canManage ||
    (canBook && isPrivate && status.remaining > 0) ||
    canCancelBooking;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/[0.02] transition hover:border-blue-200 hover:shadow-md hover:shadow-blue-600/5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
            <Clock className="h-4 w-4 shrink-0 text-[#0066CC]" aria-hidden="true" />
            {occurrence.startTime} - {occurrence.endTime}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-800" title={occurrence.title}>
            {occurrence.title}
          </h3>
        </div>
        <StatusBadge label={status.label} tone={status.tone} />
      </div>

      <div className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-500">
        <p className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0066CC]" aria-hidden="true" />
          <span>{occurrence.venueName}</span>
        </p>
        <p className="flex items-start gap-1.5">
          <Waves className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0066CC]" aria-hidden="true" />
          <span>{occurrence.lane || 'Area latihan utama'}</span>
        </p>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {occurrence.coach ? (
          <div className="flex items-center gap-2.5">
            <Avatar
              name={occurrence.coach.name}
              imageUrl={occurrence.coach.profileImage}
              className="h-9 w-9 text-[11px]"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">
                {occurrence.coach.name}
              </p>
              <p className="truncate text-[11px] font-medium text-[#0066CC]">
                {ASSIGNMENT_ROLE_LABELS[occurrence.coachRole] ?? 'Pelatih Utama'}
                {occurrence.assignment?.source === 'SLOT' ? ' • Override tanggal ini' : ''}
                {occurrence.isAssignedToViewer ? ' • Kelas Anda' : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Belum ada pelatih
          </div>
        )}
      </div>

      {isPrivate && occurrence.bookedStudent ? (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-blue-50 px-3 py-2">
          <Avatar name={occurrence.bookedStudent.name} className="h-8 w-8 bg-white text-[10px]" />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-900">
              {occurrence.bookedStudent.name}
            </p>
            <p className="text-[11px] text-slate-500">
              {isOwnBooking ? 'Booking Anda' : 'Siswa terbooking'} •{' '}
              {PROGRAM_CONFIG[occurrence.bookedStudent.level]?.title ??
                occurrence.bookedStudent.level}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {occurrence.bookedCount}/{occurrence.capacity} terisi
          </span>
          <span className={status.remaining === 0 ? 'text-red-600' : 'text-[#0066CC]'}>
            {status.remaining} tersisa
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-blue-50"
          role="progressbar"
          aria-label={`Kapasitas terisi ${capacityPercent} persen`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={capacityPercent}
        >
          <div
            className={cn('h-full rounded-full transition-all duration-300', status.progressClassName)}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
      </div>

      {canShowActions ? (
        <div className="mt-3 space-y-2">
          {canBook && isPrivate && status.remaining > 0 ? (
            <button
              type="button"
              onClick={() => onBookPrivate(occurrence)}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#0066CC] px-3 text-[13px] font-bold text-white transition hover:bg-[#0052A3]"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              Booking Slot
            </button>
          ) : null}

          {canManage ? (
            <button
              type="button"
              onClick={() => onAssignCoach(occurrence)}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 text-[13px] font-bold text-[#0066CC] transition hover:bg-blue-100"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              {occurrence.coach ? 'Ubah Pelatih' : 'Assign Pelatih'}
            </button>
          ) : null}

          {canCancelBooking && isPrivate && occurrence.bookedStudent ? (
            <button
              type="button"
              onClick={() => onCancelBooking(occurrence)}
              className="flex h-8 w-full items-center justify-center rounded-lg text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700"
            >
              Batalkan Booking
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function ScheduleCalendar({
  programConfig,
  coaches = [],
  students = [],
  canManage = false,
  canBook = false,
  currentStudentId = null,
  programScope = null,
}) {
  const calendar = useScheduleCalendar({
    program: programConfig.code,
    canManage,
    canBook,
    currentStudentId,
    programScope,
  });

  const {
    todayKey,
    weekDateKeys,
    weekRangeLabel,
    occurrencesByDate,
    stats,
    isLoading,
    loadError,
    assignmentTarget,
    assignmentForm,
    assignmentErrors,
    isAssigning,
    bookingTarget,
    bookingForm,
    bookingErrors,
    isBooking,
    cancelBookingTarget,
    isCancellingBooking,
  } = calendar;

  const LevelIcon = PROGRAM_ICONS[programConfig.code] ?? CalendarDays;
  const isPrivate = programConfig.code === 'PRIVATE';
  const selectedAssignmentCoach = coaches.find(
    (coach) => coach.id === assignmentForm.coachId
  );
  const expectedSpecialization = EXPECTED_SPECIALIZATION[programConfig.code];
  const assignmentCoachOptions = coaches.filter(
    (coach) => coach.isActive || coach.id === assignmentForm.coachId
  );
  const bookingCoachOptions = coaches.filter(
    (coach) => coach.isActive || coach.id === bookingForm.coachId
  );
  const visibleProgramConfigs = programScope
    ? Object.values(PROGRAM_CONFIG).filter(
        (config) =>
          config.code === programScope || config.code === 'PRIVATE'
      )
    : Object.values(PROGRAM_CONFIG);

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#0066CC] ring-1 ring-inset ring-blue-600/15">
              <LevelIcon className="h-4 w-4" aria-hidden="true" />
              {programConfig.typicalCapacity}
            </span>
            <span className="text-xs font-medium text-slate-400">
              Kalender mingguan • {weekRangeLabel}
            </span>
          </div>

          <h2 className="mt-3 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Jadwal {programConfig.title}
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
            {programConfig.description}
          </p>
        </div>

        <nav
          aria-label="Pilih level jadwal"
          className={cn(
            'grid shrink-0 grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm shadow-slate-900/[0.02]',
            programScope
              ? 'xl:min-w-[300px]'
              : 'sm:grid-cols-4 xl:min-w-[520px]'
          )}
        >
          {visibleProgramConfigs.map((config) => {
            const Icon = PROGRAM_ICONS[config.code] ?? CalendarDays;
            const isActive = config.code === programConfig.code;

            return (
              <Link
                key={config.code}
                href={`/dashboard/schedule/${config.slug}`}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-[#0066CC] text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-500 hover:bg-blue-50 hover:text-[#0066CC]'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {config.code}
              </Link>
            );
          })}
        </nav>
      </section>

      {!canManage && programScope ? (
        <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0066CC]" aria-hidden="true" />
          <p>
            <span className="font-bold text-slate-900">
              Mode admin {PROGRAM_CONFIG[programScope].title}:
            </span>{' '}
            Anda mengelola jadwal {PROGRAM_CONFIG[programScope].title} dan
            booking Private untuk siswa pada level tersebut. Template
            Private serta jadwal program lain tidak ditampilkan untuk
            dikelola dari akun ini.
          </p>
        </div>
      ) : !canManage && canBook ? (
        <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <p>
            <span className="font-bold text-slate-900">Mode siswa:</span> Anda
            dapat membooking slot Private yang kosong dan membatalkan booking
            milik sendiri. Identitas siswa pada booking pengguna lain tidak
            ditampilkan.
          </p>
        </div>
      ) : !canManage ? (
        <OperationalReadOnlyNotice />
      ) : null}

      <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0066CC]" aria-hidden="true" />
        {isPrivate ? (
          <p>
            <span className="font-bold text-slate-900">Booking Private:</span>{' '}
            {canManage
              ? 'pilih slot kosong, tentukan siswa dan pelatih. Booking disimpan sebagai slot tanggal nyata di database.'
              : programScope
                ? `pilih slot kosong, siswa ${PROGRAM_CONFIG[programScope].title}, dan pelatih. Booking siswa dari program lain tidak ditampilkan kepada akun ini.`
                : canBook
                  ? 'pilih slot kosong lalu tentukan pelatih. Booking otomatis dibuat atas nama profil siswa dari akun Anda.'
                  : 'booking dikelola oleh tim operasional akademi.'}
          </p>
        ) : (
          <p>
            <span className="font-bold text-slate-900">Penugasan per tanggal:</span> mengubah
            pelatih dari kartu slot hanya berlaku pada tanggal tersebut dan tidak mengubah
            pelatih rutin pada template mingguan.
          </p>
        )}
      </div>

      {loadError ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 sm:flex-row sm:items-center">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="flex-1 font-medium">{loadError}</p>
          <button
            type="button"
            onClick={calendar.onReload}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-extrabold text-red-700 ring-1 ring-red-200 transition hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Coba Lagi
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <OperationalSkeleton />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan jadwal minggu ini">
            <StatCard icon={CalendarDays} label="Total Slot" value={stats.totalSlots} description={`Slot ${programConfig.code} pada minggu terpilih`} />
            <StatCard icon={Users} label="Kapasitas Terisi" value={`${stats.totalBooked}/${stats.totalCapacity}`} description={`Utilisasi ${stats.utilization}% dari total kapasitas`} tone="violet" />
            <StatCard icon={CalendarPlus} label={isPrivate ? 'Slot Kosong' : 'Slot Tersedia'} value={stats.availableSlots} description={`${stats.totalRemaining} tempat masih tersisa`} tone="green" />
            <StatCard icon={UserCheck} label="Pelatih Bertugas" value={stats.assignedCoaches} description="Pelatih unik yang ter-assign minggu ini" tone="blue" />
          </section>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={calendar.onPreviousWeek}
                  aria-label="Minggu sebelumnya"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0066CC]"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={calendar.onCurrentWeek}
                  className="h-10 rounded-xl bg-blue-50 px-4 text-sm font-bold text-[#0066CC] transition hover:bg-blue-100"
                >
                  Minggu Ini
                </button>
                <button
                  type="button"
                  onClick={calendar.onNextWeek}
                  aria-label="Minggu berikutnya"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0066CC]"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <p className="text-center text-sm font-extrabold text-slate-900 lg:flex-1">
                {weekRangeLabel}
              </p>

              <div className="hidden items-center gap-4 text-xs font-medium text-slate-500 xl:flex">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Tersedia</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Hampir penuh</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Penuh</span>
              </div>
            </div>

            <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-400 lg:hidden">
              Geser kalender ke kanan untuk melihat hari berikutnya.
            </p>

            <div className="overflow-x-auto">
              <div className="grid min-w-[1240px] grid-cols-7">
                {weekDateKeys.map((dateKey, dayIndex) => {
                  const dayOccurrences = occurrencesByDate[dateKey] ?? [];
                  const isToday = dateKey === todayKey;
                  const dayName = DAY_LABELS[DAY_OF_WEEK_VALUES[dayIndex]];

                  return (
                    <section
                      key={dateKey}
                      aria-label={`Jadwal ${dayName} ${formatShortDateKey(dateKey)}`}
                      className="border-r border-slate-100 last:border-r-0"
                    >
                      <header className={cn('border-b border-slate-100 px-3 py-3 text-center', isToday ? 'bg-blue-50' : 'bg-white')}>
                        <p className={cn('text-xs font-extrabold uppercase tracking-wider', isToday ? 'text-[#0066CC]' : 'text-slate-400')}>
                          {dayName}
                        </p>
                        <p className="mt-1 text-base font-extrabold text-slate-900">
                          {formatShortDateKey(dateKey)}
                        </p>
                        {isToday ? (
                          <span className="mt-1 inline-flex rounded-full bg-[#0066CC] px-2 py-0.5 text-[10px] font-bold text-white">
                            Hari Ini
                          </span>
                        ) : null}
                      </header>

                      <div className="min-h-[430px] space-y-3 bg-slate-50/60 p-2.5">
                        {dayOccurrences.length ? (
                          dayOccurrences.map((occurrence) => (
                            <ScheduleSlotCard
                              key={occurrence.occurrenceId}
                              occurrence={occurrence}
                              canManage={canManage}
                              canBook={canBook}
                              currentStudentId={currentStudentId}
                              programScope={programScope}
                              onAssignCoach={calendar.onOpenAssignment}
                              onBookPrivate={calendar.onOpenBooking}
                              onCancelBooking={calendar.onCancelBookingRequest}
                            />
                          ))
                        ) : (
                          <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 px-3 py-6 text-center text-xs font-medium leading-relaxed text-slate-400">
                            Tidak ada jadwal
                            <br />
                            pada hari ini
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <DataMasterModal
        open={Boolean(assignmentTarget)}
        title="Assign Pelatih"
        description="Penugasan ini hanya mengubah occurrence pada tanggal terpilih."
        onClose={calendar.onCloseAssignment}
        disableClose={isAssigning}
        maxWidthClassName="max-w-lg"
        footer={
          <>
            {assignmentTarget?.assignment?.source === 'SLOT' ? (
              <button
                type="button"
                onClick={calendar.onRemoveAssignment}
                disabled={isAssigning}
                className="inline-flex h-11 items-center justify-center rounded-xl px-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:mr-auto"
              >
                Hapus Override
              </button>
            ) : null}
            <button type="button" onClick={calendar.onCloseAssignment} disabled={isAssigning} className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-50 px-4 text-sm font-bold text-[#0066CC] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60">
              Batal
            </button>
            <button type="submit" form="coach-assignment-form" disabled={isAssigning} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] disabled:cursor-not-allowed disabled:opacity-60">
              {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserCheck className="h-4 w-4" aria-hidden="true" />}
              {isAssigning ? 'Menyimpan...' : 'Simpan Penugasan'}
            </button>
          </>
        }
      >
        {assignmentTarget ? (
          <form id="coach-assignment-form" onSubmit={calendar.onSubmitAssignment} className="space-y-5" noValidate>
            <SlotSummary occurrence={assignmentTarget} />

            <FormField label="Pelatih" htmlFor="assignment-coach" error={assignmentErrors.coachId} required>
              <select
                id="assignment-coach"
                value={assignmentForm.coachId}
                onChange={(event) => calendar.onAssignmentFieldChange('coachId', event.target.value)}
                disabled={isAssigning}
                className={inputClassName(Boolean(assignmentErrors.coachId))}
              >
                <option value="">Pilih pelatih</option>
                {assignmentCoachOptions.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name} • {coach.specialization || 'Tanpa spesialisasi'}
                  </option>
                ))}
              </select>
              {selectedAssignmentCoach &&
              selectedAssignmentCoach.specialization !== expectedSpecialization ? (
                <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700 ring-1 ring-inset ring-amber-600/15">
                  Spesialisasi pelatih adalah {selectedAssignmentCoach.specialization || '-'},
                  sedangkan program ini umumnya membutuhkan {expectedSpecialization}. Penugasan
                  tetap diizinkan, tetapi sebaiknya dikonfirmasi terlebih dahulu.
                </p>
              ) : null}
            </FormField>

            <FormField label="Peran Penugasan" htmlFor="assignment-role" error={assignmentErrors.role} required>
              <select
                id="assignment-role"
                value={assignmentForm.role}
                onChange={(event) => calendar.onAssignmentFieldChange('role', event.target.value)}
                disabled={isAssigning}
                className={inputClassName(Boolean(assignmentErrors.role))}
              >
                {ASSIGNMENT_ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </FormField>

            {assignmentTarget.assignment ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                Penugasan saat ini:
                <AssignmentRoleBadge role={assignmentTarget.assignment.role} />
                <span>
                  {assignmentTarget.assignment.source === 'SLOT'
                    ? 'Override tanggal ini'
                    : 'Pelatih rutin dari template'}
                </span>
              </div>
            ) : null}
          </form>
        ) : null}
      </DataMasterModal>

      <DataMasterModal
        open={Boolean(bookingTarget)}
        title="Booking Slot Private"
        description="Satu slot hanya dapat digunakan oleh satu siswa."
        onClose={calendar.onCloseBooking}
        disableClose={isBooking}
        maxWidthClassName="max-w-lg"
        footer={
          <>
            <button type="button" onClick={calendar.onCloseBooking} disabled={isBooking} className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-50 px-4 text-sm font-bold text-[#0066CC] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60">
              Batal
            </button>
            <button type="submit" form="private-booking-form" disabled={isBooking} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] disabled:cursor-not-allowed disabled:opacity-60">
              {isBooking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CalendarPlus className="h-4 w-4" aria-hidden="true" />}
              {isBooking ? 'Memproses...' : 'Konfirmasi Booking'}
            </button>
          </>
        }
      >
        {bookingTarget ? (
          <form id="private-booking-form" onSubmit={calendar.onSubmitBooking} className="space-y-5" noValidate>
            <SlotSummary occurrence={bookingTarget} />

            <FormField label="Siswa" htmlFor="booking-student" error={bookingErrors.studentId} required>
              <select
                id="booking-student"
                value={bookingForm.studentId}
                onChange={(event) => calendar.onBookingFieldChange('studentId', event.target.value)}
                disabled={isBooking || Boolean(currentStudentId)}
                className={inputClassName(Boolean(bookingErrors.studentId))}
              >
                <option value="">Pilih siswa aktif</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} • {PROGRAM_CONFIG[student.level]?.title ?? student.level}
                  </option>
                ))}
              </select>
              {currentStudentId ? (
                <p className="mt-1.5 text-xs font-medium text-slate-500">
                  Booking dibuat atas nama profil siswa dari akun Anda.
                </p>
              ) : students.length === 0 ? (
                <p className="mt-1.5 text-xs font-medium text-amber-600">
                  Belum ada siswa aktif di database.
                </p>
              ) : null}
            </FormField>

            <FormField label="Pelatih" htmlFor="booking-coach" error={bookingErrors.coachId} required>
              <select
                id="booking-coach"
                value={bookingForm.coachId}
                onChange={(event) => calendar.onBookingFieldChange('coachId', event.target.value)}
                disabled={isBooking}
                className={inputClassName(Boolean(bookingErrors.coachId))}
              >
                <option value="">Pilih pelatih</option>
                {bookingCoachOptions.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name} • {coach.specialization || 'Tanpa spesialisasi'}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Fokus / Catatan Sesi" htmlFor="booking-notes" error={bookingErrors.notes}>
              <textarea
                id="booking-notes"
                value={bookingForm.notes}
                onChange={(event) => calendar.onBookingFieldChange('notes', event.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Contoh: fokus teknik pernapasan gaya bebas..."
                disabled={isBooking}
                className={inputClassName(Boolean(bookingErrors.notes), 'h-auto resize-none py-3 leading-relaxed')}
              />
            </FormField>
          </form>
        ) : null}
      </DataMasterModal>

      <DataMasterModal
        open={Boolean(cancelBookingTarget)}
        title="Batalkan Booking Private"
        description="Slot akan kembali tersedia untuk siswa lain."
        onClose={calendar.onCancelBookingCancel}
        disableClose={isCancellingBooking}
        maxWidthClassName="max-w-md"
        footer={
          <>
            <button type="button" onClick={calendar.onCancelBookingCancel} disabled={isCancellingBooking} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              Kembali
            </button>
            <button type="button" onClick={calendar.onCancelBookingConfirm} disabled={isCancellingBooking} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isCancellingBooking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
              {isCancellingBooking ? 'Membatalkan...' : 'Ya, Batalkan Booking'}
            </button>
          </>
        }
      >
        {cancelBookingTarget ? (
          <div className="space-y-4">
            <SlotSummary occurrence={cancelBookingTarget} />
            <p className="text-sm leading-relaxed text-slate-600">
              Batalkan booking untuk{' '}
              <strong className="text-slate-900">
                {cancelBookingTarget.bookedStudent?.name}
              </strong>
              ? Riwayat booking tetap disimpan dengan status dibatalkan.
            </p>
          </div>
        ) : null}
      </DataMasterModal>
    </div>
  );
}
