export const FINANCE_TABS = ['transactions', 'subscriptions', 'reports'];

export const FINANCE_TAB_OPTIONS = [
  { value: 'transactions', label: 'Transaksi' },
  { value: 'subscriptions', label: 'Paket & Langganan' },
  { value: 'reports', label: 'Laporan' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'TRANSFER', label: 'Transfer Bank' },
  { value: 'QRIS', label: 'QRIS' },
];

export const PAYMENT_METHOD_VALUES = PAYMENT_METHOD_OPTIONS.map(
  (item) => item.value
);

export const PAYMENT_METHOD_LABELS = Object.fromEntries(
  PAYMENT_METHOD_OPTIONS.map((item) => [item.value, item.label])
);

export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'SUBSCRIPTION_PAYMENT', label: 'Pembayaran Langganan' },
  { value: 'PRIVATE_VOUCHER', label: 'Voucher Private' },
  { value: 'REGISTRATION', label: 'Pendaftaran' },
  { value: 'OTHER', label: 'Lainnya' },
];

export const TRANSACTION_TYPE_VALUES = TRANSACTION_TYPE_OPTIONS.map(
  (item) => item.value
);

export const TRANSACTION_TYPE_LABELS = Object.fromEntries(
  TRANSACTION_TYPE_OPTIONS.map((item) => [item.value, item.label])
);

export const TRANSACTION_STATUS_OPTIONS = [
  { value: 'PAID', label: 'Lunas' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'FAILED', label: 'Gagal' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'REFUNDED', label: 'Refund' },
];

export const TRANSACTION_STATUS_VALUES = TRANSACTION_STATUS_OPTIONS.map(
  (item) => item.value
);

export const TRANSACTION_STATUS_LABELS = Object.fromEntries(
  TRANSACTION_STATUS_OPTIONS.map((item) => [item.value, item.label])
);

/**
 * Transisi status dibatasi agar perubahan status tidak membuat masa berlaku
 * langganan bertambah dua kali atau menghidupkan transaksi terminal.
 */
export const ALLOWED_TRANSACTION_STATUS_TRANSITIONS = {
  PENDING: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
  PAID: ['PAID', 'REFUNDED'],
  FAILED: ['FAILED'],
  CANCELLED: ['CANCELLED'],
  REFUNDED: ['REFUNDED'],
};

export function getAllowedTransactionStatuses(currentStatus) {
  const allowedValues =
    ALLOWED_TRANSACTION_STATUS_TRANSITIONS[currentStatus] ?? ['PAID', 'PENDING'];

  return TRANSACTION_STATUS_OPTIONS.filter((item) =>
    allowedValues.includes(item.value)
  );
}

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'PENDING', label: 'Menunggu Pembayaran' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'COMPLETED', label: 'Selesai' },
];

export const SUBSCRIPTION_STATUS_VALUES = SUBSCRIPTION_STATUS_OPTIONS.map(
  (item) => item.value
);

export const SUBSCRIPTION_STATUS_LABELS = Object.fromEntries(
  SUBSCRIPTION_STATUS_OPTIONS.map((item) => [item.value, item.label])
);

export const SUBSCRIPTION_DUE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Semua Kondisi' },
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'DUE_SOON', label: 'Segera Jatuh Tempo' },
  { value: 'OVERDUE', label: 'Lewat Jatuh Tempo' },
  { value: 'PENDING', label: 'Menunggu Pembayaran' },
  { value: 'INACTIVE', label: 'Nonaktif / Selesai' },
];

export const REPORT_PERIOD_OPTIONS = [
  { value: '7', label: '7 Hari Terakhir', days: 7 },
  { value: '30', label: '30 Hari Terakhir', days: 30 },
  { value: 'ALL', label: 'Semua Periode', days: null },
];

export const TRANSACTION_PERIOD_OPTIONS = [
  { value: 'ALL', label: 'Semua Tanggal' },
  { value: 'TODAY', label: 'Hari Ini' },
  { value: '7', label: '7 Hari Terakhir' },
  { value: '30', label: '30 Hari Terakhir' },
];

export const PACKAGE_DURATION_PRESETS = [
  { durationDays: 14, durationLabel: '2 Minggu' },
  { durationDays: 30, durationLabel: '1 Bulan' },
  { durationDays: 90, durationLabel: '3 Bulan' },
  { durationDays: 180, durationLabel: '6 Bulan' },
  { durationDays: 365, durationLabel: '1 Tahun' },
];
