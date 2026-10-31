export const DAY_OF_WEEK_VALUES = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const DAY_LABELS = {
  MONDAY: 'Senin',
  TUESDAY: 'Selasa',
  WEDNESDAY: 'Rabu',
  THURSDAY: 'Kamis',
  FRIDAY: 'Jumat',
  SATURDAY: 'Sabtu',
  SUNDAY: 'Minggu',
};

export const PROGRAM_VALUES = ['AAA', 'A3', 'SWDC', 'PRIVATE'];

export const PROGRAM_CONFIG = {
  AAA: {
    code: 'AAA',
    slug: 'aaa',
    name: 'Pemula',
    title: 'AAA - Pemula',
    description:
      'Jadwal pengenalan air, teknik dasar renang, dan keberanian anak di area dangkal.',
    typicalCapacity: 'Maks. 10 siswa/kelas',
  },
  A3: {
    code: 'A3',
    slug: 'a3',
    name: 'Menengah',
    title: 'A3 - Menengah',
    description:
      'Jadwal pengembangan teknik gaya, endurance, start, dan pembalikan untuk siswa menengah.',
    typicalCapacity: 'Maks. 12 siswa/kelas',
  },
  SWDC: {
    code: 'SWDC',
    slug: 'swdc',
    name: 'Atlet',
    title: 'SWDC - Atlet',
    description:
      'Jadwal latihan intensif dan persiapan kompetisi untuk kelompok atlet/prestasi.',
    typicalCapacity: 'Maks. 16 atlet/sesi',
  },
  PRIVATE: {
    code: 'PRIVATE',
    slug: 'private',
    name: 'Private',
    title: 'Private - 1-on-1',
    description:
      'Slot renang private satu siswa dengan satu pelatih. Slot kosong dapat langsung dibooking.',
    typicalCapacity: '1 siswa/slot',
  },
};

export const PROGRAM_OPTIONS = PROGRAM_VALUES.map((value) => ({
  value,
  label: PROGRAM_CONFIG[value].title,
}));

export const PROGRAM_BY_SLUG = Object.fromEntries(
  Object.values(PROGRAM_CONFIG).map((config) => [config.slug, config])
);

export const SCHEDULE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'INACTIVE', label: 'Nonaktif' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

export const SCHEDULE_STATUS_VALUES = SCHEDULE_STATUS_OPTIONS.map(
  (item) => item.value
);

export const SCHEDULE_STATUS_LABELS = Object.fromEntries(
  SCHEDULE_STATUS_OPTIONS.map((item) => [item.value, item.label])
);

export const ASSIGNMENT_ROLE_OPTIONS = [
  { value: 'LEAD', label: 'Pelatih Utama' },
  { value: 'ASSISTANT', label: 'Asisten Pelatih' },
  { value: 'SUBSTITUTE', label: 'Pelatih Pengganti' },
];

export const ASSIGNMENT_ROLE_VALUES = ASSIGNMENT_ROLE_OPTIONS.map(
  (item) => item.value
);

export const ASSIGNMENT_ROLE_LABELS = Object.fromEntries(
  ASSIGNMENT_ROLE_OPTIONS.map((item) => [item.value, item.label])
);

// ---------------------------------------------------------------------------
// Raport Siswa
// ---------------------------------------------------------------------------

// Level raport mengikuti enum StudentLevel (tanpa PRIVATE).
export const REPORT_LEVEL_VALUES = ['AAA', 'A3', 'SWDC'];

export const REPORT_LEVEL_OPTIONS = REPORT_LEVEL_VALUES.map((value) => ({
  value,
  label: PROGRAM_CONFIG[value].title,
}));

// Katalog kompetensi bawaan per level. Pelatih tetap dapat menambah,
// mengubah, atau menghapus item kompetensi pada form raport.
export const REPORT_COMPETENCIES = {
  AAA: [
    'Keberanian & adaptasi di air',
    'Mengapung (floating)',
    'Meluncur (gliding)',
    'Gerakan kaki gaya bebas',
    'Gerakan tangan gaya bebas',
    'Pengambilan napas',
    'Keselamatan dasar di kolam',
  ],
  A3: [
    'Teknik gaya bebas',
    'Teknik gaya dada',
    'Teknik gaya punggung',
    'Koordinasi napas',
    'Start (lompat start)',
    'Pembalikan (turn)',
    'Ketahanan (endurance)',
  ],
  SWDC: [
    'Gaya bebas (race pace)',
    'Gaya dada (race pace)',
    'Gaya punggung (race pace)',
    'Gaya kupu-kupu',
    'Start & underwater',
    'Turn & finish',
    'Kecepatan & sprint',
    'Ketahanan kompetisi',
  ],
};

export const REPORT_SCORE_LABELS = {
  1: 'Perlu Bimbingan',
  2: 'Mulai Berkembang',
  3: 'Berkembang',
  4: 'Mahir',
  5: 'Sangat Mahir',
};

export const REPORT_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draf' },
  { value: 'PUBLISHED', label: 'Terbit' },
];

export const REPORT_STATUS_VALUES = REPORT_STATUS_OPTIONS.map(
  (item) => item.value
);

export const REPORT_STATUS_LABELS = Object.fromEntries(
  REPORT_STATUS_OPTIONS.map((item) => [item.value, item.label])
);

export const REPORT_RECOMMENDATION_OPTIONS = [
  { value: 'STAY', label: 'Tetap di Level Ini' },
  { value: 'LEVEL_UP', label: 'Naik ke Level Berikutnya' },
  { value: 'EXTRA_PRACTICE', label: 'Perlu Latihan Tambahan' },
];

export const REPORT_RECOMMENDATION_VALUES =
  REPORT_RECOMMENDATION_OPTIONS.map((item) => item.value);

export const REPORT_RECOMMENDATION_LABELS = Object.fromEntries(
  REPORT_RECOMMENDATION_OPTIONS.map((item) => [item.value, item.label])
);

// Jenjang kenaikan level siswa saat raport LEVEL_UP diterbitkan.
export const NEXT_STUDENT_LEVEL = {
  AAA: 'A3',
  A3: 'SWDC',
  SWDC: null,
};
