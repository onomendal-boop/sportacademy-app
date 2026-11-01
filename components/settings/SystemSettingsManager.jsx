'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  Landmark,
  BellRing,
  HardDrive,
  Save,
  Check,
  X,
  Upload,
  Trash2,
  Waves,
  Clock,
  Plus,
  Copy,
  Download,
  Database,
  MessageCircle,
  Mail,
  Eye,
  AlertTriangle,
  FileJson,
  History,
  Calculator,
  ChevronDown,
  CircleUserRound,
} from 'lucide-react';

import ProfileSettingsSection from '@/components/settings/ProfileSettingsSection';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  databaseBackupApi,
  systemSettingsApi,
} from '@/lib/settings/settingsClient';

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const TAB_OPTIONS = [
  { value: 'profile', label: 'Profil & Keamanan', icon: CircleUserRound },
  { value: 'general', label: 'General', icon: SlidersHorizontal },
  { value: 'financial', label: 'Financial Rules', icon: Landmark },
  { value: 'notifications', label: 'Notification Templates', icon: BellRing },
  { value: 'backup', label: 'Backup Database', icon: HardDrive },
];

const TIMEZONE_OPTIONS = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'];

const PLACEHOLDERS = [
  { token: 'nama_siswa', label: 'Nama Siswa' },
  { token: 'nama_orang_tua', label: 'Nama Orang Tua' },
  { token: 'sisa_pertemuan', label: 'Sisa Pertemuan' },
  { token: 'nama_paket', label: 'Nama Paket' },
  { token: 'tanggal_jatuh_tempo', label: 'Tanggal Jatuh Tempo' },
  { token: 'nominal_tagihan', label: 'Nominal Tagihan' },
  { token: 'jadwal_kelas', label: 'Jadwal Kelas' },
  { token: 'nama_kolam', label: 'Nama Kolam' },
  { token: 'nama_pelatih', label: 'Nama Pelatih' },
  { token: 'kode_promo', label: 'Kode Promo' },
  { token: 'nama_bisnis', label: 'Nama Bisnis' },
  { token: 'nomor_invoice', label: 'Nomor Invoice' },
];

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getInputClassName(hasError, additionalClassName = '') {
  return cn(
    'mt-1.5 h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
      : 'border-slate-200 focus:border-[#0066CC] focus:ring-blue-600/10',
    additionalClassName
  );
}

function getSelectClassName(hasError, additionalClassName = '') {
  return cn(getInputClassName(hasError, 'appearance-none pr-10'), additionalClassName);
}

function findPlaceholders(text) {
  return Array.from(String(text ?? '').matchAll(/\{([a-z0-9_]+)\}/gi)).map((match) =>
    match[1].toLowerCase()
  );
}

