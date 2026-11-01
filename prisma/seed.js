const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'password123';
const COACH_SPECIALIZATIONS = ['AAA Sport Academy', 'A3', 'SWDC Swimmer'];
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
  // AAA Sport Academy
  { title: 'Bintang Laut A', program: 'AAA', dayOfWeek: 'MONDAY', startTime: '16:00', endTime: '17:00', capacity: 10, venueName: 'Kolam Utama AAA', lane: 'Area Anak • Jalur 1-2', coachUsername: 'coach01' },
  { title: 'Lumba-Lumba A', program: 'AAA', dayOfWeek: 'WEDNESDAY', startTime: '16:00', endTime: '17:00', capacity: 10, venueName: 'Kolam Utama AAA', lane: 'Area Anak • Jalur 1-2', coachUsername: 'coach03' },
  { title: 'Bintang Laut B', program: 'AAA', dayOfWeek: 'FRIDAY', startTime: '15:30', endTime: '16:30', capacity: 10, venueName: 'Kolam Utama AAA', lane: 'Area Dangkal', coachUsername: null },
  { title: 'Weekend Ceria', program: 'AAA', dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '09:00', capacity: 10, venueName: 'Kolam Utama AAA', lane: 'Area Anak • Jalur 1-2', coachUsername: 'coach01' },
  { title: 'Lumba-Lumba B', program: 'AAA', dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '10:00', capacity: 10, venueName: 'Kolam Utama AAA', lane: 'Area Dangkal', coachUsername: 'coach04' },

  // A3
  { title: 'Hiu Muda A', program: 'A3', dayOfWeek: 'TUESDAY', startTime: '16:00', endTime: '17:30', capacity: 12, venueName: 'Kolam Kompetisi A3', lane: 'Jalur 3-4', coachUsername: 'coach02' },
  { title: 'Teknik Gaya Bebas', program: 'A3', dayOfWeek: 'WEDNESDAY', startTime: '17:00', endTime: '18:30', capacity: 12, venueName: 'Kolam Kompetisi A3', lane: 'Jalur 2-3', coachUsername: 'coach04' },
  { title: 'Hiu Muda B', program: 'A3', dayOfWeek: 'THURSDAY', startTime: '16:00', endTime: '17:30', capacity: 12, venueName: 'Kolam Kompetisi A3', lane: 'Jalur 3-4', coachUsername: 'coach02' },
  { title: 'Endurance Weekend', program: 'A3', dayOfWeek: 'SATURDAY', startTime: '10:00', endTime: '11:30', capacity: 12, venueName: 'Kolam Kompetisi A3', lane: 'Jalur 1-3', coachUsername: null },
  { title: 'Start & Turn Clinic', program: 'A3', dayOfWeek: 'SUNDAY', startTime: '08:00', endTime: '09:30', capacity: 12, venueName: 'Kolam Kompetisi A3', lane: 'Jalur 4-5', coachUsername: 'coach10' },

  // SWDC Swimmer
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
    name: 'AAA Sport Academy 1 Bulan',
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
    name: 'A3 1 Bulan',
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
    name: 'AAA Sport Academy 3 Bulan',
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
    name: 'SWDC Swimmer 6 Bulan',
    description: 'Program semester SWDC Swimmer dengan latihan intensif dan persiapan kompetisi.',
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

