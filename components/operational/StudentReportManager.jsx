'use client';

import {
  BadgeCheck,
  Clock3,
  Eye,
  FileText,
  Loader2,
  Lock,
  Pencil,
  Printer,
  Send,
  Star,
  Trash2,
  TrendingUp,
  Undo2,
} from 'lucide-react';
import {
  Avatar,
  DataMasterToolbar,
  DeleteConfirmModal,
  EmptyState,
  StatCard,
} from '@/components/data-master/DataMasterUI';
import useStudentReportManager, {
  getAverageScoreLabel,
} from '@/hooks/useStudentReportManager';
import {
  getReportLevelOptionsForScope,
  REPORT_STATUS_OPTIONS,
} from '@/lib/operational/constants';
import { formatDateKey } from '@/lib/operational/dateUtils';
import { cn } from '@/lib/utils';
import { OperationalHeader, ProgramBadge } from './OperationalUI';
import {
  RecommendationBadge,
  ReportDetailModal,
  ReportFormModal,
  ReportStatusBadge,
  ScoreBar,
} from './StudentReportModals';

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-44"
      >
        {children}
      </select>
    </label>
  );
}

function ActionButton({ label, icon: Icon, onClick, disabled = false, tone = 'slate', spinning = false }) {
  const tones = {
    slate: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
    blue: 'text-[#0066CC] hover:bg-blue-50',
    green: 'text-emerald-600 hover:bg-emerald-50',
    red: 'text-red-600 hover:bg-red-50',
    amber: 'text-amber-600 hover:bg-amber-50',
    violet: 'text-violet-600 hover:bg-violet-50',
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-50',
        tones[tone] ?? tones.slate
      )}
    >
      <Icon
        className={cn('h-4 w-4', spinning && 'animate-spin')}
        aria-hidden="true"
      />
    </button>
  );
}

