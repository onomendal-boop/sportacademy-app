export const STAFF_POSITIONS = [
  'Manajer Akademi',
  'Admin Operasional',
  'Front Office',
  'Customer Service',
  'Finance',
  'Koordinator Jadwal',
  'Marketing',
  'Lifeguard',
];

export const STAFF_DEPARTMENTS = [
  'Manajemen',
  'Operasional',
  'Customer Service',
  'Finance',
  'Marketing',
];

export const STAFF_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'ON_LEAVE', label: 'Cuti' },
  { value: 'INACTIVE', label: 'Nonaktif' },
];

export const STAFF_STATUS_VALUES = STAFF_STATUS_OPTIONS.map((item) => item.value);

export const STAFF_STATUS_LABELS = Object.fromEntries(
  STAFF_STATUS_OPTIONS.map((item) => [item.value, item.label])
);

export const COACH_SPECIALIZATIONS = [
  'Pemula',
  'Menengah',
  'Atlet',
  'Private',
];

export const TRAINING_VENUE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
];

export const TRAINING_VENUE_STATUS_VALUES = TRAINING_VENUE_STATUS_OPTIONS.map(
  (item) => item.value
);

export const TRAINING_VENUE_STATUS_LABELS = Object.fromEntries(
  TRAINING_VENUE_STATUS_OPTIONS.map((item) => [item.value, item.label])
);

export const STUDENT_LEVEL_OPTIONS = [
  { value: 'AAA', label: 'AAA - Pemula' },
  { value: 'A3', label: 'A3 - Menengah' },
  { value: 'SWDC', label: 'SWDC - Atlet' },
];

export const STUDENT_LEVEL_VALUES = STUDENT_LEVEL_OPTIONS.map(
  (item) => item.value
);

export const STUDENT_LEVEL_LABELS = Object.fromEntries(
  STUDENT_LEVEL_OPTIONS.map((item) => [item.value, item.label])
);

export const STUDENT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'INACTIVE', label: 'Nonaktif' },
];

export const STUDENT_STATUS_VALUES = STUDENT_STATUS_OPTIONS.map(
  (item) => item.value
);

export const STUDENT_STATUS_LABELS = Object.fromEntries(
  STUDENT_STATUS_OPTIONS.map((item) => [item.value, item.label])
);
