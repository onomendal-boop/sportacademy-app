const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'password123';
const COACH_SPECIALIZATIONS = ['Pemula', 'Menengah', 'Atlet'];
const STUDENT_LEVELS = ['AAA', 'A3', 'SWDC'];

const COACH_NAMES = [
  'Andi Pratama',
  'Budi Santoso',
  'Citra Lestari',
  'Dewi Anggraini',
  'Eko Prasetyo',
  'Fitri Rahmawati',
  'Gilang Ramadhan',
  'Hana Kusuma',
  'Irfan Hakim',
  'Joko Wijaya',
];

const STUDENT_NAMES = [
  'Aira Putri',
  'Rafael Ananta',
  'Nabila Zahra',
  'Kirana Sarasvati',
  'Dimas Prasetyo',
  'Shafira Azka',
  'Fajar Nugraha',
  'Zahra Kamila',
  'Rafael',
  'Nadia Prameswari',
];

const STAFF_SEED = [
  {
    name: 'Rizky Ramadhan',
    position: 'Manajer Akademi',
    department: 'Manajemen',
    phone: '081298765401',
    status: 'ACTIVE',
    joinedAt: new Date(Date.UTC(2022, 0, 10)),
  },
  {
    name: 'Sinta Amelia',
    position: 'Admin Operasional',
    department: 'Operasional',
    phone: '081298765402',
    status: 'ACTIVE',
    joinedAt: new Date(Date.UTC(2022, 5, 1)),
  },
  {
    name: 'Raka Pradana',
    position: 'Front Office',
    department: 'Customer Service',
    phone: '081298765403',
    status: 'ACTIVE',
    joinedAt: new Date(Date.UTC(2023, 1, 13)),
  },
  {
    name: 'Nadia Safira',
    position: 'Finance',
    department: 'Finance',
    phone: '081298765404',
    status: 'ACTIVE',
    joinedAt: new Date(Date.UTC(2023, 3, 3)),
  },
  {
    name: 'Fajar Hidayat',
    position: 'Koordinator Jadwal',
    department: 'Operasional',
    phone: '081298765405',
    status: 'ACTIVE',
    joinedAt: new Date(Date.UTC(2023, 7, 21)),
  },
  {
    name: 'Putri Ayu Lestari',
    position: 'Customer Service',
    department: 'Customer Service',
    phone: '081298765406',
    status: 'ON_LEAVE',
    joinedAt: new Date(Date.UTC(2024, 0, 8)),
  },
  {
    name: 'Galih Permana',
    position: 'Marketing',
    department: 'Marketing',
    phone: '081298765407',
    status: 'ACTIVE',
    joinedAt: new Date(Date.UTC(2024, 4, 17)),
  },
  {
    name: 'Yoga Saputra',
    position: 'Lifeguard',
    department: 'Operasional',
    phone: '081298765408',
    status: 'INACTIVE',
    joinedAt: new Date(Date.UTC(2021, 9, 4)),
  },
];

