'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
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
  RotateCcw,
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
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

/* -------------------------------------------------------------------------- */
/* CONSTANTS & DEFAULT SETTINGS                                               */
/* -------------------------------------------------------------------------- */

const SETTINGS_STORAGE_KEY = 'aaa-sport-academy-settings-v1';
const BACKUP_HISTORY_STORAGE_KEY = 'aaa-sport-academy-backup-history-v1';

const TAB_OPTIONS = [
  { value: 'profile', label: 'Profil & Keamanan', icon: CircleUserRound },
  { value: 'general', label: 'General', icon: SlidersHorizontal },
  { value: 'financial', label: 'Financial Rules', icon: Landmark },
  { value: 'notifications', label: 'Notification Templates', icon: BellRing },
  { value: 'backup', label: 'Backup Database', icon: HardDrive },
];

const TIMEZONE_OPTIONS = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'];

const PLACEHOLDERS = [
  { token: 'nama_siswa', label: 'Nama Siswa', sample: 'Aira' },
  { token: 'nama_orang_tua', label: 'Nama Orang Tua', sample: 'Ibu Ratna' },
  { token: 'sisa_pertemuan', label: 'Sisa Pertemuan', sample: '3' },
  { token: 'nama_paket', label: 'Nama Paket', sample: 'AAA Bulanan' },
  { token: 'tanggal_jatuh_tempo', label: 'Tanggal Jatuh Tempo', sample: '5 November 2026' },
  { token: 'nominal_tagihan', label: 'Nominal Tagihan', sample: 'Rp 550.000' },
  { token: 'jadwal_kelas', label: 'Jadwal Kelas', sample: 'Sabtu, 08.00-09.00 WIB' },
  { token: 'nama_kolam', label: 'Nama Kolam', sample: 'Kolam Tirta Segara' },
  { token: 'nama_pelatih', label: 'Nama Pelatih', sample: 'Coach Andi Pratama' },
  { token: 'kode_promo', label: 'Kode Promo', sample: 'FLASHAAA25' },
  { token: 'nama_bisnis', label: 'Nama Bisnis', sample: 'AAA Sport Academy' },
  { token: 'nomor_invoice', label: 'Nomor Invoice', sample: 'INV-20261028-0001' },
];

const DEFAULT_TEMPLATES = [
  {
    id: 'payment-reminder',
    name: 'Pengingat Pembayaran',
    channel: 'whatsapp',
    eventKey: 'PAYMENT_REMINDER',
    subject: '',
    message:
      'Halo {nama_orang_tua}, kami dari {nama_bisnis}. Paket {nama_paket} untuk {nama_siswa} akan jatuh tempo pada {tanggal_jatuh_tempo}. Sisa pertemuan saat ini {sisa_pertemuan} sesi dengan tagihan {nominal_tagihan}. Mohon konfirmasi setelah pembayaran dilakukan. Terima kasih.',
    isActive: true,
  },
  {
    id: 'package-expiring',
    name: 'Paket Mendekati Habis',
    channel: 'whatsapp',
    eventKey: 'PACKAGE_EXPIRING',
    subject: '',
    message:
      'Halo {nama_orang_tua}, sisa pertemuan {nama_siswa} pada paket {nama_paket} tinggal {sisa_pertemuan} sesi. Agar jadwal latihan tidak terputus, Bapak/Ibu dapat melakukan perpanjangan sebelum {tanggal_jatuh_tempo}. Gunakan kode {kode_promo} jika promo masih tersedia.',
    isActive: true,
  },
  {
    id: 'class-reminder',
    name: 'Pengingat Jadwal Kelas',
    channel: 'whatsapp',
    eventKey: 'CLASS_REMINDER',
    subject: '',
    message:
      'Halo {nama_orang_tua}, mengingatkan kelas {nama_siswa} bersama {nama_pelatih} dijadwalkan pada {jadwal_kelas} di {nama_kolam}. Mohon hadir 15 menit lebih awal dan membawa perlengkapan renang. Sampai bertemu di kolam!',
    isActive: true,
  },
  {
    id: 'registration-confirmation',
    name: 'Konfirmasi Pendaftaran',
    channel: 'email',
    eventKey: 'REGISTRATION_CONFIRMATION',
    subject: 'Pendaftaran {nama_siswa} di {nama_bisnis} Berhasil',
    message:
      'Halo {nama_orang_tua},\n\nTerima kasih telah mendaftarkan {nama_siswa} di {nama_bisnis}. Paket yang dipilih adalah {nama_paket} dengan total {sisa_pertemuan} pertemuan awal.\n\nTim kami akan menghubungi Bapak/Ibu untuk memastikan jadwal kelas dan lokasi kolam. Simpan email ini sebagai konfirmasi awal pendaftaran.\n\nSalam hangat,\nTim {nama_bisnis}',
    isActive: true,
  },
  {
    id: 'payment-receipt',
    name: 'Kwitansi Pembayaran',
    channel: 'email',
    eventKey: 'PAYMENT_RECEIPT',
    subject: 'Kwitansi {nomor_invoice} - Pembayaran {nama_siswa}',
    message:
      'Halo {nama_orang_tua},\n\nPembayaran untuk {nama_siswa} sebesar {nominal_tagihan} telah kami terima. Nomor invoice Bapak/Ibu adalah {nomor_invoice}.\n\nPaket aktif: {nama_paket}\nSisa pertemuan: {sisa_pertemuan} sesi\n\nTerima kasih atas kepercayaan kepada {nama_bisnis}.',
    isActive: true,
  },
];