export default function StudentReportManager({
  initialReports = [],
  students = [],
  coaches = [],
  canManage = false,
  canDelete = false,
  currentUser = null,
  initialSearch = '',
}) {
  const manager = useStudentReportManager(initialReports, {
    students,
    coaches,
    canManage,
    canDelete,
    currentUser,
    initialSearch,
  });
  const { stats } = manager;
  const levelOptions = getReportLevelOptionsForScope(currentUser?.programScope);

  return (
    <div className="space-y-6">
      <OperationalHeader
        title="Raport Siswa"
        description="Nilai perkembangan kompetensi renang siswa per periode, terbitkan raport untuk orang tua/wali, dan naikkan level siswa berdasarkan rekomendasi pelatih."
        addLabel="Buat Raport"
        canManage={canManage}
        onAdd={manager.onCreate}
      />

      {!canManage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Mode lihat saja: hanya Superadmin, Owner, Admin, dan Pelatih yang dapat membuat,
          mengubah, atau menerbitkan raport siswa.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total Raport"
          value={stats.total}
          description="Seluruh raport dari database"
          tone="blue"
        />
        <StatCard
          icon={BadgeCheck}
          label="Sudah Terbit"
          value={stats.published}
          description={`Rata-rata capaian ${stats.averageScore.toFixed(2)}/5 (${getAverageScoreLabel(stats.averageScore)})`}
          tone="green"
        />
        <StatCard
          icon={Clock3}
          label="Masih Draf"
          value={stats.draft}
          description="Menunggu dilengkapi/diterbitkan pelatih"
          tone="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Rekomendasi Naik Level"
          value={stats.levelUp}
          description="Raport dengan rekomendasi naik ke level berikutnya"
          tone="violet"
        />
      </div>

      <DataMasterToolbar
        searchValue={manager.search}
        onSearchChange={manager.onSearchChange}
        searchPlaceholder="Cari nama siswa, pelatih, atau periode..."
      >
        <FilterSelect
          label="Filter periode raport"
          value={manager.periodFilter}
          onChange={manager.onPeriodFilterChange}
        >
          <option value="ALL">Semua Periode</option>
          {manager.periodOptions.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Filter level raport"
          value={manager.levelFilter}
          onChange={manager.onLevelFilterChange}
        >
          <option value="ALL">Semua Level</option>
          {levelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Filter status raport"
          value={manager.statusFilter}
          onChange={manager.onStatusFilterChange}
        >
          <option value="ALL">Semua Status</option>
          {REPORT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
      </DataMasterToolbar>

      {manager.filteredReports.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <h3 className="font-heading text-lg font-extrabold text-slate-900">
                Daftar Raport
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                Menampilkan {manager.filteredReports.length} dari{' '}
                {manager.reports.length} raport.
              </p>
            </div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
              <Star className="h-4 w-4 text-[#0066CC]" aria-hidden="true" />
              Skor 1–5 per kompetensi
            </p>
          </div>

          <div className="overflow-x-auto border-t border-slate-100">
            <table className="min-w-[1080px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-extrabold">Siswa</th>
                  <th className="px-5 py-4 font-extrabold">Periode</th>
                  <th className="px-5 py-4 font-extrabold">Pelatih Penilai</th>
                  <th className="px-5 py-4 font-extrabold">Kehadiran</th>
                  <th className="px-5 py-4 font-extrabold">Rata-rata</th>
                  <th className="px-5 py-4 font-extrabold">Rekomendasi</th>
                  <th className="px-5 py-4 font-extrabold">Status</th>
                  <th className="px-5 py-4 text-right font-extrabold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {manager.filteredReports.map((report) => {
                  const isPublishing = manager.publishingId === report.id;

                  return (
                    <tr key={report.id} className="align-top transition hover:bg-blue-50/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={report.student?.name ?? 'Siswa'} />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900">
                              {report.student?.name ?? 'Siswa Terhapus'}
                            </p>
                            <div className="mt-1">
                              <ProgramBadge program={report.level} />
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="whitespace-nowrap font-bold text-slate-800">
                          {report.periodLabel}
                        </p>
                        {report.periodStart || report.periodEnd ? (
                          <p className="mt-1 whitespace-nowrap text-xs text-slate-400">
                            {formatDateKey(report.periodStart)} -{' '}
                            {formatDateKey(report.periodEnd)}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-400">
                          {report.items.length} kompetensi dinilai
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {report.coach ? (
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              name={report.coach.name}
                              imageUrl={report.coach.profileImage}
                              className="h-9 w-9 text-[11px]"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-700">
                                {report.coach.name}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {report.coach.specialization ?? 'Pelatih'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {report.sessionsAttended !== null && report.totalSessions ? (
                          <>
                            <p className="font-bold text-slate-800">
                              {report.sessionsAttended}/{report.totalSessions} sesi
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Kehadiran {report.attendancePercent}%
                            </p>
                          </>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-heading text-lg font-extrabold leading-none text-slate-900">
                          {report.averageScore.toFixed(2)}
                          <span className="ml-1 text-xs font-bold text-slate-400">
                            /5
                          </span>
                        </p>
                        <div className="mt-2">
                          <ScoreBar score={Math.round(report.averageScore)} />
                        </div>
                        <p className="mt-1 text-xs font-semibold text-[#0066CC]">
                          {getAverageScoreLabel(report.averageScore)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <RecommendationBadge recommendation={report.recommendation} />
                      </td>

                      <td className="px-5 py-4">
                        <ReportStatusBadge status={report.status} />
                        {report.publishedAt ? (
                          <p className="mt-1.5 whitespace-nowrap text-xs text-slate-400">
                            {formatDateKey(report.publishedAt.slice(0, 10))}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton
                            label="Lihat detail raport"
                            icon={Eye}
                            tone="blue"
                            onClick={() => manager.onViewDetail(report)}
                          />
                          <ActionButton
                            label="Cetak raport"
                            icon={Printer}
                            onClick={() => manager.printReport(report)}
                          />

                          {canManage ? (
                            <ActionButton
                              label={
                                report.status === 'PUBLISHED'
                                  ? 'Kembalikan ke draf'
                                  : 'Terbitkan raport'
                              }
                              icon={
                                isPublishing
                                  ? Loader2
                                  : report.status === 'PUBLISHED'
                                    ? Undo2
                                    : Send
                              }
                              tone={
                                report.status === 'PUBLISHED' ? 'amber' : 'green'
                              }
                              spinning={isPublishing}
                              disabled={isPublishing}
                              onClick={() => manager.onTogglePublish(report)}
                            />
                          ) : null}

                          {canManage ? (
                            <ActionButton
                              label="Ubah raport"
                              icon={Pencil}
                              onClick={() => manager.onEdit(report)}
                            />
                          ) : null}

                          {canDelete ? (
                            <ActionButton
                              label="Hapus raport"
                              icon={Trash2}
                              tone="red"
                              onClick={() => manager.onDeleteRequest(report)}
                            />
                          ) : null}

                          {!canManage && !canDelete ? (
                            <span className="flex h-9 w-9 items-center justify-center text-slate-300">
                              <Lock className="h-4 w-4" aria-hidden="true" />
                            </span>
                          ) : null}
                        </div>
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
          icon={FileText}
          title="Raport tidak ditemukan"
          description="Belum ada raport yang sesuai dengan pencarian atau filter. Buat raport baru untuk periode berjalan atau ubah filter yang digunakan."
        />
      )}

      <ReportFormModal manager={manager} />
      <ReportDetailModal manager={manager} />

      <DeleteConfirmModal
        open={Boolean(manager.deleteTarget)}
        title="Hapus Raport"
        itemName={`${manager.deleteTarget?.student?.name ?? 'Siswa'} — ${manager.deleteTarget?.periodLabel ?? ''}`}
        description="Seluruh item penilaian pada raport ini ikut terhapus. Penghapusan permanen hanya dapat dilakukan Superadmin/Owner."
        isDeleting={manager.isDeleting}
        onCancel={manager.onDeleteCancel}
        onConfirm={manager.onDeleteConfirm}
      />
    </div>
  );
}