const SCHEDULE_SEED = [
  // AAA - Pemula
  { title: 'Bintang Laut A', program: 'AAA', dayOfWeek: 'MONDAY', startTime: '16:00', endTime: '17:00', capacity: 10, venueName: 'Kolam Utama AAA', lane: 'Area Anak • Jalur 1-2', coachUsername: 'coach01' },
  { title: 'Lumba-Lumba A', program: 'AAA', dayOfWeek: 'WEDNESDAY', startTime: '16:00', endTime: '17:00', capacity: 10, venueName: 'Kolam Utama AAA', lane: 'Area Anak • Jalur 1-2', coachUsername: 'coach03' },
  { title: 'Bintang Laut B', program: 'AAA', dayOfWeek: 'FRIDAY', startTime: '15:30', endTime: '16:30', capacity: 10, venueName: 'Kolam Utama AAA', lane: 'Area Dangkal', coachUsername: null },
  { title: 'Weekend Ceria', program: 'AAA', dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '09:00', capacity: 10, venueName: 'Kolam Utama AAA', lane: 'Area Anak • Jalur 1-2', coachUsername: 'coach01' },
  { title: 'Lumba-Lumba B', program: 'AAA', dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '10:00', capacity: 10, venueName: 'Kolam Utama AAA', lane: 'Area Dangkal', coachUsername: 'coach04' },

  // A3 - Menengah
  { title: 'Hiu Muda A', program: 'A3', dayOfWeek: 'TUESDAY', startTime: '16:00', endTime: '17:30', capacity: 12, venueName: 'Kolam Kompetisi A3', lane: 'Jalur 3-4', coachUsername: 'coach02' },
  { title: 'Teknik Gaya Bebas', program: 'A3', dayOfWeek: 'WEDNESDAY', startTime: '17:00', endTime: '18:30', capacity: 12, venueName: 'Kolam Kompetisi A3', lane: 'Jalur 2-3', coachUsername: 'coach04' },
  { title: 'Hiu Muda B', program: 'A3', dayOfWeek: 'THURSDAY', startTime: '16:00', endTime: '17:30', capacity: 12, venueName: 'Kolam Kompetisi A3', lane: 'Jalur 3-4', coachUsername: 'coach02' },
  { title: 'Endurance Weekend', program: 'A3', dayOfWeek: 'SATURDAY', startTime: '10:00', endTime: '11:30', capacity: 12, venueName: 'Kolam Kompetisi A3', lane: 'Jalur 1-3', coachUsername: null },
  { title: 'Start & Turn Clinic', program: 'A3', dayOfWeek: 'SUNDAY', startTime: '08:00', endTime: '09:30', capacity: 12, venueName: 'Kolam Kompetisi A3', lane: 'Jalur 4-5', coachUsername: 'coach10' },

  // SWDC - Atlet
  { title: 'Squad Kompetisi A', program: 'SWDC', dayOfWeek: 'MONDAY', startTime: '05:30', endTime: '07:30', capacity: 16, venueName: 'Kolam Atlet SWDC', lane: 'Jalur 1-6', coachUsername: 'coach09' },
  { title: 'Dryland & Core', program: 'SWDC', dayOfWeek: 'TUESDAY', startTime: '17:00', endTime: '18:30', capacity: 16, venueName: 'Kolam Atlet SWDC', lane: 'Area Dryland', coachUsername: 'coach02' },
  { title: 'Squad Kompetisi B', program: 'SWDC', dayOfWeek: 'WEDNESDAY', startTime: '05:30', endTime: '07:30', capacity: 16, venueName: 'Kolam Atlet SWDC', lane: 'Jalur 1-6', coachUsername: 'coach09' },
  { title: 'Sprint & Race Pace', program: 'SWDC', dayOfWeek: 'FRIDAY', startTime: '05:30', endTime: '07:30', capacity: 16, venueName: 'Kolam Atlet SWDC', lane: 'Jalur 1-6', coachUsername: 'coach06' },
  { title: 'Simulasi Lomba', program: 'SWDC', dayOfWeek: 'SATURDAY', startTime: '06:00', endTime: '08:30', capacity: 16, venueName: 'Kolam Atlet SWDC', lane: 'Seluruh Jalur Kompetisi', coachUsername: null },

  // Private - kapasitas selalu 1
  { title: 'Private 1-on-1 Senin Pagi', program: 'PRIVATE', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', capacity: 1, venueName: 'Kolam Utama AAA', lane: 'Jalur Private 1', coachUsername: 'coach01' },
  { title: 'Private 1-on-1 Senin Siang', program: 'PRIVATE', dayOfWeek: 'MONDAY', startTime: '13:00', endTime: '14:00', capacity: 1, venueName: 'Kolam Utama AAA', lane: 'Jalur Private 2', coachUsername: 'coach03' },
  { title: 'Private 1-on-1 Selasa', program: 'PRIVATE', dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '11:00', capacity: 1, venueName: 'Kolam Utama AAA', lane: 'Jalur Private 1', coachUsername: null },
  { title: 'Private 1-on-1 Rabu', program: 'PRIVATE', dayOfWeek: 'WEDNESDAY', startTime: '15:00', endTime: '16:00', capacity: 1, venueName: 'Kolam Utama AAA', lane: 'Jalur Private 1', coachUsername: 'coach05' },
  { title: 'Private 1-on-1 Kamis', program: 'PRIVATE', dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '10:00', capacity: 1, venueName: 'Kolam Utama AAA', lane: 'Jalur Private 2', coachUsername: 'coach07' },
  { title: 'Private 1-on-1 Jumat', program: 'PRIVATE', dayOfWeek: 'FRIDAY', startTime: '14:00', endTime: '15:00', capacity: 1, venueName: 'Kolam Utama AAA', lane: 'Jalur Private 1', coachUsername: 'coach02' },
  { title: 'Private Weekend Sabtu', program: 'PRIVATE', dayOfWeek: 'SATURDAY', startTime: '11:00', endTime: '12:00', capacity: 1, venueName: 'Kolam Utama AAA', lane: 'Jalur Private 1', coachUsername: 'coach01' },
  { title: 'Private Weekend Minggu', program: 'PRIVATE', dayOfWeek: 'SUNDAY', startTime: '10:00', endTime: '11:00', capacity: 1, venueName: 'Kolam Utama AAA', lane: 'Jalur Private 2', coachUsername: 'coach03' },
];

const FINANCE_PACKAGE_SEED = [
  {
    key: 'aaaMonthly',
    name: 'AAA Pemula 1 Bulan',
    description: 'Delapan sesi pengenalan air dan teknik dasar renang untuk pemula.',
    program: 'AAA',
    price: 650000,
    durationLabel: '1 Bulan',
    durationDays: 30,
    totalSessions: 8,
    venueName: 'Kolam Utama AAA',
    isActive: true,
  },
  {
    key: 'a3Monthly',
    name: 'A3 Menengah 1 Bulan',
    description: 'Dua belas sesi pengembangan teknik gaya, endurance, start, dan turn.',
    program: 'A3',
    price: 850000,
    durationLabel: '1 Bulan',
    durationDays: 30,
    totalSessions: 12,
    venueName: 'Kolam Kompetisi A3',
    isActive: true,
  },
  {
    key: 'aaaQuarter',
    name: 'AAA Pemula 3 Bulan',
    description: 'Paket hemat tiga bulan untuk progres dasar renang yang lebih konsisten.',
    program: 'AAA',
    price: 1750000,
    durationLabel: '3 Bulan',
    durationDays: 90,
    totalSessions: 24,
    venueName: 'Kolam Utama AAA',
    isActive: true,
  },
  {
    key: 'swdcSemester',
    name: 'SWDC Atlet 6 Bulan',
    description: 'Program semester atlet dengan latihan intensif dan persiapan kompetisi.',
    program: 'SWDC',
    price: 6500000,
    durationLabel: '6 Bulan',
    durationDays: 180,
    totalSessions: 96,
    venueName: 'Kolam Atlet SWDC',
    isActive: true,
  },
  {
    key: 'privateFour',
    name: 'Voucher Private 4 Sesi',
    description: 'Empat sesi private 1-on-1 dengan fokus teknik sesuai kebutuhan siswa.',
    program: 'PRIVATE',
    price: 1000000,
    durationLabel: '1 Bulan',
    durationDays: 30,
    totalSessions: 4,
    venueName: 'Kolam Utama AAA',
    isActive: true,
  },
  {
    key: 'privateSingle',
    name: 'Private 1 Sesi',
    description: 'Satu sesi private 1-on-1 untuk trial, evaluasi, atau perbaikan teknik.',
    program: 'PRIVATE',
    price: 275000,
    durationLabel: '2 Minggu',
    durationDays: 14,
    totalSessions: 1,
    venueName: 'Kolam Utama AAA',
    isActive: true,
  },
];

const FINANCE_SUBSCRIPTION_SEED = [
  { username: 'student01', packageKey: 'aaaMonthly', startsOffset: -22, expiresOffset: 8, remainingSessions: 3, status: 'ACTIVE', autoRenew: true, paymentMethod: 'TRANSFER' },
  { username: 'student02', packageKey: 'aaaMonthly', startsOffset: -28, expiresOffset: 2, remainingSessions: 1, status: 'ACTIVE', autoRenew: false, paymentMethod: 'QRIS' },
  { username: 'student03', packageKey: 'a3Monthly', startsOffset: -18, expiresOffset: 12, remainingSessions: 7, status: 'ACTIVE', autoRenew: true, paymentMethod: 'TRANSFER' },
  { username: 'student04', packageKey: 'privateFour', startsOffset: -20, expiresOffset: 10, remainingSessions: 2, status: 'ACTIVE', autoRenew: false, paymentMethod: 'CASH' },
  { username: 'student05', packageKey: 'swdcSemester', startsOffset: -92, expiresOffset: 88, remainingSessions: 48, status: 'ACTIVE', autoRenew: false, paymentMethod: 'TRANSFER' },
  { username: 'student06', packageKey: 'aaaQuarter', startsOffset: -64, expiresOffset: 26, remainingSessions: 9, status: 'ACTIVE', autoRenew: true, paymentMethod: 'QRIS' },
  { username: 'student07', packageKey: 'a3Monthly', startsOffset: -32, expiresOffset: -2, remainingSessions: 0, status: 'EXPIRED', autoRenew: false, paymentMethod: 'TRANSFER' },
  { username: 'student08', packageKey: 'aaaMonthly', startsOffset: 0, expiresOffset: 30, remainingSessions: 8, status: 'PENDING', autoRenew: false, paymentMethod: 'TRANSFER' },
  { username: 'student09', packageKey: 'privateSingle', startsOffset: -4, expiresOffset: 10, remainingSessions: 1, status: 'ACTIVE', autoRenew: false, paymentMethod: 'QRIS' },
  { username: 'student10', packageKey: 'a3Monthly', startsOffset: -14, expiresOffset: 16, remainingSessions: 8, status: 'ACTIVE', autoRenew: true, paymentMethod: 'CASH' },
];

// Katalog kompetensi raport per level: salinan dari
// lib/operational/constants.js (seed berjalan mandiri sebagai CommonJS).
const REPORT_COMPETENCY_SEED = {
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

const REPORT_MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const STUDENT_REPORT_SEED = [
  { username: 'student01', coachUsername: 'coach01', monthOffset: -1, status: 'PUBLISHED', recommendation: 'STAY', sessionsAttended: 7, totalSessions: 8, scores: [5, 4, 4, 3, 3, 3, 4], coachNotes: 'Keberanian di air sudah sangat baik. Periode berikutnya fokus pada koordinasi gerakan tangan gaya bebas dan pengambilan napas ke samping.' },
  { username: 'student02', coachUsername: 'coach02', monthOffset: 0, status: 'DRAFT', recommendation: 'LEVEL_UP', sessionsAttended: 11, totalSessions: 12, scores: [4, 4, 3, 4, 3, 3, 4], coachNotes: 'Teknik dasar ketiga gaya sudah konsisten. Siap dicoba naik ke level SWDC setelah evaluasi start dan pembalikan.' },
  { username: 'student03', coachUsername: 'coach09', monthOffset: 0, status: 'PUBLISHED', recommendation: 'STAY', sessionsAttended: 22, totalSessions: 24, scores: [5, 4, 4, 3, 4, 4, 5, 4], coachNotes: 'Race pace gaya bebas dan sprint menonjol. Gaya kupu-kupu masih perlu penguatan ritme tangan dan napas.' },
  { username: 'student04', coachUsername: 'coach03', monthOffset: 0, status: 'DRAFT', recommendation: 'EXTRA_PRACTICE', sessionsAttended: 5, totalSessions: 8, scores: [3, 3, 2, 2, 3, 2, 3], coachNotes: 'Kehadiran perlu ditingkatkan agar progres meluncur dan gerakan kaki lebih konsisten. Disarankan menambah satu sesi pendampingan.' },
  { username: 'student05', coachUsername: 'coach04', monthOffset: -1, status: 'PUBLISHED', recommendation: 'STAY', sessionsAttended: 10, totalSessions: 12, scores: [4, 3, 4, 4, 3, 3, 3], coachNotes: 'Koordinasi napas membaik signifikan. Fokus berikutnya pada efisiensi tendangan gaya dada.' },
  { username: 'student09', coachUsername: 'coach06', monthOffset: 0, status: 'PUBLISHED', recommendation: 'STAY', sessionsAttended: 20, totalSessions: 24, scores: [4, 4, 5, 4, 4, 3, 4, 5], coachNotes: 'Ketahanan kompetisi sangat baik dan siap untuk simulasi lomba berikutnya. Turn masih dapat dipercepat.' },
  { username: 'student10', coachUsername: 'coach01', monthOffset: 0, status: 'DRAFT', recommendation: 'STAY', sessionsAttended: 6, totalSessions: 8, scores: [4, 4, 3, 3, 2, 3, 4], coachNotes: 'Mengapung dan keberanian sudah baik. Gerakan tangan gaya bebas menjadi fokus utama bulan depan.' },
];

function reportPeriodFromMonthOffset(monthOffset) {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1)
  );
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)
  );

  return {
    label: `${REPORT_MONTH_NAMES_ID[start.getUTCMonth()]} ${start.getUTCFullYear()}`,
    start,
    end,
  };
}

