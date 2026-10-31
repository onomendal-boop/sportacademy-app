'use client';

import {
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Star,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  Avatar,
  DataMasterModal,
  FormField,
  StatusBadge,
  inputClassName,
} from '@/components/data-master/DataMasterUI';
import { getAverageScoreLabel } from '@/hooks/useStudentReportManager';
import {
  PROGRAM_CONFIG,
  REPORT_LEVEL_OPTIONS,
  REPORT_RECOMMENDATION_LABELS,
  REPORT_RECOMMENDATION_OPTIONS,
  REPORT_SCORE_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_OPTIONS,
} from '@/lib/operational/constants';
import { formatDateKey } from '@/lib/operational/dateUtils';
import { cn } from '@/lib/utils';
import { ProgramBadge } from './OperationalUI';

export function ReportStatusBadge({ status }) {
  return (
    <StatusBadge
      label={REPORT_STATUS_LABELS[status] ?? status}
      tone={status === 'PUBLISHED' ? 'green' : 'amber'}
    />
  );
}

export function RecommendationBadge({ recommendation }) {
  const tones = {
    LEVEL_UP: 'violet',
    EXTRA_PRACTICE: 'amber',
    STAY: 'blue',
  };

  return (
    <StatusBadge
      label={REPORT_RECOMMENDATION_LABELS[recommendation] ?? recommendation}
      tone={tones[recommendation] ?? 'slate'}
    />
  );
}

export function ScoreBar({ score }) {
  const percent = Math.round((Number(score) / 5) * 100);

  return (
    <div className="flex min-w-[150px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#0066CC]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-xs font-extrabold text-slate-700">
        {score}/5
      </span>
    </div>
  );
}

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

