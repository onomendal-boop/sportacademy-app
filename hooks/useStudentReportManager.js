'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  NEXT_STUDENT_LEVEL,
  PROGRAM_CONFIG,
  REPORT_COMPETENCIES,
  REPORT_RECOMMENDATION_LABELS,
  REPORT_SCORE_LABELS,
  REPORT_STATUS_LABELS,
} from '@/lib/operational/constants';
import { formatDateKey } from '@/lib/operational/dateUtils';
import { reportApi } from '@/lib/operational/operationalClient';
import {
  getOperationalFieldErrors,
  reportSchema,
} from '@/lib/validations/operational';

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const EMPTY_FORM = {
  studentId: '',
  coachId: '',
  level: 'AAA',
  periodLabel: '',
  periodStart: '',
  periodEnd: '',
  sessionsAttended: '',
  totalSessions: '',
  coachNotes: '',
  recommendation: 'STAY',
  status: 'DRAFT',
  items: [],
};

function normalize(value) {
  return String(value ?? '').toLowerCase();
}

function mapApiFieldErrors(error) {
  if (!error?.fieldErrors) return {};

  return Object.fromEntries(
    Object.entries(error.fieldErrors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : messages,
    ])
  );
}

function getCurrentPeriodLabel() {
  const today = new Date();
  return `${MONTH_NAMES_ID[today.getMonth()]} ${today.getFullYear()}`;
}

function buildCatalogItems(level, existingItems = []) {
  const byName = new Map(
    existingItems.map((item) => [item.competency.trim().toLowerCase(), item])
  );

  return (REPORT_COMPETENCIES[level] ?? []).map((competency) => {
    const existing = byName.get(competency.toLowerCase());

    return {
      competency,
      score: existing?.score ? String(existing.score) : '3',
      note: existing?.note ?? '',
    };
  });
}

function toFormItems(items = []) {
  return items.map((item) => ({
    competency: item.competency ?? '',
    score: item.score ? String(item.score) : '3',
    note: item.note ?? '',
  }));
}

function calculateAverage(items) {
  const scores = items
    .map((item) => Number(item.score))
    .filter((score) => Number.isFinite(score) && score > 0);

  if (scores.length === 0) return 0;

  return (
    Math.round(
      (scores.reduce((total, score) => total + score, 0) / scores.length) *
        100
    ) / 100
  );
}

