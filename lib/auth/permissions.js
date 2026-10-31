// Pusat konfigurasi hak akses role AAA Sport Academy.
//
// Hierarki role dari tertinggi ke terendah:
// SUPERADMIN -> OWNER -> ADMIN -> COACH -> STUDENT.
//
// File ini murni berisi konstanta & fungsi kecil tanpa akses server,
// sehingga aman diimpor oleh Server Component, Route Handler, maupun
// Client Component (menu sidebar). Ubah matriks akses cukup dari sini.
//
// Ringkasan kebijakan:
// - SUPERADMIN : God Mode. Akses mutlak ke seluruh fitur aplikasi dan
//                seluruh pengaturan/konfigurasi sistem.
// - OWNER      : akses penuh ke operasional bisnis, termasuk hapus
//                permanen, tetapi tidak mengubah konfigurasi tingkat
//                sistem dan definisi role.
// - ADMIN      : operasional harian—Data Master pendukung, penjadwalan,
//                kasir/transaksi Finance, dan manajemen lead Marketing.
//                Tidak menghapus permanen dan tidak membuka Settings sistem.
// - COACH      : melihat jadwal, mengajar kelas yang ditugaskan, melihat
//                daftar siswa, serta mengelola progres/nilai lewat Raport.
// - STUDENT    : booking kelas Private, melihat jadwal dan booking milik
//                sendiri, Raport sendiri, Paket Saya, dan Settings Profil.

export const USER_ROLES = [
  'SUPERADMIN',
  'OWNER',
  'ADMIN',
  'COACH',
  'STUDENT',
];

export const ROLE_LABELS = {
  SUPERADMIN: 'Superadmin',
  OWNER: 'Owner',
  ADMIN: 'Admin',
  COACH: 'Coach',
  STUDENT: 'Student',
};

const ALL_ROLES = [...USER_ROLES];
const BUSINESS_MANAGEMENT_ROLES = ['SUPERADMIN', 'OWNER', 'ADMIN'];

// Role yang boleh membuka setiap fitur. Dipakai untuk menyaring menu
// sidebar sekaligus menjaga halaman (page guard di server). SUPERADMIN
// tetap ditulis eksplisit agar matriks mudah diaudit, dan juga diberi
// bypass God Mode pada canAccessFeature() untuk fitur yang terdaftar.
export const FEATURE_ROLES = {
  dashboard: ALL_ROLES,
  dataMasterStaff: BUSINESS_MANAGEMENT_ROLES,
  dataMasterCoaches: BUSINESS_MANAGEMENT_ROLES,
  dataMasterStudents: [...BUSINESS_MANAGEMENT_ROLES, 'COACH'],
  dataMasterVenues: BUSINESS_MANAGEMENT_ROLES,
  operationalOverview: [...BUSINESS_MANAGEMENT_ROLES, 'COACH'],
  scheduleLevels: ALL_ROLES,
  studentReports: ALL_ROLES,
  finance: BUSINESS_MANAGEMENT_ROLES,
  // Halaman self-service siswa. SUPERADMIN tetap dapat membukanya dalam
  // God Mode, tetapi data yang tampil mengikuti profil siswa akunnya.
  myPackage: ['SUPERADMIN', 'STUDENT'],
  marketing: BUSINESS_MANAGEMENT_ROLES,
  settingsProfile: ALL_ROLES,
  settingsSystem: ['SUPERADMIN'],
};

export function isSuperadmin(role) {
  return role === 'SUPERADMIN';
}

export function isOwner(role) {
  return role === 'OWNER';
}

export function canAccessFeature(role, feature) {
  if (!role || !FEATURE_ROLES[feature]) return false;
  if (isSuperadmin(role)) return true;
  return FEATURE_ROLES[feature].includes(role);
}

// Pengelola operasional bisnis yang boleh membuat/mengubah data utama.
export function isAdminLevel(role) {
  return BUSINESS_MANAGEMENT_ROLES.includes(role);
}

// Hapus permanen adalah tindakan tingkat pemilik bisnis. ADMIN tetap
// dapat menonaktifkan data melalui status, tetapi tidak menghapusnya.
export function canPermanentlyDelete(role) {
  return isSuperadmin(role) || isOwner(role);
}

// Konfigurasi tingkat sistem hanya untuk SUPERADMIN. OWNER memiliki
// akses bisnis penuh, tetapi tidak mengubah definisi role/konfigurasi ini.
export function canManageSystemSettings(role) {
  return isSuperadmin(role);
}

// Kumpulan role untuk requireApiUser() di Route Handler.
export const ADMIN_LEVEL_ROLES = [...BUSINESS_MANAGEMENT_ROLES];
export const PERMANENT_DELETE_ROLES = ['SUPERADMIN', 'OWNER'];
export const SYSTEM_SETTINGS_ROLES = ['SUPERADMIN'];
export const REPORT_EDITOR_ROLES = [...BUSINESS_MANAGEMENT_ROLES, 'COACH'];
export const STUDENT_LIST_ROLES = [...BUSINESS_MANAGEMENT_ROLES, 'COACH'];
export const PRIVATE_BOOKING_ROLES = [
  ...BUSINESS_MANAGEMENT_ROLES,
  'STUDENT',
];