export function ReportFormModal({ manager }) {
  const form = manager.formData;
  const errors = manager.formErrors;
  const isSaving = manager.isSaving;
  const isEditing = Boolean(manager.editingReport);
  const isCoachUser = manager.currentUser?.role === 'COACH';
  const showPromotionNotice =
    form.status === 'PUBLISHED' && form.recommendation === 'LEVEL_UP';
  const editingStudentMissing =
    isEditing &&
    manager.editingReport.student &&
    !manager.studentById[manager.editingReport.student.id];

  return (
    <DataMasterModal
      open={manager.isFormOpen}
      title={isEditing ? 'Ubah Raport Siswa' : 'Buat Raport Siswa'}
      description="Nilai kompetensi siswa pada satu periode. Raport berstatus Draf belum final; terbitkan bila penilaian sudah selesai."
      onClose={manager.onCloseForm}
      disableClose={isSaving}
      maxWidthClassName="max-w-3xl"
      footer={
        <ModalFooter
          formId="student-report-form"
          onClose={manager.onCloseForm}
          isSaving={isSaving}
          submitLabel={isEditing ? 'Simpan Perubahan' : 'Buat Raport'}
        />
      }
    >
      <form
        id="student-report-form"
        onSubmit={manager.onSubmit}
        className="grid gap-5 sm:grid-cols-2"
        noValidate
      >
        <FormField
          label="Siswa"
          htmlFor="report-student"
          error={errors.studentId}
          required
        >
          <select
            id="report-student"
            value={form.studentId}
            onChange={(event) =>
              manager.onFieldChange('studentId', event.target.value)
            }
            disabled={isSaving || isEditing}
            className={inputClassName(Boolean(errors.studentId))}
          >
            <option value="">Pilih siswa</option>
            {manager.students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} • {PROGRAM_CONFIG[student.level]?.title ?? student.level}
                {student.status !== 'ACTIVE' ? ` • ${student.status}` : ''}
              </option>
            ))}
            {editingStudentMissing ? (
              <option value={manager.editingReport.student.id}>
                {manager.editingReport.student.name}
              </option>
            ) : null}
          </select>
          {isEditing ? (
            <p className="mt-1.5 text-xs text-slate-400">
              Siswa tidak dapat diganti pada raport yang sudah dibuat.
            </p>
          ) : null}
        </FormField>

        <FormField
          label="Pelatih Penilai"
          htmlFor="report-coach"
          error={errors.coachId}
        >
          <select
            id="report-coach"
            value={form.coachId}
            onChange={(event) =>
              manager.onFieldChange('coachId', event.target.value)
            }
            disabled={isSaving || isCoachUser}
            className={inputClassName(Boolean(errors.coachId))}
          >
            <option value="">Tanpa pelatih penilai</option>
            {manager.coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.name} • {coach.specialization}
                {coach.isActive ? '' : ' • Nonaktif'}
              </option>
            ))}
            {isCoachUser &&
            manager.currentUser &&
            !manager.coaches.some(
              (coach) => coach.id === manager.currentUser.id
            ) ? (
              <option value={manager.currentUser.id}>
                {manager.currentUser.name} (Anda)
              </option>
            ) : null}
          </select>
          {isCoachUser ? (
            <p className="mt-1.5 text-xs text-slate-400">
              Anda tercatat sebagai pelatih penilai raport ini.
            </p>
          ) : null}
        </FormField>

        <FormField
          label="Level Raport"
          htmlFor="report-level"
          error={errors.level}
          required
        >
          <select
            id="report-level"
            value={form.level}
            onChange={(event) =>
              manager.onFieldChange('level', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.level))}
          >
            {REPORT_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-slate-400">
            Mengganti level memuat ulang template kompetensi level tersebut.
          </p>
        </FormField>

        <FormField
          label="Label Periode"
          htmlFor="report-period"
          error={errors.periodLabel}
          required
        >
          <input
            id="report-period"
            value={form.periodLabel}
            onChange={(event) =>
              manager.onFieldChange('periodLabel', event.target.value)
            }
            placeholder="Oktober 2026"
            list="report-period-options"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.periodLabel))}
          />
          <datalist id="report-period-options">
            {manager.periodOptions.map((period) => (
              <option key={period} value={period} />
            ))}
          </datalist>
        </FormField>

        <FormField
          label="Periode Mulai"
          htmlFor="report-period-start"
          error={errors.periodStart}
        >
          <input
            id="report-period-start"
            type="date"
            value={form.periodStart}
            onChange={(event) =>
              manager.onFieldChange('periodStart', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.periodStart))}
          />
        </FormField>

        <FormField
          label="Periode Selesai"
          htmlFor="report-period-end"
          error={errors.periodEnd}
        >
          <input
            id="report-period-end"
            type="date"
            value={form.periodEnd}
            onChange={(event) =>
              manager.onFieldChange('periodEnd', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.periodEnd))}
          />
        </FormField>

        <FormField
          label="Sesi Hadir"
          htmlFor="report-attended"
          error={errors.sessionsAttended}
        >
          <input
            id="report-attended"
            type="number"
            min="0"
            step="1"
            value={form.sessionsAttended}
            onChange={(event) =>
              manager.onFieldChange('sessionsAttended', event.target.value)
            }
            placeholder="7"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.sessionsAttended))}
          />
        </FormField>

        <FormField
          label="Total Sesi Periode"
          htmlFor="report-total-sessions"
          error={errors.totalSessions}
        >
          <input
            id="report-total-sessions"
            type="number"
            min="0"
            step="1"
            value={form.totalSessions}
            onChange={(event) =>
              manager.onFieldChange('totalSessions', event.target.value)
            }
            placeholder="8"
            disabled={isSaving}
            className={inputClassName(Boolean(errors.totalSessions))}
          />
          {manager.formAttendancePercent !== null ? (
            <p className="mt-1.5 text-xs font-semibold text-slate-500">
              Kehadiran {manager.formAttendancePercent}%
            </p>
          ) : null}
        </FormField>

        <div className="sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-700">
                Penilaian Kompetensi <span className="text-red-500">*</span>
              </h4>
              <p className="mt-0.5 text-xs text-slate-400">
                Skor 1 = Perlu Bimbingan sampai 5 = Sangat Mahir. Rata-rata
                saat ini:{' '}
                <strong className="text-slate-700">
                  {manager.formAverage.toFixed(2)} ({getAverageScoreLabel(manager.formAverage)})
                </strong>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={manager.onLoadCatalogItems}
                disabled={isSaving}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-extrabold text-[#0066CC] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Template Level
              </button>
              <button
                type="button"
                onClick={manager.onAddItem}
                disabled={isSaving || form.items.length >= 20}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Kompetensi
              </button>
            </div>
          </div>

          {errors.items ? (
            <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {errors.items}
            </p>
          ) : null}

          <div className="mt-3 space-y-2">
            {form.items.map((item, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-[1fr_170px_1fr_auto] sm:items-center"
              >
                <input
                  value={item.competency}
                  onChange={(event) =>
                    manager.onItemChange(index, 'competency', event.target.value)
                  }
                  placeholder="Nama kompetensi"
                  disabled={isSaving}
                  aria-label={`Kompetensi ${index + 1}`}
                  className={cn(inputClassName(false), 'mt-0 bg-white')}
                />
                <select
                  value={item.score}
                  onChange={(event) =>
                    manager.onItemChange(index, 'score', event.target.value)
                  }
                  disabled={isSaving}
                  aria-label={`Skor kompetensi ${index + 1}`}
                  className={cn(inputClassName(false), 'mt-0 bg-white')}
                >
                  {[1, 2, 3, 4, 5].map((score) => (
                    <option key={score} value={score}>
                      {score} - {REPORT_SCORE_LABELS[score]}
                    </option>
                  ))}
                </select>
                <input
                  value={item.note}
                  onChange={(event) =>
                    manager.onItemChange(index, 'note', event.target.value)
                  }
                  placeholder="Catatan singkat (opsional)"
                  disabled={isSaving}
                  aria-label={`Catatan kompetensi ${index + 1}`}
                  className={cn(inputClassName(false), 'mt-0 bg-white')}
                />
                <button
                  type="button"
                  onClick={() => manager.onRemoveItem(index)}
                  disabled={isSaving || form.items.length <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Hapus kompetensi ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}

            {form.items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500">
                Pilih siswa untuk memuat template kompetensi, atau tambahkan
                kompetensi manual.
              </p>
            ) : null}
          </div>
        </div>

        <div className="sm:col-span-2">
          <FormField
            label="Catatan Pelatih"
            htmlFor="report-coach-notes"
            error={errors.coachNotes}
          >
            <textarea
              id="report-coach-notes"
              value={form.coachNotes}
              onChange={(event) =>
                manager.onFieldChange('coachNotes', event.target.value)
              }
              placeholder="Tulis perkembangan, kekuatan, dan fokus latihan berikutnya untuk dibaca orang tua/wali..."
              rows={4}
              disabled={isSaving}
              className={cn(
                inputClassName(Boolean(errors.coachNotes)),
                'h-auto resize-y py-3 leading-relaxed'
              )}
            />
          </FormField>
        </div>

        <FormField
          label="Rekomendasi"
          htmlFor="report-recommendation"
          error={errors.recommendation}
          required
        >
          <select
            id="report-recommendation"
            value={form.recommendation}
            onChange={(event) =>
              manager.onFieldChange('recommendation', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.recommendation))}
          >
            {REPORT_RECOMMENDATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Status Raport"
          htmlFor="report-status"
          error={errors.status}
          required
        >
          <select
            id="report-status"
            value={form.status}
            onChange={(event) =>
              manager.onFieldChange('status', event.target.value)
            }
            disabled={isSaving}
            className={inputClassName(Boolean(errors.status))}
          >
            {REPORT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        {showPromotionNotice ? (
          <div className="flex gap-2.5 rounded-2xl bg-violet-50 px-3.5 py-3 text-xs leading-relaxed text-violet-900 sm:col-span-2">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" />
            <p>
              {manager.formNextLevel
                ? `Saat raport ini diterbitkan, level siswa otomatis naik ke ${PROGRAM_CONFIG[manager.formNextLevel]?.title ?? manager.formNextLevel} bila level siswa saat ini masih ${PROGRAM_CONFIG[form.level]?.title ?? form.level}.`
                : 'Level SWDC adalah jenjang tertinggi, sehingga rekomendasi naik level hanya tercatat sebagai catatan tanpa mengubah level siswa.'}
            </p>
          </div>
        ) : null}
      </form>
    </DataMasterModal>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-slate-200 py-3 text-sm last:border-none">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-900">{children}</span>
    </div>
  );
}

export function ReportDetailModal({ manager }) {
  const report = manager.detailReport;

  return (
    <DataMasterModal
      open={Boolean(report)}
      title="Detail Raport Siswa"
      description={
        report
          ? `${report.periodLabel} • ${REPORT_STATUS_LABELS[report.status] ?? report.status}${report.publishedAt ? ` • Terbit ${formatDateKey(report.publishedAt.slice(0, 10))}` : ''}`
          : ''
      }
      onClose={manager.onCloseDetail}
      maxWidthClassName="max-w-3xl"
      footer={
        <>
          <button
            type="button"
            onClick={manager.onCloseDetail}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Tutup
          </button>
          {manager.canManage && report ? (
            <button
              type="button"
              onClick={() => {
                manager.onCloseDetail();
                manager.onEdit(report);
              }}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-[#0066CC] transition hover:bg-blue-100"
            >
              Edit Raport
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => manager.printReport(report)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white transition hover:bg-[#0052A3]"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Cetak / Simpan PDF
          </button>
        </>
      }
    >
      {report ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-[#0066CC] to-cyan-500 p-5 text-white">
            <div className="flex items-center gap-3">
              <Avatar
                name={report.student?.name ?? 'Siswa'}
                className="h-12 w-12 bg-white/20 text-white ring-white/30"
              />
              <div>
                <p className="font-heading text-xl font-extrabold">
                  {report.student?.name ?? 'Siswa Terhapus'}
                </p>
                <p className="mt-0.5 text-sm text-blue-50">
                  {PROGRAM_CONFIG[report.level]?.title ?? report.level}
                  {report.student?.age ? ` • ${report.student.age} tahun` : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-100">
                Rata-rata
              </p>
              <p className="mt-1 flex items-center justify-end gap-1.5 font-heading text-3xl font-extrabold">
                <Star className="h-6 w-6" aria-hidden="true" />
                {report.averageScore.toFixed(2)}
              </p>
              <p className="text-xs font-bold text-blue-50">
                {getAverageScoreLabel(report.averageScore)}
              </p>
            </div>
          </div>

          <div>
            <DetailRow label="Periode">
              {report.periodLabel}
              {report.periodStart || report.periodEnd
                ? ` (${formatDateKey(report.periodStart)} - ${formatDateKey(report.periodEnd)})`
                : ''}
            </DetailRow>
            <DetailRow label="Pelatih Penilai">
              {report.coach?.name ?? '-'}
            </DetailRow>
            <DetailRow label="Kehadiran">
              {report.sessionsAttended !== null && report.totalSessions
                ? `${report.sessionsAttended}/${report.totalSessions} sesi (${report.attendancePercent}%)`
                : '-'}
            </DetailRow>
            <DetailRow label="Level Saat Ini (Data Master)">
              <ProgramBadge program={report.student?.level ?? report.level} />
            </DetailRow>
            <DetailRow label="Status Raport">
              <ReportStatusBadge status={report.status} />
            </DetailRow>
            <DetailRow label="Rekomendasi">
              <RecommendationBadge recommendation={report.recommendation} />
            </DetailRow>
          </div>

          <div>
            <h4 className="font-heading text-base font-extrabold text-slate-900">
              Capaian Kompetensi
            </h4>
            <div className="mt-3 divide-y divide-slate-100 rounded-3xl border border-slate-200">
              {report.items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 px-4 py-3.5 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-bold text-slate-800">{item.competency}</p>
                    {item.note ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                        {item.note}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs font-semibold text-[#0066CC]">
                      {REPORT_SCORE_LABELS[item.score] ?? ''}
                    </p>
                  </div>
                  <ScoreBar score={item.score} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading text-base font-extrabold text-slate-900">
              Catatan Pelatih
            </h4>
            <p className="mt-2 whitespace-pre-wrap rounded-3xl bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-600">
              {report.coachNotes ||
                'Tidak ada catatan tambahan dari pelatih pada periode ini.'}
            </p>
          </div>
        </div>
      ) : null}
    </DataMasterModal>
  );
}