const SYSTEM_SETTINGS_SEED = {
  general: {
    businessName: 'AAA Sport Academy',
    legalName: 'AAA Sport Academy',
    tagline: 'Belajar Aman, Percaya Diri, Berprestasi di Air',
    email: 'halo@aaa.com',
    phone: '081200000001',
    website: '',
    address: 'Jakarta Selatan, Jakarta',
    timezone: 'Asia/Jakarta',
    logoDataUrl: '',
    logoFileName: '',
    operatingHours: [
      { day: 'Senin', isOpen: true, openTime: '05:30', closeTime: '19:00' },
      { day: 'Selasa', isOpen: true, openTime: '05:30', closeTime: '19:00' },
      { day: 'Rabu', isOpen: true, openTime: '05:30', closeTime: '19:00' },
      { day: 'Kamis', isOpen: true, openTime: '05:30', closeTime: '19:00' },
      { day: 'Jumat', isOpen: true, openTime: '05:30', closeTime: '19:00' },
      { day: 'Sabtu', isOpen: true, openTime: '05:30', closeTime: '19:00' },
      { day: 'Minggu', isOpen: true, openTime: '05:30', closeTime: '19:00' },
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
    lateFeeFixedAmount: 0,
    lateFeeGraceDays: 3,
    lateFeeCapPercentage: 10,
    refundEnabled: true,
    refundOver7DaysPercentage: 90,
    refund3To7DaysPercentage: 70,
    refundUnder3DaysPercentage: 50,
    refundAdminFeePercentage: 5,
    refundProcessingDays: 7,
    refundPolicyNotes:
      'Pengajuan refund diverifikasi admin berdasarkan tanggal pengajuan, jumlah sesi yang belum digunakan, dan bukti pembayaran.',
  },
  notification: {
    senderName: 'AAA Sport Academy',
    whatsappNumber: '081200000001',
    emailFrom: 'halo@aaa.com',
  },
  siteContent: {
    academyFeatures: [
      {
        iconKey: 'shield-check',
        title: 'Keamanan Terstruktur',
        description: 'Progres bertahap sesuai kesiapan anak dan pengawasan pelatih di setiap sesi.',
      },
      {
        iconKey: 'users',
        title: 'Kelompok Kecil',
        description: 'Kapasitas kelas dibatasi agar setiap siswa mendapat perhatian yang cukup.',
      },
      {
        iconKey: 'badge-check',
        title: 'Kurikulum Bertahap',
        description: 'Target belajar jelas dari pemula hingga jalur prestasi dan kompetisi.',
      },
      {
        iconKey: 'calendar-days',
        title: 'Pilihan Jadwal Fleksibel',
        description: 'Tersedia kelas weekday, weekend, dan slot private di kolam partner.',
      },
    ],
  },
};

const NOTIFICATION_TEMPLATE_SEED = [
  {
    id: 'payment-reminder-whatsapp',
    name: 'Pengingat Pembayaran WhatsApp',
    channel: 'WHATSAPP',
    eventKey: 'PAYMENT_REMINDER',
    subject: null,
    message:
      'Halo {nama_orang_tua}, kami dari {nama_bisnis}. Mengingatkan bahwa paket {nama_paket} untuk {nama_siswa} berlaku sampai {tanggal_jatuh_tempo}. Sisa pertemuan saat ini {sisa_pertemuan}. Silakan hubungi admin apabila ingin memperpanjang paket. Terima kasih.',
    isActive: true,
  },
  {
    id: 'payment-success-whatsapp',
    name: 'Pembayaran Berhasil WhatsApp',
    channel: 'WHATSAPP',
    eventKey: 'PAYMENT_SUCCESS',
    subject: null,
    message:
      'Halo {nama_orang_tua}, pembayaran {nomor_invoice} sebesar {nominal_tagihan} untuk {nama_siswa} telah kami terima. Paket {nama_paket} berlaku sampai {tanggal_jatuh_tempo}. Terima kasih telah mempercayakan perjalanan renang bersama {nama_bisnis}.',
    isActive: true,
  },
  {
    id: 'class-reminder-whatsapp',
    name: 'Pengingat Jadwal Kelas WhatsApp',
    channel: 'WHATSAPP',
    eventKey: 'CLASS_REMINDER',
    subject: null,
    message:
      'Halo {nama_orang_tua}, mengingatkan jadwal latihan {nama_siswa} pada {jadwal_kelas} di {nama_kolam} bersama {nama_pelatih}. Mohon hadir 15 menit lebih awal untuk pemanasan dan persiapan.',
    isActive: true,
  },
  {
    id: 'lead-follow-up-whatsapp',
    name: 'Follow-up Lead WhatsApp',
    channel: 'WHATSAPP',
    eventKey: 'LEAD_FOLLOW_UP',
    subject: null,
    message:
      'Halo {nama_orang_tua}, terima kasih telah menghubungi {nama_bisnis}. Kami siap membantu memilih program dan jadwal trial yang cocok untuk {nama_siswa}. Apakah berkenan kami bantu tentukan jadwal konsultasinya?',
    isActive: true,
  },
  {
    id: 'welcome-email',
    name: 'Selamat Datang Email',
    channel: 'EMAIL',
    eventKey: 'WELCOME',
    subject: 'Selamat datang di {nama_bisnis}',
    message:
      'Halo {nama_orang_tua},\n\nSelamat datang di {nama_bisnis}. Paket {nama_paket} untuk {nama_siswa} telah tercatat pada sistem kami. Tim admin akan membantu apabila Anda membutuhkan informasi jadwal, perpanjangan paket, atau progres latihan.\n\nSalam,\n{nama_bisnis}',
    isActive: true,
  },
];

const PROGRAM_CONTENT_SEED = [
  {
    program: 'AAA',
    tagline: 'Berani dan aman di air',
    description:
      'Pengenalan air, keberanian, mengapung, meluncur, dan teknik dasar renang untuk anak yang baru memulai.',
    audienceLabel: 'Usia 4+ • Pemula',
    scheduleLabel: '2x per minggu',
    features: [
      'Asesmen level awal',
      'Kelompok kecil maks. 10 siswa',
      'Fokus keamanan & kepercayaan diri',
    ],
    sortOrder: 0,
    isActive: true,
  },
  {
    program: 'A3',
    tagline: 'Teknik makin rapi',
    description:
      'Pengembangan gaya bebas, gaya dada, endurance, start, dan pembalikan untuk siswa yang sudah menguasai dasar.',
    audienceLabel: 'Sudah bisa dasar renang',
    scheduleLabel: '2x per minggu',
    features: [
      'Klinik teknik gaya',
      'Latihan endurance bertahap',
      'Evaluasi kesiapan naik level',
    ],
    sortOrder: 1,
    isActive: true,
  },
  {
    program: 'SWDC',
    tagline: 'Siap menuju podium',
    description:
      'Program prestasi dengan periodisasi latihan, race pace, dryland, pencatatan waktu, dan simulasi kompetisi.',
    audienceLabel: 'Atlet & jalur kompetisi',
    scheduleLabel: '3-5x per minggu',
    features: [
      'Program latihan terperiodisasi',
      'Dryland dan simulasi lomba',
      'Monitoring catatan waktu',
    ],
    sortOrder: 2,
    isActive: true,
  },
  {
    program: 'PRIVATE',
    tagline: 'Fokus sesuai kebutuhan',
    description:
      'Sesi personal bersama satu pelatih untuk target khusus, jadwal fleksibel, atau anak yang membutuhkan pendampingan ekstra.',
    audienceLabel: 'Semua level • Fleksibel',
    scheduleLabel: 'Jadwal berdasarkan booking',
    features: [
      'Satu siswa satu pelatih',
      'Materi dipersonalisasi',
      'Pilihan slot lebih fleksibel',
    ],
    sortOrder: 3,
    isActive: true,
  },
];

const TESTIMONIAL_SEED = [
  {
    name: 'Rina Amelia',
    roleLabel: 'Orang tua siswa AAA Sport Academy • 8 bulan',
    quote:
      'Awalnya Zoya masih takut memasukkan kepala ke air. Sekarang sudah berani meluncur sendiri dan selalu semangat setiap jadwal latihan.',
    rating: 5,
    sortOrder: 0,
    isActive: true,
  },
  {
    name: 'Daniel Simanjuntak',
    roleLabel: 'Orang tua siswa A3 • 1 tahun',
    quote:
      'Raportnya detail dan mudah dipahami. Kami tahu teknik apa yang sudah dikuasai Bimo Saputra dan bagian mana yang sedang menjadi fokus pelatih.',
    rating: 5,
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'Ratna Sari',
    roleLabel: 'Orang tua atlet SWDC Swimmer • 2 tahun',
    quote:
      'Program SWDC membantu Raka lebih disiplin dan percaya diri menghadapi lomba. Catatan waktunya terus membaik dari bulan ke bulan.',
    rating: 5,
    sortOrder: 2,
    isActive: true,
  },
];

const FAQ_SEED = [
  {
    question: 'Usia berapa anak dapat mulai belajar renang?',
    answer:
      'Program AAA Sport Academy dapat diikuti mulai usia 4 tahun. Pada asesmen awal, pelatih menilai kesiapan fisik, keberanian di air, dan kemampuan mengikuti instruksi agar anak ditempatkan pada level yang aman.',
    sortOrder: 0,
    isActive: true,
  },
  {
    question: 'Apakah tersedia kelas trial sebelum berlangganan?',
    answer:
      'Tersedia konsultasi dan penjadwalan trial sesuai ketersediaan kelas. Isi form pendaftaran pada landing page, kemudian admin akan menghubungi Anda melalui WhatsApp untuk memilih program serta jadwal.',
    sortOrder: 1,
    isActive: true,
  },
  {
    question: 'Perlengkapan apa yang perlu dibawa saat latihan?',
    answer:
      'Siswa perlu membawa pakaian renang, topi renang, kacamata renang, handuk, botol minum, dan pakaian ganti. Kickboard serta alat bantu latihan dasar akan diarahkan oleh pelatih sesuai kebutuhan sesi.',
    sortOrder: 2,
    isActive: true,
  },
  {
    question: 'Bagaimana orang tua memantau progres anak?',
    answer:
      'Progres dicatat dalam raport siswa per periode. Setelah diterbitkan pelatih, siswa dan orang tua dapat melihat kompetensi, catatan pelatih, dan rekomendasi level melalui dashboard.',
    sortOrder: 3,
    isActive: true,
  },
  {
    question: 'Apakah jadwal Private dapat disesuaikan?',
    answer:
      'Jadwal Private mengikuti slot yang tersedia dan kapasitas setiap slot adalah satu siswa. Siswa dengan paket Private aktif dapat melihat serta memesan slot melalui dashboard.',
    sortOrder: 4,
    isActive: true,
  },
];

const PROMOTION_SEED = [
  {
    title: 'Flash Sale Weekend Renang',
    description:
      'Potongan pendaftaran program AAA Sport Academy untuk transaksi akhir pekan. Kuota promo dibatasi agar ukuran kelas tetap kecil dan aman.',
    type: 'FLASH_SALE',
    code: 'FLASHAAA25',
    discountType: 'PERCENTAGE',
    discountValue: 25,
    minPurchaseAmount: 500000,
    maxDiscountAmount: 250000,
    program: 'AAA',
    poolName: 'Kolam Utama AAA',
    startOffset: -1,
    endOffset: 14,
    usageLimit: 50,
    perUserLimit: 1,
    terms: 'Berlaku untuk pendaftar baru dengan minimum transaksi Rp 500.000.',
  },
  {
    title: 'Promo Pendaftar Baru',
    description:
      'Potongan langsung untuk pendaftaran baru pada program yang tersedia selama periode campaign berlangsung.',
    type: 'SEASONAL',
    code: 'AAABARU100',
    discountType: 'FIXED_AMOUNT',
    discountValue: 100000,
    minPurchaseAmount: 550000,
    maxDiscountAmount: 100000,
    program: null,
    poolName: null,
    startOffset: -2,
    endOffset: 21,
    usageLimit: 100,
    perUserLimit: 1,
    terms: 'Tidak dapat digabungkan dengan flash sale pada transaksi yang sama.',
  },
  {
    title: 'Referral Sahabat Renang',
    description:
      'Ajak teman belajar renang. Teman yang mendaftar mendapat potongan awal, pemberi referral mengikuti benefit program yang berlaku.',
    type: 'REFERRAL',
    code: 'SAHABATAAA',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minPurchaseAmount: 450000,
    maxDiscountAmount: 150000,
    program: null,
    poolName: null,
    startOffset: -7,
    endOffset: 45,
    usageLimit: 200,
    perUserLimit: 1,
    referrerBenefit: 'Voucher sesi sesuai ketentuan admin',
    refereeBenefit: 'Diskon 10% pendaftaran pertama',
    terms: 'Kode referral dimasukkan saat pendaftaran dan diverifikasi oleh admin.',
  },
];

const ARTICLE_SEED = [
  {
    title: 'Atlet SWDC Raih Pengalaman Berharga di Simulasi Kompetisi',
    slug: 'atlet-swdc-simulasi-kompetisi-renang',
    excerpt:
      'Simulasi kompetisi membantu atlet SWDC melatih start, race pace, dan manajemen emosi sebelum menghadapi lomba resmi.',
    content:
      '<p>Simulasi kompetisi menjadi bagian penting dari persiapan atlet SWDC Swimmer sebelum turun pada lomba resmi. Melalui format yang menyerupai perlombaan, atlet berlatih mengelola start, menjaga race pace, dan tetap fokus hingga sentuhan akhir.</p><h2>Melatih kesiapan lomba secara menyeluruh</h2><p>Pelatih menilai reaksi start, fase underwater, kualitas turn, serta konsistensi tempo pada paruh kedua lomba. Catatan dari simulasi kemudian dipakai untuk menentukan fokus latihan pada siklus berikutnya.</p><h2>Manajemen emosi sebelum start</h2><p>Selain aspek teknik, atlet dilatih membangun rutinitas pemanasan dan strategi menghadapi rasa gugup. Pengalaman berada pada suasana lomba membantu mereka tampil lebih tenang saat kompetisi sesungguhnya.</p><p>Orang tua dapat mendukung dengan memastikan atlet cukup tidur, membawa perlengkapan lengkap, dan tiba lebih awal untuk pemanasan.</p>',
    category: 'Prestasi',
    tags: ['SWDC', 'Kompetisi', 'Atlet'],
    authorUsername: 'coach09',
    publishedOffset: -2,
    featuredImageUrl: null,
    featuredImageAlt: 'Atlet renang SWDC melakukan start saat simulasi kompetisi',
    seoTitle: 'Simulasi Kompetisi Atlet SWDC Swimmer | AAA Sport Academy',
    seoDescription: 'Simulasi kompetisi membantu atlet SWDC melatih start, race pace, turn, dan kesiapan mental sebelum lomba resmi.',
  },
  {
    title: '5 Cara Aman Mengenalkan Anak pada Air Sejak Usia Dini',
    slug: 'cara-aman-mengenalkan-anak-pada-air',
    excerpt:
      'Pengenalan air yang positif membantu anak berani, aman, dan menikmati proses belajar renang sejak sesi pertama.',
    content:
      '<p>Pengalaman pertama anak di air sebaiknya terasa aman dan menyenangkan. Orang tua tidak perlu memaksa anak langsung berenang jauh; fokus awal adalah keberanian, keseimbangan, dan kebiasaan aman di sekitar kolam.</p><h2>Mulai dari aktivitas sederhana</h2><ul><li>Biarkan anak bermain dan menyiram air ke wajah secara bertahap.</li><li>Latih meniup gelembung untuk mengenal kontrol napas.</li><li>Gunakan kickboard dengan pendampingan langsung.</li><li>Berhenti sebelum anak terlalu lelah agar pengalaman tetap positif.</li></ul><h2>Selalu utamakan pengawasan</h2><p>Anak tidak boleh berada di area kolam tanpa pengawasan orang dewasa, termasuk ketika sudah dapat mengapung. Pelampung bukan pengganti pengawasan.</p><p>Di AAA Sport Academy, siswa pemula melalui asesmen dan latihan bertahap sesuai kesiapan masing-masing.</p>',
    category: 'Tips Renang',
    tags: ['Anak', 'Pemula', 'Keamanan Air'],
    authorUsername: 'coach01',
    publishedOffset: -5,
    featuredImageUrl: null,
    featuredImageAlt: 'Anak belajar mengenal air bersama pelatih renang',
    seoTitle: '5 Cara Aman Mengenalkan Anak pada Air | AAA Sport Academy',
    seoDescription: 'Panduan mengenalkan anak pada air secara aman dan menyenangkan, dari meniup gelembung hingga latihan kickboard.',
  },
  {
    title: 'Manfaat Renang Rutin untuk Postur dan Kesehatan Anak',
    slug: 'manfaat-renang-rutin-untuk-postur-anak',
    excerpt:
      'Renang melatih otot inti, koordinasi, dan kapasitas paru dengan beban sendi yang relatif rendah.',
    content:
      '<p>Renang melibatkan hampir seluruh kelompok otot utama sambil memberikan beban yang relatif rendah pada sendi. Karena tubuh ditopang air, anak dapat bergerak aktif dengan risiko benturan yang lebih kecil.</p><h2>Melatih postur dan koordinasi</h2><p>Gerakan lengan, tungkai, dan rotasi tubuh menuntut koordinasi serta kekuatan otot inti. Latihan yang konsisten membantu anak membangun kesadaran posisi tubuh dan keseimbangan.</p><h2>Mendukung kebugaran jantung dan paru</h2><p>Pengaturan napas dan aktivitas aerobik di air mendukung kebugaran kardiorespirasi. Intensitas tetap harus disesuaikan dengan usia, level, dan kondisi kesehatan anak.</p><p>Apabila anak memiliki riwayat kesehatan tertentu, sampaikan kepada admin dan pelatih sebelum memulai program.</p>',
    category: 'Kesehatan Anak',
    tags: ['Kesehatan', 'Postur', 'Anak Aktif'],
    authorUsername: 'coach03',
    publishedOffset: -12,
    featuredImageUrl: null,
    featuredImageAlt: 'Anak berlatih renang untuk kesehatan dan postur tubuh',
    seoTitle: 'Manfaat Renang untuk Postur dan Kesehatan Anak',
    seoDescription: 'Renang rutin membantu melatih postur, koordinasi, otot inti, dan kebugaran jantung-paru anak.',
  },
];

const LEAD_SEED = [
  {
    studentName: 'Keyla Anindya',
    studentAge: 6,
    parentName: 'Dewi Lestari',
    parentPhone: '081210000101',
    parentEmail: 'dewi.prasetyo@example.com',
    program: 'AAA',
    poolPreference: 'Kolam Utama AAA',
    source: 'LANDING_PAGE',
    referralCode: 'FLASHAAA25',
    message: 'Mohon dibantu jadwal trial akhir pekan.',
    status: 'NEW',
    priority: 'HIGH',
    createdOffset: 0,
    activities: [
      {
        type: 'SYSTEM',
        title: 'Lead masuk dari landing page',
        description: 'Form pendaftaran publik diterima dan menunggu follow-up admin.',
      },
    ],
  },
  {
    studentName: 'Raka Aditya',
    studentAge: 9,
    parentName: 'Pratama',
    parentPhone: '081210000102',
    parentEmail: 'pratama@example.com',
    program: 'A3',
    poolPreference: 'Kolam Kompetisi A3',
    source: 'INSTAGRAM',
    referralCode: null,
    message: 'Sudah dapat gaya bebas dasar, ingin asesmen A3.',
    status: 'CONTACTED',
    priority: 'MEDIUM',
    createdOffset: -2,
    nextFollowUpOffset: 1,
    activities: [
      {
        type: 'SYSTEM',
        title: 'Lead masuk dari Instagram',
        description: 'Calon siswa menanyakan asesmen level A3.',
      },
      {
        type: 'NOTE',
        title: 'WhatsApp follow-up dikirim',
        description: 'Admin mengirim pilihan jadwal asesmen.',
      },
    ],
  },
  {
    studentName: 'Kirana Sarasvati',
    studentAge: 7,
    parentName: 'Ibu Ratna',
    parentPhone: '081210000103',
    parentEmail: null,
    program: 'PRIVATE',
    poolPreference: 'Kolam Utama AAA',
    source: 'WHATSAPP',
    referralCode: 'SAHABATAAA',
    message: 'Membutuhkan pendampingan private karena masih takut air.',
    status: 'TRIAL_SCHEDULED',
    priority: 'HIGH',
    createdOffset: -4,
    trialOffset: 2,
    activities: [
      {
        type: 'SYSTEM',
        title: 'Lead masuk melalui WhatsApp',
        description: 'Orang tua meminta sesi private untuk pengenalan air.',
      },
      {
        type: 'STATUS',
        title: 'Trial dijadwalkan',
        description: 'Jadwal trial sudah dikonfirmasi kepada orang tua.',
      },
    ],
  },
  {
    studentName: 'Alvaro',
    studentAge: 11,
    parentName: 'Bapak Hendra Gunawan',
    parentPhone: '081210000104',
    parentEmail: 'hendra.gunawan@example.com',
    program: 'SWDC',
    poolPreference: 'Kolam Atlet SWDC',
    source: 'REFERRAL',
    referralCode: 'SAHABATAAA',
    message: 'Ingin evaluasi untuk jalur kompetisi.',
    status: 'WAITING_RESPONSE',
    priority: 'MEDIUM',
    createdOffset: -6,
    nextFollowUpOffset: 0,
    activities: [
      {
        type: 'SYSTEM',
        title: 'Lead referral masuk',
        description: 'Direferensikan oleh keluarga siswa aktif.',
      },
      {
        type: 'NOTE',
        title: 'Menunggu konfirmasi jadwal evaluasi',
        description: 'Admin sudah mengirim persyaratan dan pilihan waktu evaluasi SWDC.',
      },
    ],
  },
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

  // Satu admin untuk setiap program. programScope membatasi data
  // Operasional dan Finance yang dapat dikelola akun tersebut.
  const programAdmins = [
    {
      name: 'Admin AAA Sport Academy',
      username: 'adminaaa',
      email: 'admin.aaa@aaa.com',
      phone: '081200000002',
      password: passwordHash,
      profileImage: avatarUrl('Admin AAA Sport Academy'),
      role: 'ADMIN',
      programScope: 'AAA',
      specialization: null,
      isActive: true,
    },
    {
      name: 'Admin A3',
      username: 'admina3',
      email: 'admin.a3@aaa.com',
      phone: '081200000003',
      password: passwordHash,
      profileImage: avatarUrl('Admin A3'),
      role: 'ADMIN',
      programScope: 'A3',
      specialization: null,
      isActive: true,
    },
    {
      name: 'Admin SWDC Swimmer',
      username: 'adminswdc',
      email: 'admin.swdc@aaa.com',
      phone: '081200000004',
      password: passwordHash,
      profileImage: avatarUrl('Admin SWDC Swimmer'),
      role: 'ADMIN',
      programScope: 'SWDC',
      specialization: null,
      isActive: true,
    },
  ];

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
  const seedProgramAdminUsernames = programAdmins.map((item) => item.username);
  // Username admin global lama tetap dibersihkan agar reseed menggantinya
  // dengan tiga akun admin program dan tidak meninggalkan akun global seed.
  const seedUsernames = [superadmin.username, owner.username, 'admin', ...seedProgramAdminUsernames, ...seedCoachUsernames, ...seedStudentUsernames];
  const seedPoolNames = [...new Set(pools.map((pool) => pool.name))];
  const seedScheduleTitles = [...new Set(SCHEDULE_SEED.map((item) => item.title))];
  const legacySeedPackageNames = [
    'AAA Pemula 1 Bulan',
    'A3 Menengah 1 Bulan',
    'AAA Pemula 3 Bulan',
    'SWDC Atlet 6 Bulan',
  ];
  const seedPackageNames = [
    ...FINANCE_PACKAGE_SEED.map((item) => item.name),
    ...legacySeedPackageNames,
  ];
  const seedPromotionCodes = PROMOTION_SEED.map((item) => item.code);
  const seedArticleSlugs = ARTICLE_SEED.map((item) => item.slug);
  const seedTestimonialQuotes = TESTIMONIAL_SEED.map((item) => item.quote);
  const seedLeadPhones = LEAD_SEED.map((item) => item.parentPhone);

  // Hapus hanya data seed lama agar script idempotent dan tidak menghapus
  // pengguna/kolam manual yang tidak berasal dari seeder ini.
  await prisma.$transaction([
    prisma.lead.deleteMany({
      where: { parentPhone: { in: seedLeadPhones } },
    }),
    prisma.article.deleteMany({
      where: { slug: { in: seedArticleSlugs } },
    }),
    prisma.promotion.deleteMany({
      where: { code: { in: seedPromotionCodes } },
    }),
    prisma.testimonial.deleteMany({
      where: { quote: { in: seedTestimonialQuotes } },
    }),
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
    data: [superadmin, owner, ...programAdmins, ...coaches],
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

  const [venueRecords, coachRecords, studentRecords, programAdminRecords] =
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
          level: true,
          user: {
            select: { username: true },
          },
        },
      }),
      prisma.user.findMany({
        where: { username: { in: seedProgramAdminUsernames } },
        select: { id: true, username: true, programScope: true },
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
  const adminIdByProgram = Object.fromEntries(
    programAdminRecords.map((item) => [item.programScope, item.id])
  );
  const recordedByForProgram = (program, studentLevel) =>
    adminIdByProgram[program === 'PRIVATE' ? studentLevel : program] ?? null;

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
          recordedById: recordedByForProgram(pkg?.program, student?.level),
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
        recordedById: recordedByForProgram(
          item.program ?? student?.level,
          student?.level
        ),
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

  const fullDbUserRecords = await prisma.user.findMany({
    where: {
      username: {
        in: [superadmin.username, owner.username, ...seedCoachUsernames],
      },
    },
    select: { id: true, username: true, name: true },
  });
  const fullDbUserByUsername = Object.fromEntries(
    fullDbUserRecords.map((item) => [item.username, item])
  );
  const superadminRecord = fullDbUserByUsername[superadmin.username] ?? null;
  const ownerRecord = fullDbUserByUsername[owner.username] ?? null;

  await prisma.systemSetting.upsert({
    where: { id: 'default' },
    update: {
      ...SYSTEM_SETTINGS_SEED,
      updatedById: superadminRecord?.id ?? null,
    },
    create: {
      id: 'default',
      ...SYSTEM_SETTINGS_SEED,
      updatedById: superadminRecord?.id ?? null,
    },
  });

  for (const [index, template] of NOTIFICATION_TEMPLATE_SEED.entries()) {
    const templateData = { ...template, sortOrder: index };
    await prisma.notificationTemplate.upsert({
      where: { id: template.id },
      update: templateData,
      create: templateData,
    });
  }

  for (const item of PROGRAM_CONTENT_SEED) {
    await prisma.programContent.upsert({
      where: { program: item.program },
      update: item,
      create: item,
    });
  }

  const testimonialResult = await prisma.testimonial.createMany({
    data: TESTIMONIAL_SEED,
  });

  for (const item of FAQ_SEED) {
    await prisma.faqItem.upsert({
      where: { question: item.question },
      update: item,
      create: item,
    });
  }

  let promotionCount = 0;

  for (const item of PROMOTION_SEED) {
    const { startOffset, endOffset, ...promotion } = item;

    await prisma.promotion.create({
      data: {
        ...promotion,
        batchId: null,
        startsAt: financeDateWithOffset(startOffset, 0),
        endsAt: financeDateWithOffset(endOffset, 10),
        redeemedCount: 0,
        referrerBenefit: item.referrerBenefit ?? null,
        refereeBenefit: item.refereeBenefit ?? null,
        status: 'ACTIVE',
        createdById: superadminRecord?.id ?? null,
      },
    });
    promotionCount += 1;
  }

  let articleCount = 0;

  for (const item of ARTICLE_SEED) {
    const { authorUsername, publishedOffset, ...article } = item;
    const author = fullDbUserByUsername[authorUsername] ?? superadminRecord;

    await prisma.article.create({
      data: {
        ...article,
        authorId: author?.id ?? null,
        authorName: author?.name ?? 'Tim AAA Sport Academy',
        status: 'PUBLISHED',
        scheduledAt: null,
        publishedAt: financeDateWithOffset(publishedOffset, 2),
        viewCount: 0,
      },
    });
    articleCount += 1;
  }

  const leadAssignees = [ownerRecord, superadminRecord].filter(Boolean);
  let leadCount = 0;

  for (const [leadIndex, item] of LEAD_SEED.entries()) {
    const {
      activities,
      createdOffset,
      nextFollowUpOffset,
      trialOffset,
      ...lead
    } = item;
    const assignee = leadAssignees[leadIndex % Math.max(leadAssignees.length, 1)] ?? null;
    const createdAt = financeDateWithOffset(createdOffset, 3);

    await prisma.lead.create({
      data: {
        ...lead,
        assignedToId: assignee?.id ?? null,
        lastContactedAt:
          item.status === 'NEW'
            ? null
            : financeDateWithOffset(createdOffset + 1, 4),
        nextFollowUpAt:
          nextFollowUpOffset === undefined
            ? null
            : financeDateWithOffset(nextFollowUpOffset, 3),
        trialScheduledAt:
          trialOffset === undefined
            ? null
            : financeDateWithOffset(trialOffset, 3),
        convertedStudentId: null,
        internalNotes: 'Data awal Marketing dari seeder full database.',
        createdAt,
        activities: {
          create: activities.map((activity, activityIndex) => ({
            type: activity.type,
            title: activity.title,
            description: activity.description,
            actorId: activityIndex === 0 ? null : assignee?.id ?? null,
            createdAt: financeDateWithOffset(
              createdOffset + activityIndex,
              4
            ),
          })),
        },
      },
    });
    leadCount += 1;
  }

  const [superadminCount, ownerCount, programAdminCount, coachCount, studentCount] = await Promise.all([
    prisma.user.count({ where: { username: superadmin.username } }),
    prisma.user.count({ where: { username: owner.username } }),
    prisma.user.count({ where: { username: { in: seedProgramAdminUsernames } } }),
    prisma.user.count({ where: { username: { in: seedCoachUsernames } } }),
    prisma.user.count({ where: { username: { in: seedStudentUsernames } } }),
  ]);

  console.log('✅ Seeding AAA Sport Academy selesai.');
  console.table({
    Superadmin: superadminCount,
    Owner: ownerCount,
    'Admin Program': programAdminCount,
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
    'Template Notifikasi': NOTIFICATION_TEMPLATE_SEED.length,
    'Konten Program': PROGRAM_CONTENT_SEED.length,
    Testimoni: testimonialResult.count,
    FAQ: FAQ_SEED.length,
    Promo: promotionCount,
    Artikel: articleCount,
    Lead: leadCount,
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