export function getAverageScoreLabel(average) {
  if (!average) return '-';

  const rounded = Math.min(5, Math.max(1, Math.round(average)));
  return REPORT_SCORE_LABELS[rounded] ?? '-';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildPayloadFromReport(report, overrides = {}) {
  return {
    studentId: report.studentId,
    coachId: report.coachId ?? '',
    level: report.level,
    periodLabel: report.periodLabel,
    periodStart: report.periodStart ?? '',
    periodEnd: report.periodEnd ?? '',
    sessionsAttended:
      report.sessionsAttended === null ? '' : report.sessionsAttended,
    totalSessions: report.totalSessions === null ? '' : report.totalSessions,
    coachNotes: report.coachNotes ?? '',
    recommendation: report.recommendation,
    status: report.status,
    items: toFormItems(report.items),
    ...overrides,
  };
}

export default function useStudentReportManager(
  initialReports = [],
  { students: initialStudents = [], coaches = [], canManage = false, canDelete = false, currentUser = null } = {}
) {
  const [reports, setReports] = useState(initialReports);
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [detailReport, setDetailReport] = useState(null);
  const [publishingId, setPublishingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const studentById = useMemo(
    () => Object.fromEntries(students.map((student) => [student.id, student])),
    [students]
  );

  const periodOptions = useMemo(
    () => [...new Set(reports.map((report) => report.periodLabel))].sort(),
    [reports]
  );

  const filteredReports = useMemo(() => {
    const keyword = normalize(search).trim();

    return reports.filter((report) => {
      const matchesSearch =
        !keyword ||
        [
          report.student?.name,
          report.coach?.name,
          report.periodLabel,
          PROGRAM_CONFIG[report.level]?.title,
        ]
          .map(normalize)
          .some((value) => value.includes(keyword));
      const matchesLevel =
        levelFilter === 'ALL' || report.level === levelFilter;
      const matchesStatus =
        statusFilter === 'ALL' || report.status === statusFilter;
      const matchesPeriod =
        periodFilter === 'ALL' || report.periodLabel === periodFilter;

      return matchesSearch && matchesLevel && matchesStatus && matchesPeriod;
    });
  }, [reports, search, levelFilter, statusFilter, periodFilter]);

  const stats = useMemo(() => {
    const published = reports.filter((report) => report.status === 'PUBLISHED');

    return {
      total: reports.length,
      published: published.length,
      draft: reports.length - published.length,
      levelUp: reports.filter(
        (report) => report.recommendation === 'LEVEL_UP'
      ).length,
      averageScore:
        published.length > 0
          ? Math.round(
              (published.reduce(
                (total, report) => total + report.averageScore,
                0
              ) /
                published.length) *
                100
            ) / 100
          : 0,
    };
  }, [reports]);

  const formAverage = useMemo(
    () => calculateAverage(formData.items),
    [formData.items]
  );

  const formAttendancePercent = useMemo(() => {
    const attended = Number(formData.sessionsAttended);
    const total = Number(formData.totalSessions);

    if (!total || !Number.isFinite(attended)) return null;
    return Math.round((attended / total) * 100);
  }, [formData.sessionsAttended, formData.totalSessions]);

  const formNextLevel = NEXT_STUDENT_LEVEL[formData.level] ?? null;

  function applyReportResult(report) {
    setReports((current) => {
      const exists = current.some((item) => item.id === report.id);
      return exists
        ? current.map((item) => (item.id === report.id ? report : item))
        : [report, ...current];
    });

    setDetailReport((current) =>
      current?.id === report.id ? report : current
    );

    if (report.promotedToLevel) {
      setStudents((current) =>
        current.map((student) =>
          student.id === report.studentId
            ? { ...student, level: report.promotedToLevel }
            : student
        )
      );
      toast.success(
        `Level ${report.student?.name ?? 'siswa'} naik ke ${PROGRAM_CONFIG[report.promotedToLevel]?.title ?? report.promotedToLevel}.`
      );
    }
  }

  function updateField(name, value) {
    setFormData((current) => {
      const next = { ...current, [name]: value };

      if (name === 'studentId' && !editingReport) {
        const student = studentById[value];

        if (student) {
          next.level = student.level;
          next.items = buildCatalogItems(student.level, current.items);
        }
      }

      if (name === 'level') {
        next.items = buildCatalogItems(value, current.items);
      }

      return next;
    });
    setFormErrors((current) => ({ ...current, [name]: undefined }));
  }

  function updateItem(index, field, value) {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
    setFormErrors((current) => ({ ...current, items: undefined }));
  }

  function addItem() {
    setFormData((current) => ({
      ...current,
      items: [...current.items, { competency: '', score: '3', note: '' }],
    }));
  }

  function removeItem(index) {
    setFormData((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function loadCatalogItems() {
    setFormData((current) => ({
      ...current,
      items: buildCatalogItems(current.level, current.items),
    }));
    toast.success('Template kompetensi level dimuat. Skor yang sama dipertahankan.');
  }

  function openCreate() {
    if (!canManage) return;
    setEditingReport(null);
    setFormData({
      ...EMPTY_FORM,
      coachId: currentUser?.role === 'COACH' ? currentUser.id : '',
      periodLabel: getCurrentPeriodLabel(),
      items: buildCatalogItems('AAA'),
    });
    setFormErrors({});
    setIsFormOpen(true);
  }

  function openEdit(report) {
    if (!canManage) return;
    setEditingReport(report);
    setFormData(buildPayloadFromReport(report));
    setFormErrors({});
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingReport(null);
    setFormErrors({});
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!canManage || isSaving) return;

    const parsed = reportSchema.safeParse(formData);

    if (!parsed.success) {
      setFormErrors(getOperationalFieldErrors(parsed.error));
      return;
    }

    setIsSaving(true);

    try {
      const result = editingReport
        ? await reportApi.update(editingReport.id, parsed.data)
        : await reportApi.create(parsed.data);

      applyReportResult(result);
      toast.success(
        editingReport
          ? `Raport ${result.student?.name ?? ''} periode ${result.periodLabel} berhasil diperbarui.`
          : `Raport ${result.student?.name ?? ''} periode ${result.periodLabel} berhasil dibuat.`
      );
      setIsFormOpen(false);
      setEditingReport(null);
      setFormData(EMPTY_FORM);
      setFormErrors({});
    } catch (error) {
      setFormErrors(mapApiFieldErrors(error));
      toast.error(error?.message ?? 'Gagal menyimpan raport.');
    } finally {
      setIsSaving(false);
    }
  }

  async function togglePublish(report) {
    if (!canManage || publishingId) return;

    const nextStatus = report.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const parsed = reportSchema.safeParse(
      buildPayloadFromReport(report, { status: nextStatus })
    );

    if (!parsed.success) {
      toast.error('Data raport belum lengkap untuk diterbitkan. Buka form edit untuk melengkapinya.');
      return;
    }

    setPublishingId(report.id);

    try {
      const result = await reportApi.update(report.id, parsed.data);
      applyReportResult(result);
      toast.success(
        nextStatus === 'PUBLISHED'
          ? `Raport ${result.student?.name ?? ''} berhasil diterbitkan.`
          : `Raport ${result.student?.name ?? ''} dikembalikan ke draf.`
      );
    } catch (error) {
      toast.error(error?.message ?? 'Gagal mengubah status raport.');
    } finally {
      setPublishingId(null);
    }
  }

  async function confirmDelete() {
    if (!canDelete || !deleteTarget || isDeleting) return;

    setIsDeleting(true);

    try {
      await reportApi.remove(deleteTarget.id);
      setReports((current) =>
        current.filter((report) => report.id !== deleteTarget.id)
      );
      setDetailReport((current) =>
        current?.id === deleteTarget.id ? null : current
      );
      toast.success(
        `Raport ${deleteTarget.student?.name ?? ''} periode ${deleteTarget.periodLabel} berhasil dihapus.`
      );
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menghapus raport.');
    } finally {
      setIsDeleting(false);
    }
  }

  function printReport(report) {
    if (!report) return;

    const levelTitle =
      PROGRAM_CONFIG[report.level]?.title ?? report.level;
    const rows = report.items
      .map((item) => {
        const percent = Math.round((item.score / 5) * 100);
        return `<tr>
          <td>${escapeHtml(item.competency)}${item.note ? `<div class="note">${escapeHtml(item.note)}</div>` : ''}</td>
          <td class="score-cell"><div class="bar"><span style="width:${percent}%"></span></div></td>
          <td class="score-text"><strong>${item.score}/5</strong><br/>${escapeHtml(REPORT_SCORE_LABELS[item.score] ?? '')}</td>
        </tr>`;
      })
      .join('');
    const attendance =
      report.sessionsAttended !== null && report.totalSessions
        ? `${report.sessionsAttended} dari ${report.totalSessions} sesi (${report.attendancePercent ?? 0}%)`
        : '-';
    const periodRange =
      report.periodStart || report.periodEnd
        ? `${formatDateKey(report.periodStart)} - ${formatDateKey(report.periodEnd)}`
        : report.periodLabel;

    const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Raport ${escapeHtml(report.student?.name ?? '')} - ${escapeHtml(report.periodLabel)}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#0f172a;margin:0;padding:32px;background:#f8fafc}
    .card{max-width:760px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:32px}
    .head{background:linear-gradient(135deg,#0066CC,#0891b2);color:#fff;border-radius:16px;padding:22px}
    .brand{font-size:22px;font-weight:800;margin:0}.muted{color:#64748b;font-size:13px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin:20px 0;font-size:14px}
    .grid span{color:#64748b;display:block;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
    table{width:100%;border-collapse:collapse;font-size:14px}th{text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;padding:10px 8px;border-bottom:2px solid #e2e8f0}
    td{padding:11px 8px;border-bottom:1px solid #f1f5f9;vertical-align:middle}.note{color:#64748b;font-size:12px;margin-top:3px}
    .bar{height:9px;background:#e2e8f0;border-radius:999px;min-width:130px}.bar span{display:block;height:100%;background:#0066CC;border-radius:999px}
    .score-text{white-space:nowrap;font-size:12px;color:#475569}.avg{display:flex;justify-content:space-between;align-items:center;background:#eff6ff;border-radius:14px;padding:16px;margin:20px 0}
    .avg strong{font-size:26px;color:#0066CC}.box{background:#f8fafc;border-radius:14px;padding:16px;font-size:14px;line-height:1.6;white-space:pre-wrap}
    .badge{display:inline-block;padding:5px 10px;border-radius:999px;background:#ecfdf5;color:#047857;font-weight:700;font-size:12px}
    .draft{background:#fef3c7;color:#92400e}.sign{margin-top:34px;text-align:right;font-size:14px}.sign .name{margin-top:52px;font-weight:800;text-decoration:underline}
    @media print{body{background:#fff;padding:0}.card{border:none}}
  </style>
</head>
<body>
  <section class="card">
    <div class="head">
      <p class="brand">AAA Sport Academy</p>
      <p style="margin:6px 0 0">Raport Perkembangan Siswa • ${escapeHtml(report.periodLabel)}</p>
    </div>
    <div class="grid">
      <div><span>Nama Siswa</span><strong>${escapeHtml(report.student?.name ?? '-')}</strong></div>
      <div><span>Level</span><strong>${escapeHtml(levelTitle)}</strong></div>
      <div><span>Periode</span><strong>${escapeHtml(periodRange)}</strong></div>
      <div><span>Kehadiran</span><strong>${escapeHtml(attendance)}</strong></div>
      <div><span>Status</span><span class="badge ${report.status === 'DRAFT' ? 'draft' : ''}">${report.status === 'DRAFT' ? 'DRAF - Belum Diterbitkan' : escapeHtml(REPORT_STATUS_LABELS[report.status] ?? report.status)}</span></div>
      <div><span>Pelatih Penilai</span><strong>${escapeHtml(report.coach?.name ?? '-')}</strong></div>
    </div>
    <table>
      <thead><tr><th>Kompetensi</th><th>Capaian</th><th>Skor</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="avg">
      <div><div class="muted">Rata-rata Capaian</div><strong>${report.averageScore.toFixed(2)} / 5</strong></div>
      <div style="text-align:right"><div class="muted">Predikat</div><strong style="font-size:17px">${escapeHtml(getAverageScoreLabel(report.averageScore))}</strong><div class="muted">Rekomendasi: ${escapeHtml(REPORT_RECOMMENDATION_LABELS[report.recommendation] ?? report.recommendation)}</div></div>
    </div>
    <h3>Catatan Pelatih</h3>
    <div class="box">${escapeHtml(report.coachNotes || 'Tidak ada catatan tambahan dari pelatih pada periode ini.')}</div>
    <div class="sign">
      <p>Pelatih Penilai,</p>
      <p class="name">${escapeHtml(report.coach?.name ?? 'Tim Pelatih AAA Sport Academy')}</p>
    </div>
    <p class="muted" style="margin-top:24px">Terima kasih atas kepercayaan Bapak/Ibu kepada AAA Sport Academy.</p>
  </section>
  <script>window.onload=function(){window.print();};</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank', 'noopener,noreferrer');

    if (!printWindow) {
      URL.revokeObjectURL(url);
      toast.error('Popup cetak diblokir browser. Izinkan popup lalu coba lagi.');
      return;
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return {
    canManage,
    canDelete,
    currentUser,
    reports,
    filteredReports,
    students,
    coaches,
    studentById,
    stats,
    periodOptions,
    search,
    levelFilter,
    statusFilter,
    periodFilter,
    isFormOpen,
    editingReport,
    formData,
    formErrors,
    isSaving,
    formAverage,
    formAttendancePercent,
    formNextLevel,
    detailReport,
    publishingId,
    deleteTarget,
    isDeleting,
    onSearchChange: setSearch,
    onLevelFilterChange: setLevelFilter,
    onStatusFilterChange: setStatusFilter,
    onPeriodFilterChange: setPeriodFilter,
    onFieldChange: updateField,
    onItemChange: updateItem,
    onAddItem: addItem,
    onRemoveItem: removeItem,
    onLoadCatalogItems: loadCatalogItems,
    onCreate: openCreate,
    onEdit: openEdit,
    onCloseForm: closeForm,
    onSubmit: submitForm,
    onViewDetail: setDetailReport,
    onCloseDetail: () => setDetailReport(null),
    onTogglePublish: togglePublish,
    printReport,
    onDeleteRequest: setDeleteTarget,
    onDeleteCancel: () => !isDeleting && setDeleteTarget(null),
    onDeleteConfirm: confirmDelete,
  };
}