const DEFAULT_SETTINGS = {
  version: 1,
  general: {
    businessName: 'AAA Sport Academy',
    legalName: 'AAA Sport Academy',
    tagline: 'Berani di Air, Tumbuh Percaya Diri, Berprestasi di Kolam',
    email: 'halo@aaasport.academy',
    phone: '081234567890',
    website: 'https://aaasport.academy',
    address: 'Kolam Tirta Segara & Aqua Center, Jakarta, Indonesia',
    timezone: 'Asia/Jakarta',
    logoDataUrl: '',
    logoFileName: '',
    operatingHours: [
      { day: 'Senin', isOpen: true, openTime: '08:00', closeTime: '19:00' },
      { day: 'Selasa', isOpen: true, openTime: '08:00', closeTime: '19:00' },
      { day: 'Rabu', isOpen: true, openTime: '08:00', closeTime: '19:00' },
      { day: 'Kamis', isOpen: true, openTime: '08:00', closeTime: '19:00' },
      { day: 'Jumat', isOpen: true, openTime: '08:00', closeTime: '19:00' },
      { day: 'Sabtu', isOpen: true, openTime: '07:00', closeTime: '18:00' },
      { day: 'Minggu', isOpen: true, openTime: '07:00', closeTime: '17:00' },
    ],
  },
  financial: {
    taxEnabled: false,
    taxName: 'PPN',
    taxPercentage: 0,
    pricesIncludeTax: true,
    lateFeeEnabled: true,
    lateFeeType: 'percentage',
    lateFeePercentage: 2,
    lateFeePeriod: 'month',
    lateFeeFixedAmount: 25000,
    lateFeeGraceDays: 3,
    lateFeeCapPercentage: 10,
    refundEnabled: true,
    refundOver7DaysPercentage: 80,
    refund3To7DaysPercentage: 50,
    refundUnder3DaysPercentage: 0,
    refundAdminFeePercentage: 5,
    refundProcessingDays: 7,
    refundPolicyNotes:
      'Refund dihitung dari nilai paket yang belum digunakan. Pengajuan diproses setelah verifikasi pembayaran dan sisa pertemuan oleh admin.',
  },
  notifications: {
    senderName: 'AAA Sport Academy',
    whatsappNumber: '081234567890',
    emailFrom: 'halo@aaasport.academy',
    templates: DEFAULT_TEMPLATES,
  },
};

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeSettings(storedSettings) {
  const defaults = deepClone(DEFAULT_SETTINGS);
  if (!storedSettings || typeof storedSettings !== 'object') return defaults;

  const merged = {
    ...defaults,
    ...storedSettings,
    general: {
      ...defaults.general,
      ...(storedSettings.general ?? {}),
    },
    financial: {
      ...defaults.financial,
      ...(storedSettings.financial ?? {}),
    },
    notifications: {
      ...defaults.notifications,
      ...(storedSettings.notifications ?? {}),
    },
  };

  const storedHours = storedSettings.general?.operatingHours;
  if (Array.isArray(storedHours)) {
    merged.general.operatingHours = defaults.general.operatingHours.map((defaultDay) => {
      const storedDay = storedHours.find((item) => item.day === defaultDay.day);
      return storedDay ? { ...defaultDay, ...storedDay } : defaultDay;
    });
  }

  const storedTemplates = storedSettings.notifications?.templates;
  if (Array.isArray(storedTemplates) && storedTemplates.length) {
    merged.notifications.templates = storedTemplates.map((template, index) => ({
      id: template.id || `custom-template-${index + 1}`,
      name: template.name || 'Template Tanpa Nama',
      channel: template.channel === 'email' ? 'email' : 'whatsapp',
      eventKey: template.eventKey || 'CUSTOM',
      subject: template.subject || '',
      message: template.message || '',
      isActive: template.isActive !== false,
    }));
  }

  return merged;
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

function renderTemplatePreview(text, businessName) {
  let rendered = String(text ?? '');

  PLACEHOLDERS.forEach(({ token, sample }) => {
    const value = token === 'nama_bisnis' ? businessName || sample : sample;
    rendered = rendered.replaceAll(`{${token}}`, value);
  });

  return rendered;
}

function escapeSqlString(value) {
  return String(value ?? '').replaceAll('\\', '\\\\').replaceAll("'", "''");
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
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

function SettingsSkeleton() {
  return (
    <div role="status" aria-label="Memuat pengaturan" className="space-y-4 sm:space-y-6">
      <span className="sr-only">Memuat pengaturan dari localStorage...</span>
      <div className="h-14 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card padded className="xl:col-span-2">
          <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-11 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        </Card>
        <Card padded>
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        </Card>
      </div>
    </div>
  );
}

function generateDummySql(settings) {
  const generatedAt = new Date().toISOString();
  const settingsJson = escapeSqlString(JSON.stringify(settings));

  return `-- ============================================================================
-- AAA SPORT ACADEMY - DUMMY DATABASE BACKUP
-- Generated at : ${generatedAt}
-- Source       : Dashboard Settings (localStorage simulation)
-- Database     : MySQL / Prisma
--
-- PERINGATAN:
-- File ini adalah backup DUMMY untuk simulasi Phase 1.
-- File ini tidak berisi dump database production yang lengkap.
-- Untuk production gunakan mysqldump / fitur backup provider database,
-- simpan hasil backup terenkripsi di lokasi terpisah, lalu uji proses restore.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS \`aaa_sport_academy\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`aaa_sport_academy\`;

-- ----------------------------------------------------------------------------
-- Application settings snapshot
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`app_settings_backup\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`version\` INT NOT NULL DEFAULT 1,
  \`settings_json\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`app_settings_backup\` (\`id\`, \`version\`, \`settings_json\`)
VALUES ('local-settings-v1', 1, '${settingsJson}')
ON DUPLICATE KEY UPDATE
  \`settings_json\` = VALUES(\`settings_json\`);

-- ----------------------------------------------------------------------------
-- Ringkasan tabel utama pada schema Prisma saat ini
-- Nilai jumlah baris di bawah hanya contoh struktur metadata dummy.
-- ----------------------------------------------------------------------------
-- students           : data siswa aktif/nonaktif
-- schedules          : template jadwal mingguan
-- slots              : occurrence jadwal pada tanggal tertentu
-- coach_assignments  : penugasan pelatih
-- subscriptions      : paket/langganan siswa
-- transactions       : pembayaran dan invoice
-- promotions         : flash sale, referral, dan voucher
-- articles           : konten Content Hub
-- leads              : inbox pendaftaran dan follow-up

CREATE TABLE IF NOT EXISTS \`backup_metadata\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`backup_type\` VARCHAR(50) NOT NULL DEFAULT 'DUMMY',
  \`generated_at\` DATETIME(3) NOT NULL,
  \`business_name\` VARCHAR(160) NULL,
  \`notes\` TEXT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`backup_metadata\` (\`id\`, \`backup_type\`, \`generated_at\`, \`business_name\`, \`notes\`)
VALUES (
  'dummy-${Date.now()}',
  'DUMMY',
  '${generatedAt.slice(0, 19).replace('T', ' ')}',
  '${escapeSqlString(settings.general.businessName)}',
  'Generated from localStorage settings simulation. Not a production database dump.'
);

SET FOREIGN_KEY_CHECKS = 1;

-- End of AAA Sport Academy dummy backup
`;
}

/* -------------------------------------------------------------------------- */
/* MAIN CONTENT                                                               */
/* -------------------------------------------------------------------------- */

function SettingsPageContent() {
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
  const [currentRole, setCurrentRole] = useState(null);
  const [settings, setSettings] = useState(() => deepClone(DEFAULT_SETTINGS));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(DEFAULT_SETTINGS));
  const [isLoaded, setIsLoaded] = useState(false);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATES[0].id);
  const [activeTemplateField, setActiveTemplateField] = useState('message');
  const [backupHistory, setBackupHistory] = useState([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [sampleInvoiceAmount, setSampleInvoiceAmount] = useState('550000');
  const [sampleLateDays, setSampleLateDays] = useState('10');

  /* ------------------------------- Load state ------------------------------ */

  useEffect(() => {
    try {
      const storedSettingsRaw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      const loadedSettings = mergeSettings(
        storedSettingsRaw ? JSON.parse(storedSettingsRaw) : null
      );

      setSettings(loadedSettings);
      setSavedSnapshot(JSON.stringify(loadedSettings));
      setSelectedTemplateId(loadedSettings.notifications.templates[0]?.id ?? null);

      const storedHistoryRaw = window.localStorage.getItem(BACKUP_HISTORY_STORAGE_KEY);
      if (storedHistoryRaw) {
        const parsedHistory = JSON.parse(storedHistoryRaw);
        if (Array.isArray(parsedHistory)) setBackupHistory(parsedHistory);
      }
    } catch {
      setNotification({
        type: 'error',
        message: 'Data pengaturan lokal tidak dapat dibaca. Pengaturan default digunakan.',
      });
    } finally {
      window.setTimeout(() => setIsLoaded(true), 350);
    }
  }, []);

  useEffect(() => {
    if (TAB_OPTIONS.some((tab) => tab.value === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
      .then((response) => response.json().catch(() => null))
      .then((data) => {
        if (isMounted) setCurrentRole(data?.user?.role ?? 'STUDENT');
      })
      .catch(() => {
        if (isMounted) setCurrentRole('STUDENT');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (currentRole && currentRole !== 'SUPERADMIN' && activeTab !== 'profile') {
      setActiveTab('profile');
    }
  }, [currentRole, activeTab]);

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

  useEffect(() => {
    document.body.style.overflow = isResetModalOpen ? 'hidden' : '';

    function handleEscape(event) {
      if (event.key === 'Escape') setIsResetModalOpen(false);
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isResetModalOpen]);

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
        logo: 'Logo maksimal 1 MB karena simulasi ini disimpan di localStorage browser.',
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

  function resetSelectedTemplate() {
    if (!selectedTemplate) return;
    const defaultTemplate = DEFAULT_TEMPLATES.find((item) => item.id === selectedTemplate.id);

    if (!defaultTemplate) {
      setNotification({ type: 'error', message: 'Template kustom tidak memiliki versi default.' });
      return;
    }

    updateTemplate(selectedTemplate.id, { ...defaultTemplate });
    setNotification({ type: 'success', message: `Template "${defaultTemplate.name}" dikembalikan ke isi default.` });
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

  function persistSettings(settingsToSave, successMessage) {
    try {
      const normalized = normalizeSettings(settingsToSave);
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
      setSettings(normalized);
      setSavedSnapshot(JSON.stringify(normalized));
      setErrors({});
      setNotification({ type: 'success', message: successMessage });
      return true;
    } catch {
      setNotification({
        type: 'error',
        message:
          'Gagal menyimpan ke localStorage. Browser mungkin memblokir storage atau ukuran logo melebihi kuota.',
      });
      return false;
    }
  }

  function handleSave() {
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

    persistSettings(normalized, 'Pengaturan berhasil disimpan ke localStorage browser.');
  }

  function handleDiscardChanges() {
    try {
      const parsed = JSON.parse(savedSnapshot);
      setSettings(parsed);
      setSelectedTemplateId(parsed.notifications.templates[0]?.id ?? null);
      setErrors({});
      setNotification({ type: 'success', message: 'Perubahan yang belum disimpan berhasil dibatalkan.' });
    } catch {
      setNotification({ type: 'error', message: 'Snapshot pengaturan tersimpan tidak dapat dibaca.' });
    }
  }

  function handleResetDefaults() {
    const defaults = deepClone(DEFAULT_SETTINGS);
    const isPersisted = persistSettings(defaults, 'Pengaturan berhasil dikembalikan ke default dan disimpan.');
    if (isPersisted) {
      setSelectedTemplateId(defaults.notifications.templates[0].id);
      setIsResetModalOpen(false);
    }
  }

  /* --------------------------------- Backup -------------------------------- */

  function downloadBlob(content, fileName, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return blob;
  }

  function handleDownloadSqlBackup() {
    const now = new Date();
    const dateKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const fileName = `aaa-sport-academy-backup-${dateKey}.sql`;
    const sql = generateDummySql(normalizeSettings(settings));
    const blob = downloadBlob(sql, fileName, 'application/sql;charset=utf-8');

    const newHistoryItem = {
      id: Date.now(),
      fileName,
      createdAt: now.toISOString(),
      sizeBytes: blob.size,
      type: 'Dummy SQL',
    };

    const nextHistory = [newHistoryItem, ...backupHistory].slice(0, 10);
    setBackupHistory(nextHistory);

    try {
      window.localStorage.setItem(BACKUP_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    } catch {
      // Download tetap berhasil walau histori lokal gagal disimpan.
    }

    setNotification({
      type: 'success',
      message: `File dummy ${fileName} berhasil dibuat dan diunduh.`,
    });
  }

  function handleDownloadSettingsJson() {
    downloadBlob(
      JSON.stringify(normalizeSettings(settings), null, 2),
      'aaa-sport-academy-settings.json',
      'application/json;charset=utf-8'
    );
    setNotification({ type: 'success', message: 'File pengaturan JSON berhasil diunduh.' });
  }

  function clearBackupHistory() {
    setBackupHistory([]);
    try {
      window.localStorage.removeItem(BACKUP_HISTORY_STORAGE_KEY);
    } catch {
      // Abaikan kegagalan akses storage pada mode privat.
    }
    setNotification({ type: 'success', message: 'Histori backup lokal berhasil dibersihkan.' });
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
              {hasUnsavedChanges ? 'Ada perubahan belum disimpan' : isLoaded ? 'Tersimpan di localStorage' : 'Memuat localStorage'}
            </Badge>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Pengaturan Sistem
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Atur identitas bisnis, aturan keuangan, template WhatsApp/email, dan backup. Pada Phase 1
            seluruh pengaturan disimpan secara lokal di browser sebagai simulasi.
          </p>
        </div>

        {activeTab !== 'profile' && currentRole === 'SUPERADMIN' ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setIsResetModalOpen(true)} leftIcon={<RotateCcw className="h-4 w-4" />}>
              Reset Default
            </Button>
            <Button onClick={handleSave} disabled={!isLoaded || !hasUnsavedChanges} leftIcon={<Save className="h-4 w-4" />}>
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

      {!isLoaded ? (
        <SettingsSkeleton />
      ) : activeTab === 'profile' || currentRole !== 'SUPERADMIN' ? (
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
                    Gunakan logo persegi PNG/JPG/SVG. Karena simulasi localStorage, ukuran file dibatasi 1 MB.
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
                Pada simulasi ini, mengubah nama/logo di halaman Settings belum otomatis mengganti logo statis pada
                sidebar dan landing page. Setelah backend aktif, keduanya akan membaca konfigurasi yang sama.
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
              Aturan berikut masih simulasi lokal. Setelah API aktif, perhitungan pajak, denda, dan refund wajib
              dilakukan serta divalidasi di server agar tidak dapat dimanipulasi dari browser.
            </p>
          </div>

          <section className="grid items-start gap-4 sm:gap-6 xl:grid-cols-2">
            <Card title="Pajak Transaksi" description="Persentase pajak yang akan diterapkan pada invoice.">
              <Toggle
                checked={settings.financial.taxEnabled}
                onChange={(value) => updateFinancial('taxEnabled', value)}
                label="Aktifkan Pajak"
                description="Jika nonaktif, persentase tetap disimpan tetapi tidak diterapkan pada simulasi invoice."
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
                  description="Jika aktif, pajak dihitung sebagai bagian dari harga paket, bukan ditambahkan di checkout."
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

            <Card title="Simulasi Tagihan" description="Lihat dampak pajak dan denda terhadap contoh invoice.">
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
                      dari contoh invoice: {formatRupiah((Number(sampleInvoiceAmount) || 0) * (Number(value) || 0) / 100)}
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
                      <Button size="sm" variant="ghost" onClick={resetSelectedTemplate} leftIcon={<RotateCcw className="h-4 w-4" />}>
                        Reset
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
                  description="Placeholder diganti menggunakan data contoh Aira dengan sisa 3 pertemuan."
                  action={<span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0066CC]"><Eye className="h-4 w-4" /> Preview</span>}
                >
                  {selectedTemplate.channel === 'email' ? (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200">
                      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                        <p className="text-xs text-slate-400">Dari: {settings.notifications.senderName} &lt;{settings.notifications.emailFrom}&gt;</p>
                        <h3 className="mt-1 font-extrabold text-slate-900">
                          {renderTemplatePreview(selectedTemplate.subject, settings.general.businessName) || '(Tanpa subject)'}
                        </h3>
                      </div>
                      <div className="whitespace-pre-wrap px-5 py-5 text-sm leading-relaxed text-slate-700">
                        {renderTemplatePreview(selectedTemplate.message, settings.general.businessName)}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[24px] bg-[#ECE5DD] p-4 sm:p-6">
                      <div className="max-w-xl rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                          {renderTemplatePreview(selectedTemplate.message, settings.general.businessName)}
                        </p>
                        <p className="mt-2 text-right text-[11px] text-slate-400">09.00 ✓✓</p>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Dari {settings.notifications.senderName} • {settings.notifications.whatsappNumber}
                      </p>
                    </div>
                  )}

                  <details className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                    <summary className="cursor-pointer text-sm font-bold text-slate-700">Lihat data contoh placeholder</summary>
                    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      {PLACEHOLDERS.map((placeholder) => (
                        <div key={placeholder.token} className="flex justify-between gap-3 rounded-lg bg-white px-3 py-2">
                          <dt className="font-mono font-bold text-[#0066CC]">{`{${placeholder.token}}`}</dt>
                          <dd className="truncate text-right text-slate-500">
                            {placeholder.token === 'nama_bisnis' ? settings.general.businessName : placeholder.sample}
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
                description: lastBackup ? lastBackup.fileName : 'Buat backup dummy pertama Anda',
              },
              {
                icon: HardDrive,
                label: 'Histori Lokal',
                value: backupHistory.length,
                description: 'Maksimal 10 riwayat tersimpan di browser',
              },
              {
                icon: Check,
                label: 'Status Simulasi',
                value: 'Siap',
                description: 'Generator file .sql dummy aktif',
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
            <Card title="Download Backup Database (.sql Dummy)" description="File berisi snapshot pengaturan saat ini dan metadata struktur tabel utama.">
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Ini bukan dump database asli. Jangan gunakan file dummy ini sebagai satu-satunya backup production.
                  Backup asli harus dibuat dari server MySQL dan proses restore perlu diuji secara berkala.
                </p>
              </div>

              <div className="mt-5">
                <p className="text-sm font-bold text-slate-900">Snapshot mencakup referensi tabel:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['students', 'schedules', 'slots', 'coach_assignments', 'subscriptions', 'transactions', 'promotions', 'articles', 'leads'].map((table) => (
                    <span key={table} className="rounded-full bg-blue-50 px-3 py-1.5 font-mono text-xs font-bold text-[#0066CC]">
                      {table}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Button size="lg" onClick={handleDownloadSqlBackup} leftIcon={<Download className="h-5 w-5" />}>
                  Download .sql Dummy
                </Button>
                <Button size="lg" variant="secondary" onClick={handleDownloadSettingsJson} leftIcon={<FileJson className="h-5 w-5" />}>
                  Export Settings JSON
                </Button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Backup menggunakan nilai pengaturan yang sedang tampil, termasuk perubahan yang belum disimpan.
              </p>
            </Card>

            <Card
              title="Histori Backup Lokal"
              description="Riwayat file dummy yang dibuat dari browser ini."
              contentClassName="p-0 sm:p-0"
              footer={
                backupHistory.length ? (
                  <Button variant="ghost" size="sm" onClick={clearBackupHistory} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                    Bersihkan Histori
                  </Button>
                ) : null
              }
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
                      <Badge status="pending" size="sm">Dummy</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-6 py-12 text-center">
                  <p className="font-extrabold text-slate-900">Belum ada backup</p>
                  <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
                    Klik Download .sql Dummy untuk membuat file dan mencatatnya di histori lokal.
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
                  ? 'Ada perubahan yang belum disimpan ke localStorage.'
                  : 'Semua pengaturan sudah tersimpan di localStorage.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleDiscardChanges} disabled={!hasUnsavedChanges}>
                Batalkan Perubahan
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!hasUnsavedChanges} leftIcon={<Save className="h-4 w-4" />}>
                Simpan Pengaturan
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reset Confirmation */}
      {isResetModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Batalkan reset pengaturan"
            onClick={() => setIsResetModalOpen(false)}
            className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-[2px]"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-settings-title"
            className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <RotateCcw className="h-6 w-6" />
            </span>
            <h3 id="reset-settings-title" className="mt-4 text-lg font-extrabold text-slate-900">
              Reset Semua Pengaturan?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Nama bisnis, logo, jam operasional, aturan keuangan, dan template notifikasi akan dikembalikan
              ke default, lalu langsung disimpan ke localStorage. Histori backup tidak ikut dihapus.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setIsResetModalOpen(false)}>Batal</Button>
              <Button variant="danger" onClick={handleResetDefaults} leftIcon={<RotateCcw className="h-4 w-4" />}>
                Ya, Reset Default
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE WRAPPER                                                               */
/* -------------------------------------------------------------------------- */

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsPageContent />
    </Suspense>
  );
}
