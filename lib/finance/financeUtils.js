import { SUBSCRIPTION_STATUS_LABELS } from './constants';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function pad2(value) {
  return String(value).padStart(2, '0');
}

export function getLocalTodayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toDateKey(value) {
  if (!value) return '';

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  }

  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : '';
}

export function parseDateKey(dateKey, hourUtc = 12) {
  return new Date(
    `${dateKey}T${pad2(hourUtc)}:00:00.000Z`
  );
}

export function dateKeyToDatabaseDate(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

/**
 * Tanggal transaksi disimpan pukul 02:00 UTC (09:00 WIB) agar tanggal lokal
 * Indonesia dan date-key UTC untuk laporan tetap sama.
 */
export function dateKeyToPaymentDateTime(dateKey) {
  return new Date(`${dateKey}T02:00:00.000Z`);
}

export function addDaysToDateKey(dateKey, amount) {
  if (!dateKey) return '';

  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function differenceInDays(fromDateKey, toDateKey) {
  if (!fromDateKey || !toDateKey) return null;

  const from = parseDateKey(fromDateKey).getTime();
  const to = parseDateKey(toDateKey).getTime();

  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;

  return Math.round((to - from) / DAY_IN_MILLISECONDS);
}

export function formatCurrency(value, { compact = false } = {}) {
  const amount = Number(value) || 0;

  if (compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateKey(dateKey, options = {}) {
  if (!dateKey) return '-';

  const normalized = toDateKey(dateKey);
  if (!normalized) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(parseDateKey(normalized));
}

export function formatTransactionDateTime(value) {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

export function getTransactionDateKey(transaction) {
  return toDateKey(
    transaction?.transactionDate ?? transaction?.paidAt ?? transaction?.createdAt
  );
}

export function getSubscriptionDueState(subscription, todayKey) {
  const status = subscription?.status ?? 'PENDING';
  const daysLeft = todayKey
    ? differenceInDays(todayKey, subscription?.expiresAt)
    : null;

  if (!todayKey) {
    return {
      key: status,
      label: SUBSCRIPTION_STATUS_LABELS[status] ?? status,
      tone: 'slate',
      daysLeft,
      description: 'Memuat tanggal hari ini...',
    };
  }

  if (status === 'PENDING') {
    return {
      key: 'PENDING',
      label: 'Menunggu Pembayaran',
      tone: 'amber',
      daysLeft,
      description: 'Aktif setelah pembayaran dikonfirmasi lunas.',
    };
  }

  if (status === 'CANCELLED') {
    return {
      key: 'INACTIVE',
      label: 'Dibatalkan',
      tone: 'slate',
      daysLeft,
      description: 'Langganan sudah dibatalkan.',
    };
  }

  if (status === 'COMPLETED') {
    return {
      key: 'INACTIVE',
      label: 'Selesai',
      tone: 'violet',
      daysLeft,
      description: 'Langganan sudah selesai.',
    };
  }

  if (status === 'EXPIRED' || (daysLeft !== null && daysLeft < 0)) {
    const overdueDays = daysLeft === null ? null : Math.abs(daysLeft);

    return {
      key: 'OVERDUE',
      label: 'Lewat Jatuh Tempo',
      tone: 'red',
      daysLeft,
      description:
        overdueDays === null
          ? 'Masa berlaku sudah berakhir.'
          : `Sudah lewat ${overdueDays} hari. Segera perpanjang.`,
    };
  }

  if (
    subscription?.totalSessions !== null &&
    subscription?.totalSessions !== undefined &&
    subscription?.remainingSessions === 0
  ) {
    return {
      key: 'INACTIVE',
      label: 'Selesai',
      tone: 'violet',
      daysLeft,
      description: 'Kuota sesi langganan sudah habis.',
    };
  }

  if (daysLeft !== null && daysLeft <= 7) {
    return {
      key: 'DUE_SOON',
      label: daysLeft === 0 ? 'Jatuh Tempo Hari Ini' : 'Segera Jatuh Tempo',
      tone: 'amber',
      daysLeft,
      description:
        daysLeft === 0
          ? 'Masa berlaku berakhir hari ini.'
          : `Sisa ${daysLeft} hari sebelum masa berlaku berakhir.`,
    };
  }

  return {
    key: 'ACTIVE',
    label: 'Aktif',
    tone: 'green',
    daysLeft,
    description:
      daysLeft === null
        ? 'Langganan aktif.'
        : `Sisa ${daysLeft} hari masa berlaku.`,
  };
}

export function buildWhatsAppReminderUrl(subscription) {
  const rawPhone = String(subscription?.student?.parentContact ?? '').replace(
    /\D/g,
    ''
  );

  if (!rawPhone) return null;

  let phone = rawPhone;
  if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;
  else if (phone.startsWith('8')) phone = `62${phone}`;

  const studentName = subscription?.student?.name ?? 'Siswa';
  const expiry = formatDateKey(subscription?.expiresAt, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const message = [
    `Halo, kami dari AAA Sport Academy.`,
    `Mengingatkan bahwa paket ${subscription?.packageName ?? 'langganan'} untuk ${studentName} berlaku sampai ${expiry}.`,
    'Silakan hubungi admin apabila ingin memperpanjang paket. Terima kasih.',
  ].join('\n');

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function escapeCsvCell(value) {
  const text = String(value ?? '');

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