function renderTemplatePreview(text, businessName, previewContext = {}) {
  let rendered = String(text ?? '');

  PLACEHOLDERS.forEach(({ token }) => {
    const value =
      token === 'nama_bisnis'
        ? businessName || previewContext[token] || '-'
        : previewContext[token] ?? '-';
    rendered = rendered.replaceAll(`{${token}}`, String(value));
  });

  return rendered;
}
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        {description ? <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-[#0066CC]' : 'bg-slate-300'
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-6' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN CONTENT                                                               */
/* -------------------------------------------------------------------------- */

export default function SystemSettingsManager({
  initialSettings,
  initialBackupHistory = [],
  templatePreviewContext = {},
  financialPreviewSample = { amount: 0, lateDays: 0 },
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const logoInputRef = useRef(null);
  const subjectInputRef = useRef(null);
  const messageTextareaRef = useRef(null);

  const [activeTab, setActiveTab] = useState(() =>
    TAB_OPTIONS.some((tab) => tab.value === tabFromUrl) ? tabFromUrl : 'general'
  );
  // Tab sistem (general/financial/notifications/backup) khusus SUPERADMIN.
  // Role lain hanya melihat Profil & Keamanan (akun sendiri).
  const currentRole = 'SUPERADMIN';
  const [settings, setSettings] = useState(() => deepClone(initialSettings));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialSettings));
  const isLoaded = true;
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [downloadingBackupId, setDownloadingBackupId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialSettings.notifications.templates[0]?.id ?? null);
  const [activeTemplateField, setActiveTemplateField] = useState('message');
  const [backupHistory, setBackupHistory] = useState(initialBackupHistory);

  const [sampleInvoiceAmount, setSampleInvoiceAmount] = useState(String(financialPreviewSample.amount ?? 0));
  const [sampleLateDays, setSampleLateDays] = useState(String(financialPreviewSample.lateDays ?? 0));

  useEffect(() => {
    if (TAB_OPTIONS.some((tab) => tab.value === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const hasUnsavedChanges = useMemo(
    () => isLoaded && JSON.stringify(settings) !== savedSnapshot,
    [isLoaded, settings, savedSnapshot]
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function changeTab(tab) {
    if (tab !== 'profile' && currentRole !== 'SUPERADMIN') return;
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }

  /* ------------------------------ Update helpers ---------------------------- */

  function updateGeneral(field, value) {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, [field]: value },
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function updateOperatingHour(day, field, value) {
    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        operatingHours: prev.general.operatingHours.map((item) =>
          item.day === day ? { ...item, [field]: value } : item
        ),
      },
    }));
    setErrors((prev) => ({ ...prev, operatingHours: '' }));
  }

  function copyMondayToAllDays() {
    const monday = settings.general.operatingHours.find((item) => item.day === 'Senin');
    if (!monday) return;

    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        operatingHours: prev.general.operatingHours.map((item) => ({
          ...item,
          isOpen: monday.isOpen,
          openTime: monday.openTime,
          closeTime: monday.closeTime,
        })),
      },
    }));
    setNotification({ type: 'success', message: 'Jam operasional Senin diterapkan ke semua hari.' });
  }

  function handleLogoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, logo: 'File logo harus berupa gambar PNG, JPG, SVG, atau WebP.' }));
      return;
    }

    if (file.size > 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        logo: 'Logo maksimal 1 MB karena disimpan sebagai data URL di database.',
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateGeneral('logoDataUrl', String(reader.result));
      updateGeneral('logoFileName', file.name);
      setErrors((prev) => ({ ...prev, logo: '' }));
    };
    reader.onerror = () => {
      setErrors((prev) => ({ ...prev, logo: 'Logo gagal dibaca. Coba file gambar lain.' }));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function updateFinancial(field, value) {
    setSettings((prev) => ({
      ...prev,
      financial: { ...prev.financial, [field]: value },
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  const selectedTemplate = useMemo(
    () =>
      settings.notifications.templates.find((template) => template.id === selectedTemplateId) ??
      settings.notifications.templates[0] ??
      null,
    [settings.notifications.templates, selectedTemplateId]
  );

  function updateNotifications(field, value) {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  }

  function updateTemplate(templateId, values) {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        templates: prev.notifications.templates.map((template) =>
          template.id === templateId ? { ...template, ...values } : template
        ),
      },
    }));
    setErrors((prev) => ({ ...prev, template: '' }));
  }

  function createTemplate(channel = 'whatsapp') {
    const newTemplate = {
      id: `template-${Date.now()}`,
      name: channel === 'email' ? 'Template Email Baru' : 'Template WhatsApp Baru',
      channel,
      eventKey: 'CUSTOM',
      subject: channel === 'email' ? 'Informasi untuk {nama_siswa}' : '',
      message: 'Halo {nama_orang_tua}, terima kasih telah menghubungi {nama_bisnis}.',
      isActive: true,
    };

    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        templates: [...prev.notifications.templates, newTemplate],
      },
    }));
    setSelectedTemplateId(newTemplate.id);
  }

  function duplicateTemplate(template) {
    const duplicated = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Salinan)`,
    };

    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        templates: [...prev.notifications.templates, duplicated],
      },
    }));
    setSelectedTemplateId(duplicated.id);
    setNotification({ type: 'success', message: `Template "${template.name}" berhasil diduplikat.` });
  }

  function deleteTemplate(template) {
    if (settings.notifications.templates.length <= 1) {
      setNotification({ type: 'error', message: 'Minimal harus ada satu template notifikasi.' });
      return;
    }

    const remaining = settings.notifications.templates.filter((item) => item.id !== template.id);
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, templates: remaining },
    }));
    setSelectedTemplateId(remaining[0]?.id ?? null);
    setNotification({ type: 'success', message: `Template "${template.name}" dihapus dari draft pengaturan.` });
  }

  function insertPlaceholder(token) {
    if (!selectedTemplate) return;

    const field = activeTemplateField === 'subject' ? 'subject' : 'message';
    const target = field === 'subject' ? subjectInputRef.current : messageTextareaRef.current;
    const currentValue = selectedTemplate[field] ?? '';
    const placeholder = `{${token}}`;

    if (!target) {
      updateTemplate(selectedTemplate.id, { [field]: `${currentValue}${placeholder}` });
      return;
    }

    const start = target.selectionStart ?? currentValue.length;
    const end = target.selectionEnd ?? currentValue.length;
    const nextValue = `${currentValue.slice(0, start)}${placeholder}${currentValue.slice(end)}`;

    updateTemplate(selectedTemplate.id, { [field]: nextValue });

    window.requestAnimationFrame(() => {
      target.focus();
      const cursor = start + placeholder.length;
      target.setSelectionRange(cursor, cursor);
    });
  }

  /* ------------------------------ Validation/save --------------------------- */

  function normalizeSettings(value) {
    const normalized = deepClone(value);
    const numericFinancialFields = [
      'taxPercentage',
      'lateFeePercentage',
      'lateFeeFixedAmount',
      'lateFeeGraceDays',
      'lateFeeCapPercentage',
      'refundOver7DaysPercentage',
      'refund3To7DaysPercentage',
      'refundUnder3DaysPercentage',
      'refundAdminFeePercentage',
      'refundProcessingDays',
    ];

    numericFinancialFields.forEach((field) => {
      normalized.financial[field] =
        normalized.financial[field] === '' ? 0 : Number(normalized.financial[field]) || 0;
    });

    return normalized;
  }

  function validateSettings(value) {
    const nextErrors = {};
    let firstInvalidTab = null;

    if (value.general.businessName.trim().length < 3) {
      nextErrors.businessName = 'Nama bisnis minimal 3 karakter.';
      firstInvalidTab = 'general';
    }
    if (
      value.general.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.general.email.trim())
    ) {
      nextErrors.email = 'Format email bisnis tidak valid.';
      firstInvalidTab = firstInvalidTab ?? 'general';
    }
    if (
      value.general.operatingHours.some(
        (item) => item.isOpen && (!item.openTime || !item.closeTime || item.closeTime <= item.openTime)
      )
    ) {
      nextErrors.operatingHours = 'Jam tutup harus lebih akhir daripada jam buka untuk setiap hari yang buka.';
      firstInvalidTab = firstInvalidTab ?? 'general';
    }

    const percentageFields = [
      'taxPercentage',
      'lateFeePercentage',
      'lateFeeCapPercentage',
      'refundOver7DaysPercentage',
      'refund3To7DaysPercentage',
      'refundUnder3DaysPercentage',
      'refundAdminFeePercentage',
    ];

    percentageFields.forEach((field) => {
      const numberValue = Number(value.financial[field]);
      if (Number.isNaN(numberValue) || numberValue < 0 || numberValue > 100) {
        nextErrors[field] = 'Persentase harus berada pada rentang 0-100%.';
        firstInvalidTab = firstInvalidTab ?? 'financial';
      }
    });

    if (Number(value.financial.lateFeeFixedAmount) < 0) {
      nextErrors.lateFeeFixedAmount = 'Denda tetap tidak boleh negatif.';
      firstInvalidTab = firstInvalidTab ?? 'financial';
    }
    if (Number(value.financial.lateFeeGraceDays) < 0 || Number(value.financial.lateFeeGraceDays) > 30) {
      nextErrors.lateFeeGraceDays = 'Masa tenggang harus 0-30 hari.';
      firstInvalidTab = firstInvalidTab ?? 'financial';
    }
    if (Number(value.financial.refundProcessingDays) < 1 || Number(value.financial.refundProcessingDays) > 60) {
      nextErrors.refundProcessingDays = 'Proses refund harus 1-60 hari kerja.';
      firstInvalidTab = firstInvalidTab ?? 'financial';
    }

    const hasInvalidTemplate = value.notifications.templates.some((template) => {
      if (template.name.trim().length < 3 || template.message.trim().length < 10) return true;
      if (template.channel === 'email' && template.subject.trim().length < 3) return true;
      return false;
    });

    if (hasInvalidTemplate) {
      nextErrors.template = 'Setiap template wajib memiliki nama, isi pesan, dan subject untuk email.';
      firstInvalidTab = firstInvalidTab ?? 'notifications';
    }

    return { errors: nextErrors, firstInvalidTab };
  }

  function flattenServerFieldErrors(fieldErrors = {}) {
    return Object.fromEntries(
      Object.entries(fieldErrors).map(([field, messages]) => [
        field,
        Array.isArray(messages) ? messages[0] : messages,
      ])
    );
  }

  async function persistSettings(settingsToSave, successMessage) {
    if (isSavingSettings) return false;

    setIsSavingSettings(true);

    try {
      const normalized = normalizeSettings(settingsToSave);
      const savedSettings = await systemSettingsApi.update(normalized);

      setSettings(savedSettings);
      setSavedSnapshot(JSON.stringify(savedSettings));
      setSelectedTemplateId((current) =>
        savedSettings.notifications.templates.some((template) => template.id === current)
          ? current
          : savedSettings.notifications.templates[0]?.id ?? null
      );
      setErrors({});
      setNotification({ type: 'success', message: successMessage });
      router.refresh();
      return true;
    } catch (error) {
      if (error?.fieldErrors) {
        setErrors((current) => ({
          ...current,
          ...flattenServerFieldErrors(error.fieldErrors),
        }));
      }
      setNotification({
        type: 'error',
        message: error?.message ?? 'Gagal menyimpan pengaturan ke database.',
      });
      return false;
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleSave() {
    const normalized = normalizeSettings(settings);
    const { errors: validationErrors, firstInvalidTab } = validateSettings(normalized);

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      if (firstInvalidTab) changeTab(firstInvalidTab);
      setNotification({
        type: 'error',
        message: 'Pengaturan belum dapat disimpan. Periksa kembali field yang ditandai.',
      });
      return;
    }

    await persistSettings(normalized, 'Pengaturan berhasil disimpan ke database MySQL.');
  }

  function handleDiscardChanges() {
    try {
      const parsed = JSON.parse(savedSnapshot);
      setSettings(parsed);
      setSelectedTemplateId(parsed.notifications.templates[0]?.id ?? null);
      setErrors({});
      setNotification({
        type: 'success',
        message: 'Perubahan yang belum disimpan berhasil dibatalkan.',
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Snapshot pengaturan database terakhir tidak dapat dibaca.',
      });
    }
  }

  /* --------------------------------- Backup -------------------------------- */

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleCreateDatabaseBackup() {
    if (isCreatingBackup) return;

    if (hasUnsavedChanges) {
      setNotification({
        type: 'error',
        message: 'Simpan pengaturan ke database terlebih dahulu agar snapshot backup memuat nilai terbaru.',
      });
      return;
    }

    setIsCreatingBackup(true);

    try {
      const { blob, fileName } = await databaseBackupApi.createAndDownload();
      downloadBlob(blob, fileName);

      const history = await databaseBackupApi.list();
      setBackupHistory(history);
      setNotification({
        type: 'success',
        message: `Backup database ${fileName} berhasil dibuat dari MySQL dan diunduh.`,
      });
      router.refresh();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error?.message ?? 'Gagal membuat backup database.',
      });
    } finally {
      setIsCreatingBackup(false);
    }
  }

  async function handleDownloadBackup(item) {
    if (downloadingBackupId) return;

    setDownloadingBackupId(item.id);

    try {
      const { blob, fileName } = await databaseBackupApi.download(item.id);
      downloadBlob(blob, fileName);
      setNotification({
        type: 'success',
        message: `Backup ${fileName} berhasil diunduh dari database.`,
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: error?.message ?? 'Gagal mengunduh backup database.',
      });
    } finally {
      setDownloadingBackupId(null);
    }
  }

  function handleDownloadSettingsJson() {
    try {
      const savedSettings = JSON.parse(savedSnapshot);
      const blob = new Blob([JSON.stringify(savedSettings, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      downloadBlob(blob, 'aaa-sport-academy-settings.json');
      setNotification({
        type: 'success',
        message: 'Pengaturan terakhir yang tersimpan di database berhasil diexport sebagai JSON.',
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Snapshot pengaturan database tidak dapat diexport.',
      });
    }
  }

  /* ------------------------------- Derived data ----------------------------- */

  const lateFeeSimulation = useMemo(() => {
    const invoice = Number(sampleInvoiceAmount) || 0;
    const lateDays = Number(sampleLateDays) || 0;
    const financial = settings.financial;
    const billableLateDays = Math.max(0, lateDays - (Number(financial.lateFeeGraceDays) || 0));

    if (!financial.lateFeeEnabled || billableLateDays === 0) {
      return { fee: 0, billableLateDays, total: invoice };
    }

    let fee = 0;
    if (financial.lateFeeType === 'percentage') {
      const multiplier = financial.lateFeePeriod === 'day' ? billableLateDays : Math.ceil(billableLateDays / 30);
      fee = invoice * ((Number(financial.lateFeePercentage) || 0) / 100) * Math.max(1, multiplier);
    } else if (financial.lateFeeType === 'fixed_amount') {
      fee = Number(financial.lateFeeFixedAmount) || 0;
    } else {
      const multiplier = financial.lateFeePeriod === 'day' ? billableLateDays : Math.ceil(billableLateDays / 30);
      fee =
        invoice * ((Number(financial.lateFeePercentage) || 0) / 100) * Math.max(1, multiplier) +
        (Number(financial.lateFeeFixedAmount) || 0);
    }

    const cap = invoice * ((Number(financial.lateFeeCapPercentage) || 0) / 100);
    if (cap > 0) fee = Math.min(fee, cap);

    fee = Math.round(fee);
    return { fee, billableLateDays, total: invoice + fee };
  }, [sampleInvoiceAmount, sampleLateDays, settings.financial]);

  const selectedTemplatePlaceholders = useMemo(
    () => findPlaceholders(`${selectedTemplate?.subject ?? ''} ${selectedTemplate?.message ?? ''}`),
    [selectedTemplate]
  );

  const unknownPlaceholders = useMemo(
    () =>
      selectedTemplatePlaceholders.filter(
        (token) => !PLACEHOLDERS.some((placeholder) => placeholder.token === token)
      ),
    [selectedTemplatePlaceholders]
  );

  const lastBackup = backupHistory[0] ?? null;
  const visibleTabs = TAB_OPTIONS.filter(
    (tab) => tab.value === 'profile' || currentRole === 'SUPERADMIN'
  );

  /* ---------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-4 pb-24 sm:space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge status="active">Settings</Badge>
            <Badge status={hasUnsavedChanges ? 'pending' : 'completed'}>
              {hasUnsavedChanges ? 'Ada perubahan belum disimpan' : 'Tersimpan di database'}
            </Badge>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Pengaturan Sistem
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Atur identitas bisnis, aturan keuangan, template WhatsApp/email, dan backup. Seluruh
            pengaturan sistem dibaca dan disimpan melalui Prisma ke database MySQL.
          </p>
        </div>

        {activeTab !== 'profile' && currentRole === 'SUPERADMIN' ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button onClick={handleSave} disabled={isSavingSettings || !hasUnsavedChanges} leftIcon={<Save className="h-4 w-4" />}>
              Simpan Pengaturan
            </Button>
          </div>
        ) : null}
      </section>

      {/* Tabs */}
      <nav
        aria-label="Tab pengaturan"
        className="grid gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm shadow-slate-900/[0.02] sm:grid-cols-2 xl:grid-cols-5"
      >
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => changeTab(tab.value)}
              className={cn(
                'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-[#0066CC] text-white shadow-sm shadow-blue-600/25'
                  : 'text-slate-500 hover:bg-blue-50 hover:text-[#0066CC]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Notification */}
      {notification ? (
        <div
          role="status"
          className={cn(
            'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium',
            notification.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          )}
        >
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white',
              notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
            )}
          >
            {notification.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </span>
          <p className="min-w-0 flex-1">{notification.message}</p>
          <button
            type="button"
            onClick={() => setNotification(null)}
            aria-label="Tutup notifikasi"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {activeTab === 'profile' || currentRole !== 'SUPERADMIN' ? (
        /* --------------------------- PROFIL & KEAMANAN -------------------------- */
        <ProfileSettingsSection />
      ) : activeTab === 'general' ? (
        /* ------------------------------ GENERAL ------------------------------ */
        <div className="space-y-4 sm:space-y-6">
          <section className="grid items-start gap-4 sm:gap-6 xl:grid-cols-3">
            <Card title="Identitas Bisnis" description="Nama, logo, dan kontak yang digunakan pada dashboard, kwitansi, serta landing page." className="xl:col-span-2">
              <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0066CC] to-cyan-400 text-white shadow-lg shadow-blue-600/20">
                  {settings.general.logoDataUrl ? (
                    <img src={settings.general.logoDataUrl} alt="Logo bisnis" className="h-full w-full bg-white object-contain p-2" />
                  ) : (
                    <Waves className="h-12 w-12" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-slate-900">Logo Bisnis</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    Gunakan logo persegi PNG/JPG/SVG. Logo disimpan sebagai data URL di database dan dibatasi 1 MB.
                  </p>
                  <p className="mt-2 truncate text-xs text-slate-400">
                    {settings.general.logoFileName || 'Belum ada logo kustom; ikon ombak default digunakan.'}
                  </p>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => logoInputRef.current?.click()} leftIcon={<Upload className="h-4 w-4" />}>
                      Upload Logo
                    </Button>
                    {settings.general.logoDataUrl ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          updateGeneral('logoDataUrl', '');
                          updateGeneral('logoFileName', '');
                        }}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                      >
                        Hapus Logo
                      </Button>
                    ) : null}
                  </div>
                  {errors.logo ? <p className="mt-2 text-xs font-medium text-red-600">{errors.logo}</p> : null}
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="business-name" className="text-sm font-bold text-slate-700">
                    Nama Bisnis <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="business-name"
                    value={settings.general.businessName}
                    onChange={(event) => updateGeneral('businessName', event.target.value)}
                    className={getInputClassName(errors.businessName)}
                  />
                  {errors.businessName ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.businessName}</p> : null}
                </div>
                <div>
                  <label htmlFor="legal-name" className="text-sm font-bold text-slate-700">Nama Legal / Yayasan</label>
                  <input
                    id="legal-name"
                    value={settings.general.legalName}
                    onChange={(event) => updateGeneral('legalName', event.target.value)}
                    className={getInputClassName(false)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="business-tagline" className="text-sm font-bold text-slate-700">Tagline</label>
                  <input
                    id="business-tagline"
                    value={settings.general.tagline}
                    onChange={(event) => updateGeneral('tagline', event.target.value)}
                    className={getInputClassName(false)}
                  />
                </div>
                <div>
                  <label htmlFor="business-email" className="text-sm font-bold text-slate-700">Email Bisnis</label>
                  <input
                    id="business-email"
                    type="email"
                    value={settings.general.email}
                    onChange={(event) => updateGeneral('email', event.target.value)}
                    className={getInputClassName(errors.email)}
                  />
                  {errors.email ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p> : null}
                </div>
                <div>
                  <label htmlFor="business-phone" className="text-sm font-bold text-slate-700">Telepon / WhatsApp</label>
                  <input
                    id="business-phone"
                    type="tel"
                    value={settings.general.phone}
                    onChange={(event) => updateGeneral('phone', event.target.value)}
                    className={getInputClassName(false)}
                  />
                </div>
                <div>
                  <label htmlFor="business-website" className="text-sm font-bold text-slate-700">Website</label>
                  <input
                    id="business-website"
                    type="url"
                    value={settings.general.website}
                    onChange={(event) => updateGeneral('website', event.target.value)}
                    className={getInputClassName(false)}
                  />
                </div>
                <div>
                  <label htmlFor="business-timezone" className="text-sm font-bold text-slate-700">Zona Waktu</label>
                  <div className="relative">
                    <select
                      id="business-timezone"
                      value={settings.general.timezone}
                      onChange={(event) => updateGeneral('timezone', event.target.value)}
                      className={getSelectClassName(false)}
                    >
                      {TIMEZONE_OPTIONS.map((timezone) => (
                        <option key={timezone} value={timezone}>{timezone}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="business-address" className="text-sm font-bold text-slate-700">Alamat / Lokasi Operasional</label>
                  <textarea
                    id="business-address"
                    value={settings.general.address}
                    onChange={(event) => updateGeneral('address', event.target.value)}
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-relaxed outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>
              </div>
            </Card>

            {/* Live Identity Preview */}
            <Card title="Preview Identitas" description="Tampilan ringkas seperti header/kwitansi.">
              <div className="overflow-hidden rounded-[24px] border border-blue-100">
                <div className="flex items-center gap-3 bg-[#0066CC] px-5 py-5 text-white">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/20">
                    {settings.general.logoDataUrl ? (
                      <img src={settings.general.logoDataUrl} alt="" className="h-full w-full bg-white object-contain p-1.5" />
                    ) : (
                      <Waves className="h-7 w-7" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-extrabold">{settings.general.businessName || 'Nama Bisnis'}</span>
                    <span className="block truncate text-xs text-blue-100">{settings.general.tagline}</span>
                  </span>
                </div>
                <div className="space-y-3 px-5 py-5 text-sm">
                  <p><span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Email</span>{settings.general.email || '-'}</p>
                  <p><span className="block text-xs font-bold uppercase tracking-wider text-slate-400">WhatsApp</span>{settings.general.phone || '-'}</p>
                  <p><span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Alamat</span>{settings.general.address || '-'}</p>
                  <p><span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Zona Waktu</span>{settings.general.timezone}</p>
                </div>
              </div>
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700 ring-1 ring-inset ring-amber-600/10">
Nama bisnis, kontak, alamat, dan jam operasional pada landing page membaca konfigurasi database ini.
                Perubahan tampil setelah pengaturan disimpan dan cache halaman publik diperbarui.
              </p>
            </Card>
          </section>

          {/* Operating Hours */}
          <Card
            title="Jam Operasional"
            description="Atur hari buka serta jam mulai dan selesai operasional admin/kolam."
            action={
              <Button size="sm" variant="secondary" onClick={copyMondayToAllDays}>
                Samakan Semua Hari
              </Button>
            }
            contentClassName="p-0 sm:p-0"
          >
            <div className="divide-y divide-slate-100">
              {settings.general.operatingHours.map((item) => (
                <div key={item.day} className="grid items-center gap-3 px-5 py-4 sm:grid-cols-[130px_auto_1fr_auto_1fr] sm:px-6">
                  <p className="inline-flex items-center gap-2 font-extrabold text-slate-900">
                    <Clock className="h-4 w-4 text-[#0066CC]" />
                    {item.day}
                  </p>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.isOpen}
                    aria-label={`${item.day} buka`}
                    onClick={() => updateOperatingHour(item.day, 'isOpen', !item.isOpen)}
                    className={cn(
                      'relative h-7 w-12 rounded-full transition-colors',
                      item.isOpen ? 'bg-[#0066CC]' : 'bg-slate-300'
                    )}
                  >
                    <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', item.isOpen ? 'left-6' : 'left-1')} />
                  </button>

                  <label className="text-xs font-semibold text-slate-500">
                    Buka
                    <input
                      type="time"
                      value={item.openTime}
                      disabled={!item.isOpen}
                      onChange={(event) => updateOperatingHour(item.day, 'openTime', event.target.value)}
                      className={getInputClassName(false, 'disabled:bg-slate-100 disabled:text-slate-400')}
                    />
                  </label>

                  <span className="hidden pt-5 text-slate-300 sm:block">-</span>

                  <label className="text-xs font-semibold text-slate-500">
                    Tutup
                    <input
                      type="time"
                      value={item.closeTime}
                      disabled={!item.isOpen}
                      onChange={(event) => updateOperatingHour(item.day, 'closeTime', event.target.value)}
                      className={getInputClassName(false, 'disabled:bg-slate-100 disabled:text-slate-400')}
                    />
                  </label>

                  {!item.isOpen ? <p className="text-xs font-bold text-red-500 sm:col-span-5">Tutup pada hari {item.day}</p> : null}
                </div>
              ))}
            </div>
            {errors.operatingHours ? (
              <p className="border-t border-red-100 bg-red-50 px-5 py-3 text-xs font-medium text-red-600 sm:px-6">
                {errors.operatingHours}
              </p>
            ) : null}
          </Card>
        </div>
      ) : activeTab === 'financial' ? (
        /* ---------------------------- FINANCIAL ------------------------------ */
        <div className="space-y-4 sm:space-y-6">
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Aturan berikut disimpan sebagai kebijakan keuangan di database dan divalidasi di server.
              Saat ini aturan dipakai oleh kalkulator preview; pembuatan invoice Finance tidak mengubah nominal secara otomatis berdasarkan aturan ini.
            </p>
          </div>

          <section className="grid items-start gap-4 sm:gap-6 xl:grid-cols-2">
            <Card title="Pajak Transaksi" description="Persentase pajak yang disimpan sebagai kebijakan dan dipakai pada kalkulator preview.">
              <Toggle
                checked={settings.financial.taxEnabled}
                onChange={(value) => updateFinancial('taxEnabled', value)}
                label="Aktifkan Pajak"
                description="Jika nonaktif, persentase tetap disimpan sebagai kebijakan tetapi tidak dipakai pada kalkulasi preview invoice."
              />

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="tax-name" className="text-sm font-bold text-slate-700">Nama Pajak</label>
                  <input
                    id="tax-name"
                    value={settings.financial.taxName}
                    onChange={(event) => updateFinancial('taxName', event.target.value)}
                    className={getInputClassName(false)}
                  />
                </div>
                <div>
                  <label htmlFor="tax-percentage" className="text-sm font-bold text-slate-700">Persentase Pajak (%)</label>
                  <div className="relative">
                    <input
                      id="tax-percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={settings.financial.taxPercentage}
                      onChange={(event) => updateFinancial('taxPercentage', event.target.value)}
                      className={getInputClassName(errors.taxPercentage, 'pr-10')}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pt-1.5 text-sm font-bold text-slate-400">%</span>
                  </div>
                  {errors.taxPercentage ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.taxPercentage}</p> : null}
                </div>
              </div>

              <div className="mt-5">
                <Toggle
                  checked={settings.financial.pricesIncludeTax}
                  onChange={(value) => updateFinancial('pricesIncludeTax', value)}
                  label="Harga Paket Sudah Termasuk Pajak"
                  description="Jika aktif, kalkulator preview menganggap pajak sudah menjadi bagian dari harga paket."
                />
              </div>
            </Card>

            <Card title="Denda Keterlambatan" description="Aturan denda untuk tagihan yang melewati tanggal jatuh tempo.">
              <Toggle
                checked={settings.financial.lateFeeEnabled}
                onChange={(value) => updateFinancial('lateFeeEnabled', value)}
                label="Aktifkan Denda Keterlambatan"
                description="Denda hanya dihitung setelah masa tenggang berakhir."
              />

              <div className="mt-5">
                <p className="text-sm font-bold text-slate-700">Metode Denda</p>
                <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  {[
                    ['percentage', 'Persentase'],
                    ['fixed_amount', 'Nominal Tetap'],
                    ['both', 'Gabungan'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateFinancial('lateFeeType', value)}
                      aria-pressed={settings.financial.lateFeeType === value}
                      className={cn(
                        'h-9 rounded-xl px-2 text-xs font-bold transition-colors sm:text-sm',
                        settings.financial.lateFeeType === value
                          ? 'bg-[#0066CC] text-white'
                          : 'text-slate-500 hover:bg-white hover:text-[#0066CC]'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="late-percentage" className="text-sm font-bold text-slate-700">Denda (%)</label>
                  <input
                    id="late-percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.financial.lateFeePercentage}
                    onChange={(event) => updateFinancial('lateFeePercentage', event.target.value)}
                    className={getInputClassName(errors.lateFeePercentage)}
                  />
                </div>
                <div>
                  <label htmlFor="late-period" className="text-sm font-bold text-slate-700">Periode Persentase</label>
                  <div className="relative">
                    <select
                      id="late-period"
                      value={settings.financial.lateFeePeriod}
                      onChange={(event) => updateFinancial('lateFeePeriod', event.target.value)}
                      className={getSelectClassName(false)}
                    >
                      <option value="month">Per Bulan</option>
                      <option value="day">Per Hari</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label htmlFor="late-fixed" className="text-sm font-bold text-slate-700">Denda Tetap (Rp)</label>
                  <input
                    id="late-fixed"
                    type="number"
                    min="0"
                    value={settings.financial.lateFeeFixedAmount}
                    onChange={(event) => updateFinancial('lateFeeFixedAmount', event.target.value)}
                    className={getInputClassName(errors.lateFeeFixedAmount)}
                  />
                </div>
                <div>
                  <label htmlFor="late-grace" className="text-sm font-bold text-slate-700">Masa Tenggang (hari)</label>
                  <input
                    id="late-grace"
                    type="number"
                    min="0"
                    max="30"
                    value={settings.financial.lateFeeGraceDays}
                    onChange={(event) => updateFinancial('lateFeeGraceDays', event.target.value)}
                    className={getInputClassName(errors.lateFeeGraceDays)}
                  />
                </div>
                <div>
                  <label htmlFor="late-cap" className="text-sm font-bold text-slate-700">Batas Maks. Denda (%)</label>
                  <input
                    id="late-cap"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.financial.lateFeeCapPercentage}
                    onChange={(event) => updateFinancial('lateFeeCapPercentage', event.target.value)}
                    className={getInputClassName(errors.lateFeeCapPercentage)}
                  />
                </div>
              </div>
              {(errors.lateFeePercentage || errors.lateFeeFixedAmount || errors.lateFeeGraceDays || errors.lateFeeCapPercentage) ? (
                <p className="mt-3 text-xs font-medium text-red-600">
                  {errors.lateFeePercentage || errors.lateFeeFixedAmount || errors.lateFeeGraceDays || errors.lateFeeCapPercentage}
                </p>
              ) : null}
            </Card>
          </section>

          <section className="grid items-start gap-4 sm:gap-6 xl:grid-cols-2">
            <Card title="Kebijakan Refund" description="Persentase pengembalian berdasarkan waktu pembatalan sebelum jadwal/paket berjalan.">
              <Toggle
                checked={settings.financial.refundEnabled}
                onChange={(value) => updateFinancial('refundEnabled', value)}
                label="Izinkan Pengajuan Refund"
                description="Refund tetap memerlukan verifikasi admin dan perhitungan sesi yang belum digunakan."
              />

              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                {[
                  ['refundOver7DaysPercentage', 'Batal > 7 Hari (%)'],
                  ['refund3To7DaysPercentage', 'Batal 3-7 Hari (%)'],
                  ['refundUnder3DaysPercentage', 'Batal < 3 Hari (%)'],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label htmlFor={field} className="text-sm font-bold text-slate-700">{label}</label>
                    <input
                      id={field}
                      type="number"
                      min="0"
                      max="100"
                      value={settings.financial[field]}
                      onChange={(event) => updateFinancial(field, event.target.value)}
                      className={getInputClassName(errors[field])}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="refund-admin-fee" className="text-sm font-bold text-slate-700">Biaya Admin Refund (%)</label>
                  <input
                    id="refund-admin-fee"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.financial.refundAdminFeePercentage}
                    onChange={(event) => updateFinancial('refundAdminFeePercentage', event.target.value)}
                    className={getInputClassName(errors.refundAdminFeePercentage)}
                  />
                </div>
                <div>
                  <label htmlFor="refund-days" className="text-sm font-bold text-slate-700">Target Proses (hari kerja)</label>
                  <input
                    id="refund-days"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.financial.refundProcessingDays}
                    onChange={(event) => updateFinancial('refundProcessingDays', event.target.value)}
                    className={getInputClassName(errors.refundProcessingDays)}
                  />
                </div>
              </div>
              {(errors.refundOver7DaysPercentage || errors.refund3To7DaysPercentage || errors.refundUnder3DaysPercentage || errors.refundAdminFeePercentage || errors.refundProcessingDays) ? (
                <p className="mt-3 text-xs font-medium text-red-600">
                  {errors.refundOver7DaysPercentage || errors.refund3To7DaysPercentage || errors.refundUnder3DaysPercentage || errors.refundAdminFeePercentage || errors.refundProcessingDays}
                </p>
              ) : null}

              <div className="mt-5">
                <label htmlFor="refund-notes" className="text-sm font-bold text-slate-700">Catatan Kebijakan Refund</label>
                <textarea
                  id="refund-notes"
                  value={settings.financial.refundPolicyNotes}
                  onChange={(event) => updateFinancial('refundPolicyNotes', event.target.value)}
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-relaxed outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10"
                />
              </div>
            </Card>

            <Card title="Kalkulator Preview Tagihan" description="Hitung dampak kebijakan pajak dan denda dari nominal invoice yang Anda masukkan.">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0066CC]">
                  <Calculator className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-extrabold text-slate-900">Kalkulator Aturan</p>
                  <p className="text-sm text-slate-500">Nilai berubah mengikuti pengaturan pada halaman ini.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="sample-invoice" className="text-sm font-bold text-slate-700">Nominal Invoice (Rp)</label>
                  <input
                    id="sample-invoice"
                    type="number"
                    min="0"
                    value={sampleInvoiceAmount}
                    onChange={(event) => setSampleInvoiceAmount(event.target.value)}
                    className={getInputClassName(false)}
                  />
                </div>
                <div>
                  <label htmlFor="sample-late-days" className="text-sm font-bold text-slate-700">Terlambat (hari)</label>
                  <input
                    id="sample-late-days"
                    type="number"
                    min="0"
                    value={sampleLateDays}
                    onChange={(event) => setSampleLateDays(event.target.value)}
                    className={getInputClassName(false)}
                  />
                </div>
              </div>

              <dl className="mt-6 space-y-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Invoice dasar</dt>
                  <dd className="font-bold text-slate-900">{formatRupiah(Number(sampleInvoiceAmount) || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Pajak {settings.financial.taxEnabled ? `${settings.financial.taxPercentage}%` : '(nonaktif)'}</dt>
                  <dd className="font-bold text-slate-900">
                    {settings.financial.taxEnabled
                      ? settings.financial.pricesIncludeTax
                        ? 'Sudah termasuk harga'
                        : formatRupiah((Number(sampleInvoiceAmount) || 0) * (Number(settings.financial.taxPercentage) || 0) / 100)
                      : 'Rp 0'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Hari kena denda</dt>
                  <dd className="font-bold text-slate-900">{lateFeeSimulation.billableLateDays} hari</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Estimasi denda</dt>
                  <dd className="font-bold text-red-600">{formatRupiah(lateFeeSimulation.fee)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base">
                  <dt className="font-extrabold text-slate-900">Total sebelum pajak tambahan</dt>
                  <dd className="font-extrabold text-[#0066CC]">{formatRupiah(lateFeeSimulation.total)}</dd>
                </div>
              </dl>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ['> 7 hari', settings.financial.refundOver7DaysPercentage],
                  ['3-7 hari', settings.financial.refund3To7DaysPercentage],
                  ['< 3 hari', settings.financial.refundUnder3DaysPercentage],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Refund {label}</p>
                    <p className="mt-1 text-xl font-extrabold text-[#0066CC]">{value}%</p>
                    <p className="text-xs text-slate-500">
                      dari nominal invoice preview: {formatRupiah((Number(sampleInvoiceAmount) || 0) * (Number(value) || 0) / 100)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      ) : activeTab === 'notifications' ? (
        /* --------------------------- NOTIFICATIONS --------------------------- */
        <div className="space-y-4 sm:space-y-6">
          <Card title="Identitas Pengirim" description="Nama dan alamat pengirim default untuk WhatsApp serta email.">
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label htmlFor="sender-name" className="text-sm font-bold text-slate-700">Nama Pengirim</label>
                <input
                  id="sender-name"
                  value={settings.notifications.senderName}
                  onChange={(event) => updateNotifications('senderName', event.target.value)}
                  className={getInputClassName(false)}
                />
              </div>
              <div>
                <label htmlFor="sender-whatsapp" className="text-sm font-bold text-slate-700">Nomor WhatsApp</label>
                <input
                  id="sender-whatsapp"
                  value={settings.notifications.whatsappNumber}
                  onChange={(event) => updateNotifications('whatsappNumber', event.target.value)}
                  className={getInputClassName(false)}
                />
              </div>
              <div>
                <label htmlFor="sender-email" className="text-sm font-bold text-slate-700">Email Pengirim</label>
                <input
                  id="sender-email"
                  type="email"
                  value={settings.notifications.emailFrom}
                  onChange={(event) => updateNotifications('emailFrom', event.target.value)}
                  className={getInputClassName(false)}
                />
              </div>
            </div>
            {errors.template ? <p className="mt-4 text-xs font-medium text-red-600">{errors.template}</p> : null}
          </Card>

          <section className="grid items-start gap-4 sm:gap-6 xl:grid-cols-3">
            {/* Template List */}
            <Card
              title="Template Pesan"
              description={`${settings.notifications.templates.length} template tersedia.`}
              contentClassName="p-0 sm:p-0"
            >
              <div className="flex gap-2 border-b border-slate-100 p-4">
                <Button size="sm" className="flex-1" onClick={() => createTemplate('whatsapp')} leftIcon={<MessageCircle className="h-4 w-4" />}>
                  WA Baru
                </Button>
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => createTemplate('email')} leftIcon={<Mail className="h-4 w-4" />}>
                  Email Baru
                </Button>
              </div>

              <div className="divide-y divide-slate-100">
                {settings.notifications.templates.map((template) => {
                  const isSelected = selectedTemplate?.id === template.id;
                  const ChannelIcon = template.channel === 'email' ? Mail : MessageCircle;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(template.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        'block w-full px-4 py-4 text-left transition-colors sm:px-5',
                        isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1',
                          template.channel === 'email'
                            ? 'bg-indigo-50 text-indigo-600 ring-indigo-100'
                            : 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                        )}>
                          <ChannelIcon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-extrabold text-slate-900">{template.name}</span>
                          <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-400">{template.eventKey}</span>
                          <span className="mt-2 flex flex-wrap gap-1.5">
                            <Badge status={template.isActive ? 'active' : 'inactive'} size="sm">
                              {template.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-500">
                              {template.channel === 'email' ? 'Email' : 'WhatsApp'}
                            </span>
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Template Editor & Preview */}
            {selectedTemplate ? (
              <div className="space-y-4 sm:space-y-6 xl:col-span-2">
                <Card
                  title="Editor Template"
                  description="Klik placeholder untuk menyisipkannya pada posisi kursor subject atau isi pesan."
                  action={
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => duplicateTemplate(selectedTemplate)} leftIcon={<Copy className="h-4 w-4" />}>
                        Duplikat
                      </Button>
                      <button
                        type="button"
                        onClick={() => deleteTemplate(selectedTemplate)}
                        aria-label={`Hapus template ${selectedTemplate.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  }
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="template-name" className="text-sm font-bold text-slate-700">Nama Template</label>
                      <input
                        id="template-name"
                        value={selectedTemplate.name}
                        onChange={(event) => updateTemplate(selectedTemplate.id, { name: event.target.value })}
                        className={getInputClassName(false)}
                      />
                    </div>
                    <div>
                      <label htmlFor="template-event" className="text-sm font-bold text-slate-700">Event Key</label>
                      <input
                        id="template-event"
                        value={selectedTemplate.eventKey}
                        onChange={(event) => updateTemplate(selectedTemplate.id, { eventKey: event.target.value.toUpperCase() })}
                        className={getInputClassName(false, 'font-mono uppercase')}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                      <p className="text-sm font-bold text-slate-700">Channel</p>
                      <div className="mt-2 grid max-w-sm grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                        {[
                          ['whatsapp', 'WhatsApp', MessageCircle],
                          ['email', 'Email', Mail],
                        ].map(([value, label, Icon]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              updateTemplate(selectedTemplate.id, { channel: value });
                              setActiveTemplateField('message');
                            }}
                            aria-pressed={selectedTemplate.channel === value}
                            className={cn(
                              'inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors',
                              selectedTemplate.channel === value
                                ? 'bg-[#0066CC] text-white'
                                : 'text-slate-500 hover:bg-white hover:text-[#0066CC]'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Toggle
                      checked={selectedTemplate.isActive}
                      onChange={(value) => updateTemplate(selectedTemplate.id, { isActive: value })}
                      label="Template Aktif"
                    />
                  </div>

                  {selectedTemplate.channel === 'email' ? (
                    <div className="mt-5">
                      <label htmlFor="template-subject" className="text-sm font-bold text-slate-700">
                        Subject Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={subjectInputRef}
                        id="template-subject"
                        value={selectedTemplate.subject}
                        onFocus={() => setActiveTemplateField('subject')}
                        onChange={(event) => updateTemplate(selectedTemplate.id, { subject: event.target.value })}
                        placeholder="Contoh: Pengingat untuk {nama_siswa}"
                        className={getInputClassName(false)}
                      />
                    </div>
                  ) : null}

                  <div className="mt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor="template-message" className="text-sm font-bold text-slate-700">
                        Isi Pesan <span className="text-red-500">*</span>
                      </label>
                      <span className="text-xs text-slate-400">
                        {selectedTemplate.message.length} karakter • {selectedTemplatePlaceholders.length} placeholder
                      </span>
                    </div>
                    <textarea
                      ref={messageTextareaRef}
                      id="template-message"
                      value={selectedTemplate.message}
                      onFocus={() => setActiveTemplateField('message')}
                      onChange={(event) => updateTemplate(selectedTemplate.id, { message: event.target.value })}
                      rows={11}
                      className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 font-mono text-sm leading-relaxed outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10"
                      placeholder="Halo {nama_orang_tua}, sisa pertemuan {nama_siswa} adalah {sisa_pertemuan} sesi..."
                    />
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-bold text-slate-700">Sisipkan Placeholder</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {PLACEHOLDERS.map((placeholder) => (
                        <button
                          key={placeholder.token}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => insertPlaceholder(placeholder.token)}
                          className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-mono text-xs font-bold text-[#0066CC] transition-colors hover:border-[#0066CC] hover:bg-blue-100"
                          title={placeholder.label}
                        >
                          {'{'}{placeholder.token}{'}'}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Placeholder akan masuk ke field yang terakhir difokuskan: {activeTemplateField === 'subject' ? 'Subject Email' : 'Isi Pesan'}.
                    </p>
                    {unknownPlaceholders.length ? (
                      <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/10">
                        Placeholder tidak dikenal: {unknownPlaceholders.map((token) => `{${token}}`).join(', ')}. Placeholder tersebut tidak akan diganti pada preview.
                      </p>
                    ) : null}
                  </div>
                </Card>

                <Card
                  title="Live Preview"
                  description="Placeholder diganti menggunakan record database terbaru yang relevan untuk pratinjau."
                  action={<span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0066CC]"><Eye className="h-4 w-4" /> Preview</span>}
                >
                  {selectedTemplate.channel === 'email' ? (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200">
                      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                        <p className="text-xs text-slate-400">Dari: {settings.notifications.senderName} &lt;{settings.notifications.emailFrom}&gt;</p>
                        <h3 className="mt-1 font-extrabold text-slate-900">
                          {renderTemplatePreview(selectedTemplate.subject, settings.general.businessName, templatePreviewContext) || '(Tanpa subject)'}
                        </h3>
                      </div>
                      <div className="whitespace-pre-wrap px-5 py-5 text-sm leading-relaxed text-slate-700">
                        {renderTemplatePreview(selectedTemplate.message, settings.general.businessName, templatePreviewContext)}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[24px] bg-[#ECE5DD] p-4 sm:p-6">
                      <div className="max-w-xl rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                          {renderTemplatePreview(selectedTemplate.message, settings.general.businessName, templatePreviewContext)}
                        </p>
                        <p className="mt-2 text-right text-[11px] text-slate-400">09.00 ✓✓</p>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Dari {settings.notifications.senderName} • {settings.notifications.whatsappNumber}
                      </p>
                    </div>
                  )}

                  <details className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                    <summary className="cursor-pointer text-sm font-bold text-slate-700">Lihat data database untuk preview placeholder</summary>
                    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      {PLACEHOLDERS.map((placeholder) => (
                        <div key={placeholder.token} className="flex justify-between gap-3 rounded-lg bg-white px-3 py-2">
                          <dt className="font-mono font-bold text-[#0066CC]">{`{${placeholder.token}}`}</dt>
                          <dd className="truncate text-right text-slate-500">
                            {templatePreviewContext[placeholder.token] ?? (placeholder.token === 'nama_bisnis' ? settings.general.businessName : '-')}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                </Card>
              </div>
            ) : null}
          </section>
        </div>
      ) : (
        /* ------------------------------- BACKUP ------------------------------ */
        <div className="space-y-4 sm:space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Database,
                label: 'Database Target',
                value: 'MySQL',
                description: 'Sesuai datasource Prisma project',
              },
              {
                icon: History,
                label: 'Backup Terakhir',
                value: lastBackup ? formatDateTime(lastBackup.createdAt) : 'Belum Ada',
                description: lastBackup ? lastBackup.fileName : 'Buat backup database pertama Anda',
              },
              {
                icon: HardDrive,
                label: 'Histori Database',
                value: backupHistory.length,
                description: 'Snapshot JSON tersimpan di tabel database_backups',
              },
              {
                icon: Check,
                label: 'Status Export',
                value: 'Siap',
                description: 'Export JSON database melalui Prisma aktif',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} padded hover>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0066CC] text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                      <p className="truncate text-lg font-extrabold leading-tight text-slate-900" title={String(item.value)}>{item.value}</p>
                    </div>
                  </div>
                  <p className="mt-3 truncate text-sm text-slate-500" title={item.description}>{item.description}</p>
                </Card>
              );
            })}
          </section>

          <section className="grid items-start gap-4 sm:gap-6 xl:grid-cols-2">
            <Card title="Download Backup Database (.json)" description="File berisi snapshot record aktual dari MySQL melalui Prisma.">
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Snapshot JSON ini berisi record database aktual, termasuk data sensitif dan hash password pengguna.
                  Simpan file secara terenkripsi. Untuk backup production lengkap beserta DDL/schema, tetap gunakan mysqldump atau snapshot provider dan uji proses restore secara berkala.
                </p>
              </div>

              <div className="mt-5">
                <p className="text-sm font-bold text-slate-900">Snapshot mencakup record tabel utama:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['users', 'students', 'schedules', 'slots', 'coach_assignments', 'subscriptions', 'transactions', 'promotions', 'articles', 'leads', 'system_settings'].map((table) => (
                    <span key={table} className="rounded-full bg-blue-50 px-3 py-1.5 font-mono text-xs font-bold text-[#0066CC]">
                      {table}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Button size="lg" onClick={handleCreateDatabaseBackup} disabled={isCreatingBackup} leftIcon={<Download className="h-5 w-5" />}>
                  {isCreatingBackup ? 'Membuat Backup...' : 'Buat & Download Backup'}
                </Button>
                <Button size="lg" variant="secondary" onClick={handleDownloadSettingsJson} leftIcon={<FileJson className="h-5 w-5" />}>
                  Export Settings JSON
                </Button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Backup dibuat dari database pada saat tombol ditekan. Simpan pengaturan terlebih dahulu bila masih ada perubahan.
              </p>
            </Card>

            <Card
              title="Histori Backup Database"
              description="Riwayat snapshot JSON yang tersimpan di tabel database_backups."
              contentClassName="p-0 sm:p-0"
            >
              {backupHistory.length ? (
                <ul className="divide-y divide-slate-100">
                  {backupHistory.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0066CC]">
                        <Database className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs font-bold text-slate-900 sm:text-sm">{item.fileName}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatDateTime(item.createdAt)} • {formatFileSize(item.sizeBytes)}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleDownloadBackup(item)} disabled={downloadingBackupId === item.id} leftIcon={<Download className="h-4 w-4" />}>
                        {downloadingBackupId === item.id ? "Mengunduh..." : "Download"}
                      </Button>
                      <Badge status="active" size="sm">JSON</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-6 py-12 text-center">
                  <p className="font-extrabold text-slate-900">Belum ada backup</p>
                  <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
                    Klik Buat & Download Backup untuk membuat snapshot dan mencatatnya di database.
                  </p>
                </div>
              )}
            </Card>
          </section>

          <Card title="Rekomendasi Backup Production" description="Langkah yang perlu diterapkan setelah database MySQL dan server production aktif.">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['Otomatis & Terjadwal', 'Jalankan mysqldump atau snapshot provider setiap hari dengan retensi minimal 7-30 hari.'],
                ['Enkripsi & Off-site', 'Simpan salinan terenkripsi di object storage terpisah dari server aplikasi.'],
                ['Uji Restore', 'Secara berkala pulihkan backup ke database staging untuk memastikan file benar-benar dapat digunakan.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl bg-blue-50 px-4 py-4">
                  <p className="font-extrabold text-slate-900">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Sticky Save Bar */}
      {isLoaded ? (
        <div className="fixed inset-x-4 bottom-4 z-30 sm:inset-x-6 lg:left-[304px] lg:right-6">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-2xl shadow-slate-950/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-2 text-sm">
              <span className={cn('h-2.5 w-2.5 rounded-full', hasUnsavedChanges ? 'bg-amber-500' : 'bg-emerald-500')} />
              <p className="font-semibold text-slate-700">
                {hasUnsavedChanges
                  ? 'Ada perubahan yang belum disimpan ke database.'
                  : 'Semua pengaturan sudah tersimpan di database.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleDiscardChanges} disabled={!hasUnsavedChanges}>
                Batalkan Perubahan
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSavingSettings || !hasUnsavedChanges} leftIcon={<Save className="h-4 w-4" />}>
                Simpan Pengaturan
              </Button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