function padNumber(value) {
  return String(value).padStart(2, '0');
}

function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0066CC&color=fff&size=256&bold=true`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateOfBirth() {
  const year = randomInt(2010, 2018);
  const month = randomInt(0, 11);
  const day = randomInt(1, 28);

  return new Date(Date.UTC(year, month, day));
}

function calculateAge(dateOfBirth) {
  const today = new Date();
  let age = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDifference = today.getUTCMonth() - dateOfBirth.getUTCMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getUTCDate() < dateOfBirth.getUTCDate())
  ) {
    age -= 1;
  }

  return age;
}

function financeDateWithOffset(dayOffset, hourUtc = 2) {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + dayOffset,
      hourUtc,
      0,
      0
    )
  );
}

function financeDateOnlyWithOffset(dayOffset) {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + dayOffset
    )
  );
}

function invoiceDatePrefix(date) {
  return `INV-${date.toISOString().slice(0, 10).replaceAll('-', '')}-`;
}

function buildPools() {
  const groups = [
    {
      count: 4,
      name: 'Kolam Utama AAA',
      location: 'Jakarta Selatan',
      depth: 1.2,
      capacity: 20,
      status: 'ACTIVE',
    },
    {
      count: 3,
      name: 'Kolam Kompetisi A3',
      location: 'Bandung',
      depth: 2.0,
      capacity: 15,
      status: 'ACTIVE',
    },
    {
      count: 2,
      name: 'Kolam Atlet SWDC',
      location: 'Surabaya',
      depth: 3.0,
      capacity: 10,
      status: 'ACTIVE',
    },
    {
      count: 1,
      name: 'Kolam Private Betikan',
      location: 'Bali',
      depth: 1.5,
      capacity: 4,
      status: 'MAINTENANCE',
    },
  ];

  let poolNumber = 0;

  return groups.flatMap((group) =>
    Array.from({ length: group.count }, () => {
      poolNumber += 1;

      return {
        name: group.name,
        location: group.location,
        depth: group.depth,
        capacity: group.capacity,
        status: group.status,
        imageUrl: `https://picsum.photos/seed/pool${poolNumber}/800/600`,
      };
    })
  );
}

async function main() {
  console.log('🌱 Mulai seeding AAA Sport Academy...');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // God Mode: akses mutlak ke seluruh fitur dan pengaturan sistem.
  const superadmin = {
    name: 'Super Admin',
    username: 'superadmin',
    email: 'superadmin@aaa.com',
    phone: '081200000000',
    password: passwordHash,
    profileImage: avatarUrl('Super Admin'),
    role: 'SUPERADMIN',
    specialization: null,
    isActive: true,
  };

  // Pemilik bisnis: akses penuh ke operasional bisnis dan hapus
  // permanen, tanpa mengubah konfigurasi tingkat sistem/definisi role.
  const owner = {
    name: 'Andi Wijaya',
    username: 'owner',
    email: 'owner@aaa.com',
    phone: '081200000001',
    password: passwordHash,
    profileImage: avatarUrl('Andi Wijaya'),
    role: 'OWNER',
    specialization: null,
    isActive: true,
  };

  // Admin operasional harian: penjadwalan, kasir/transaksi, dan lead.
  const admin = {
    name: 'Admin Operasional',
    username: 'admin',
    email: 'admin@aaa.com',
    phone: '081200000002',
    password: passwordHash,
    profileImage: avatarUrl('Admin Operasional'),
    role: 'ADMIN',
    specialization: null,
    isActive: true,
  };

  const coaches = COACH_NAMES.map((name, index) => {
    const number = padNumber(index + 1);

    return {
      name,
      username: `coach${number}`,
      email: `coach${number}@aaa.com`,
      password: passwordHash,
      profileImage: avatarUrl(name),
      role: 'COACH',
      specialization: COACH_SPECIALIZATIONS[index % COACH_SPECIALIZATIONS.length],
      isActive: true,
    };
  });

  const students = STUDENT_NAMES.map((name, index) => {
    const number = padNumber(index + 1);
    const dateOfBirth = randomDateOfBirth();

    return {
      user: {
        name,
        username: `student${number}`,
        email: `student${number}@aaa.com`,
        password: passwordHash,
        profileImage: avatarUrl(name),
        role: 'STUDENT',
        specialization: null,
        isActive: true,
      },
      profile: {
        name,
        dateOfBirth,
        age: calculateAge(dateOfBirth),
        parentContact: `0812${String(3456001 + index).padStart(7, '0')}`,
        level: STUDENT_LEVELS[index % STUDENT_LEVELS.length],
        status: 'ACTIVE',
      },
    };
  });

  const pools = buildPools();
  const staff = STAFF_SEED.map((item) => ({
    ...item,
    email: `${item.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.|\.$/g, '')}@aaa.com`,
    profileImage: avatarUrl(item.name),
  }));
  const seedStaffEmails = staff.map((item) => item.email);

  const seedCoachUsernames = coaches.map((coach) => coach.username);
  const seedStudentUsernames = students.map((student) => student.user.username);
  const seedUsernames = [superadmin.username, owner.username, admin.username, ...seedCoachUsernames, ...seedStudentUsernames];
  const seedPoolNames = [...new Set(pools.map((pool) => pool.name))];
  const seedScheduleTitles = [...new Set(SCHEDULE_SEED.map((item) => item.title))];
  const seedPackageNames = FINANCE_PACKAGE_SEED.map((item) => item.name);

  // Hapus hanya data seed lama agar script idempotent dan tidak menghapus
  // pengguna/kolam manual yang tidak berasal dari seeder ini.
  await prisma.$transaction([
    prisma.studentReport.deleteMany({
      where: {
        student: {
          user: {
            is: {
              username: {
                in: seedStudentUsernames,
              },
            },
          },
        },
      },
    }),
    prisma.transaction.deleteMany({
      where: {
        student: {
          is: {
            user: {
              is: {
                username: {
                  in: seedStudentUsernames,
                },
              },
            },
          },
        },
      },
    }),
    prisma.subscription.deleteMany({
      where: {
        student: {
          user: {
            is: {
              username: {
                in: seedStudentUsernames,
              },
            },
          },
        },
      },
    }),
    prisma.package.deleteMany({
      where: {
        name: {
          in: seedPackageNames,
        },
      },
    }),
    prisma.schedule.deleteMany({
      where: {
        title: {
          in: seedScheduleTitles,
        },
      },
    }),
    prisma.staff.deleteMany({
      where: {
        email: {
          in: seedStaffEmails,
        },
      },
    }),
    prisma.coachAssignment.deleteMany({
      where: {
        coach: {
          username: {
            in: seedCoachUsernames,
          },
        },
      },
    }),
    prisma.student.deleteMany({
      where: {
        user: {
          is: {
            username: {
              in: seedStudentUsernames,
            },
          },
        },
      },
    }),
    prisma.user.deleteMany({
      where: {
        username: {
          in: seedUsernames,
        },
      },
    }),
    prisma.pool.deleteMany({
      where: {
        name: {
          in: seedPoolNames,
        },
      },
    }),
  ]);

  await prisma.user.createMany({
    data: [superadmin, owner, admin, ...coaches],
  });

  // Siswa dibuat satu per satu agar akun User STUDENT terhubung langsung
  // ke profil operasional Student melalui relasi studentProfile.
  for (const student of students) {
    await prisma.user.create({
      data: {
        ...student.user,
        studentProfile: {
          create: student.profile,
        },
      },
    });
  }

  const poolResult = await prisma.pool.createMany({
    data: pools,
  });

  const staffResult = await prisma.staff.createMany({
    data: staff,
  });

  const [venueRecords, coachRecords, studentRecords, adminRecord] =
    await Promise.all([
      prisma.pool.findMany({
        where: { name: { in: seedPoolNames } },
        select: { id: true, name: true, location: true },
        orderBy: [{ name: 'asc' }, { location: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.user.findMany({
        where: { username: { in: seedCoachUsernames } },
        select: { id: true, username: true },
      }),
      prisma.student.findMany({
        where: {
          user: {
            is: {
              username: {
                in: seedStudentUsernames,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          user: {
            select: { username: true },
          },
        },
      }),
      prisma.user.findUnique({
        where: { username: admin.username },
        select: { id: true },
      }),
    ]);

  const venuesByName = venueRecords.reduce((accumulator, venue) => {
    accumulator[venue.name] ??= [];
    accumulator[venue.name].push(venue);
    return accumulator;
  }, {});
  const venueCounters = {};
  const coachIdByUsername = Object.fromEntries(
    coachRecords.map((coach) => [coach.username, coach.id])
  );
  const studentByUsername = Object.fromEntries(
    studentRecords.map((student) => [student.user.username, student])
  );

  const packageByKey = {};

  for (const item of FINANCE_PACKAGE_SEED) {
    const venue = (venuesByName[item.venueName] ?? [])[0] ?? null;
    const createdPackage = await prisma.package.create({
      data: {
        name: item.name,
        description: item.description,
        program: item.program,
        price: item.price,
        durationLabel: item.durationLabel,
        durationDays: item.durationDays,
        totalSessions: item.totalSessions,
        defaultTrainingVenueId: venue?.id ?? null,
        poolName: venue?.name ?? item.venueName,
        isActive: item.isActive,
      },
    });

    packageByKey[item.key] = createdPackage;
  }

  const subscriptionByUsername = {};

  for (const item of FINANCE_SUBSCRIPTION_SEED) {
    const student = studentByUsername[item.username];
    const pkg = packageByKey[item.packageKey];

    if (!student || !pkg) continue;

    const createdSubscription = await prisma.subscription.create({
      data: {
        studentId: student.id,
        packageId: pkg.id,
        packageName: pkg.name,
        program: pkg.program,
        price: pkg.price,
        poolName: pkg.poolName,
        startsAt: financeDateOnlyWithOffset(item.startsOffset),
        expiresAt: financeDateOnlyWithOffset(item.expiresOffset),
        totalSessions: pkg.totalSessions,
        remainingSessions: item.remainingSessions,
        status: item.status,
        autoRenew: item.autoRenew,
        notes: 'Data contoh Finance dari seeder.',
      },
    });

    subscriptionByUsername[item.username] = createdSubscription;
  }

  const financeTransactionDefinitions = FINANCE_SUBSCRIPTION_SEED.map(
    (item) => {
      const student = studentByUsername[item.username];
      const pkg = packageByKey[item.packageKey];
      const subscription = subscriptionByUsername[item.username];
      const transactionDate = financeDateWithOffset(
        item.status === 'PENDING' ? -1 : item.startsOffset
      );
      const isPaid = item.status !== 'PENDING';

      return {
        transactionDate,
        data: {
          studentId: student?.id ?? null,
          subscriptionId: subscription?.id ?? null,
          packageId: pkg?.id ?? null,
          type:
            pkg?.program === 'PRIVATE'
              ? 'PRIVATE_VOUCHER'
              : 'SUBSCRIPTION_PAYMENT',
          description: `Pembayaran ${pkg?.name ?? 'paket langganan'}`,
          program: pkg?.program ?? null,
          poolName: pkg?.poolName ?? null,
          amount: pkg?.price ?? 0,
          paymentMethod: item.paymentMethod,
          status: isPaid ? 'PAID' : 'PENDING',
          referenceNumber:
            item.paymentMethod === 'CASH'
              ? null
              : `SEED-${item.username.toUpperCase()}`,
          paidAt: isPaid ? transactionDate : null,
          createdAt: transactionDate,
          recordedById: adminRecord?.id ?? null,
          notes: 'Data contoh Finance dari seeder.',
        },
      };
    }
  ).filter((item) => item.data.studentId && item.data.packageId);

  const additionalFinanceTransactions = [
    {
      username: 'student02',
      dayOffset: 0,
      subscriptionUsername: null,
      packageKey: null,
      type: 'REGISTRATION',
      description: 'Biaya pendaftaran siswa',
      program: 'AAA',
      poolName: packageByKey.aaaMonthly?.poolName ?? 'Kolam Utama AAA',
      amount: 150000,
      paymentMethod: 'QRIS',
      status: 'PAID',
    },
    {
      username: 'student04',
      dayOffset: 0,
      subscriptionUsername: null,
      packageKey: null,
      type: 'OTHER',
      description: 'Pembelian perlengkapan sesi private',
      program: 'PRIVATE',
      poolName: packageByKey.privateSingle?.poolName ?? 'Kolam Utama AAA',
      amount: 75000,
      paymentMethod: 'CASH',
      status: 'PAID',
    },
    {
      username: 'student06',
      dayOffset: -1,
      subscriptionUsername: null,
      packageKey: null,
      type: 'OTHER',
      description: 'Pembelian atribut latihan',
      program: 'AAA',
      poolName: packageByKey.aaaQuarter?.poolName ?? 'Kolam Utama AAA',
      amount: 125000,
      paymentMethod: 'TRANSFER',
      status: 'PAID',
    },
    {
      username: 'student03',
      dayOffset: -2,
      subscriptionUsername: null,
      packageKey: null,
      type: 'REGISTRATION',
      description: 'Biaya pendaftaran program A3',
      program: 'A3',
      poolName: packageByKey.a3Monthly?.poolName ?? 'Kolam Kompetisi A3',
      amount: 150000,
      paymentMethod: 'QRIS',
      status: 'PAID',
    },
    {
      username: 'student01',
      dayOffset: -3,
      subscriptionUsername: null,
      packageKey: null,
      type: 'OTHER',
      description: 'Penggantian kartu member',
      program: 'AAA',
      poolName: packageByKey.aaaMonthly?.poolName ?? 'Kolam Utama AAA',
      amount: 85000,
      paymentMethod: 'CASH',
      status: 'PAID',
    },
    {
      username: 'student10',
      dayOffset: -5,
      subscriptionUsername: null,
      packageKey: null,
      type: 'OTHER',
      description: 'Pemesanan perlengkapan renang',
      program: 'A3',
      poolName: packageByKey.a3Monthly?.poolName ?? 'Kolam Kompetisi A3',
      amount: 95000,
      paymentMethod: 'TRANSFER',
      status: 'PENDING',
    },
    {
      username: 'student05',
      dayOffset: -6,
      subscriptionUsername: null,
      packageKey: null,
      type: 'OTHER',
      description: 'Percobaan pembayaran perlengkapan atlet',
      program: 'SWDC',
      poolName: packageByKey.swdcSemester?.poolName ?? 'Kolam Atlet SWDC',
      amount: 200000,
      paymentMethod: 'QRIS',
      status: 'FAILED',
    },
  ];

  for (const item of additionalFinanceTransactions) {
    const student = studentByUsername[item.username];
    if (!student) continue;

    const pkg = item.packageKey ? packageByKey[item.packageKey] : null;
    const transactionDate = financeDateWithOffset(item.dayOffset, 3);

    financeTransactionDefinitions.push({
      transactionDate,
      data: {
        studentId: student.id,
        subscriptionId: item.subscriptionUsername
          ? (subscriptionByUsername[item.subscriptionUsername]?.id ?? null)
          : null,
        packageId: pkg?.id ?? null,
        type: item.type,
        description: item.description,
        program: item.program,
        poolName: item.poolName,
        amount: item.amount,
        paymentMethod: item.paymentMethod,
        status: item.status,
        referenceNumber:
          item.paymentMethod === 'CASH'
            ? null
            : `SEED-EXTRA-${item.username.toUpperCase()}`,
        paidAt: item.status === 'PAID' ? transactionDate : null,
        createdAt: transactionDate,
        recordedById: adminRecord?.id ?? null,
        notes: 'Data contoh Finance dari seeder.',
      },
    });
  }

  financeTransactionDefinitions.sort(
    (first, second) => first.transactionDate - second.transactionDate
  );

  const invoiceCounters = {};
  const financeTransactions = financeTransactionDefinitions.map((item) => {
    const prefix = invoiceDatePrefix(item.transactionDate);
    invoiceCounters[prefix] = (invoiceCounters[prefix] ?? 0) + 1;

    return {
      ...item.data,
      invoiceNumber: `${prefix}${String(invoiceCounters[prefix]).padStart(4, '0')}`,
    };
  });

  const financeTransactionResult = await prisma.transaction.createMany({
    data: financeTransactions,
  });
  const financePackageCount = Object.keys(packageByKey).length;
  const financeSubscriptionCount = Object.keys(subscriptionByUsername).length;

  let studentReportCount = 0;

  for (const item of STUDENT_REPORT_SEED) {
    const student = studentByUsername[item.username];
    if (!student) continue;

    const level = (
      await prisma.student.findUnique({
        where: { id: student.id },
        select: { level: true },
      })
    )?.level;
    if (!level) continue;

    const period = reportPeriodFromMonthOffset(item.monthOffset);
    const competencies = REPORT_COMPETENCY_SEED[level] ?? [];

    await prisma.studentReport.create({
      data: {
        studentId: student.id,
        coachId: coachIdByUsername[item.coachUsername] ?? null,
        level,
        periodLabel: period.label,
        periodStart: period.start,
        periodEnd: period.end,
        sessionsAttended: item.sessionsAttended,
        totalSessions: item.totalSessions,
        coachNotes: item.coachNotes,
        recommendation: item.recommendation,
        status: item.status,
        publishedAt:
          item.status === 'PUBLISHED' ? financeDateWithOffset(-2) : null,
        items: {
          create: competencies.map((competency, index) => ({
            competency,
            score: item.scores[index] ?? 3,
            note:
              (item.scores[index] ?? 3) <= 2
                ? 'Fokus latihan periode berikutnya.'
                : null,
            sortOrder: index,
          })),
        },
      },
    });

    studentReportCount += 1;
  }

  let scheduleCount = 0;
  let coachAssignmentCount = 0;

  for (const item of SCHEDULE_SEED) {
    const venues = venuesByName[item.venueName] ?? [];
    const venueIndex = venueCounters[item.venueName] ?? 0;
    const venue = venues[venueIndex % Math.max(venues.length, 1)];
    venueCounters[item.venueName] = venueIndex + 1;

    const coachId = item.coachUsername
      ? coachIdByUsername[item.coachUsername]
      : null;

    await prisma.schedule.create({
      data: {
        title: item.title,
        program: item.program,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        capacity: item.capacity,
        trainingVenueId: venue?.id ?? null,
        poolName: venue?.name ?? item.venueName,
        lane: item.lane,
        status: 'ACTIVE',
        ...(coachId
          ? {
              assignments: {
                create: {
                  coachId,
                  role: 'LEAD',
                  status: 'ASSIGNED',
                },
              },
            }
          : {}),
      },
    });

    scheduleCount += 1;
    if (coachId) coachAssignmentCount += 1;
  }

  const [superadminCount, ownerCount, adminCount, coachCount, studentCount] = await Promise.all([
    prisma.user.count({ where: { username: superadmin.username } }),
    prisma.user.count({ where: { username: owner.username } }),
    prisma.user.count({ where: { username: admin.username } }),
    prisma.user.count({ where: { username: { in: seedCoachUsernames } } }),
    prisma.user.count({ where: { username: { in: seedStudentUsernames } } }),
  ]);

  console.log('✅ Seeding AAA Sport Academy selesai.');
  console.table({
    Superadmin: superadminCount,
    Owner: ownerCount,
    Admin: adminCount,
    Coach: coachCount,
    Student: studentCount,
    Staff: staffResult.count,
    'Tempat Latihan (Pool)': poolResult.count,
    Jadwal: scheduleCount,
    'Penugasan Pelatih': coachAssignmentCount,
    'Paket Finance': financePackageCount,
    'Langganan Finance': financeSubscriptionCount,
    'Transaksi Finance': financeTransactionResult.count,
    'Raport Siswa': studentReportCount,
  });
  console.log(`🔑 Password semua akun seed: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('❌ Seeding gagal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
