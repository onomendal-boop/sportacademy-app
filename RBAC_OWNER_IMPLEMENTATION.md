# Hierarki Role SUPERADMIN, OWNER, ADMIN, COACH & STUDENT

AAA Sport Academy sekarang memakai lima role dengan hierarki:

```text
SUPERADMIN → OWNER → ADMIN → COACH → STUDENT
```

Seluruh matriks fitur terpusat di `lib/auth/permissions.js`. Fitur yang
bukan hak suatu role disembunyikan dari menu, ditolak oleh guard
halaman, tombol aksinya disembunyikan, dan ditolak kembali oleh API
atau service di server.

## 1. Definisi setiap role

### SUPERADMIN — God Mode

- Akses mutlak ke semua fitur yang terdaftar di aplikasi.
- Satu-satunya role yang dapat membuka dan mengubah **Settings
  Sistem** (General, Financial, Notifikasi, dan Backup).
- Dapat melakukan hapus permanen.
- Akun seed: `superadmin` (role `SUPERADMIN`).

### OWNER — pemilik bisnis

- Akses penuh ke seluruh operasional bisnis: Data Master, Operasional,
  Finance, dan Marketing.
- Dapat melakukan hapus permanen.
- Tidak dapat membuka Settings Sistem atau mengubah konfigurasi
  tingkat sistem/definisi role.
- Akun seed: `owner`.

### ADMIN — operasional harian

- Mengelola Data Master pendukung, penjadwalan, booking Private,
  kasir/transaksi Finance, dan lead/prospek Marketing.
- Tidak dapat melakukan hapus permanen; gunakan status/nonaktif bila
  data tidak dipakai lagi.
- Tidak dapat membuka Settings Sistem.
- Akun seed operasional: `admin`.

### COACH — pelatih

- Melihat Jadwal Keseluruhan dan jadwal program secara read-only untuk
  pengelolaan jadwal.
- Slot yang ditugaskan kepadanya ditandai **“Kelas Anda”**.
- Pada slot Private yang ditugaskan kepadanya, pelatih dapat melihat
  siswa terbooking. Identitas siswa pada slot pelatih lain disembunyikan.
- Melihat daftar Siswa, membuat/mengubah progres dan nilai melalui
  Raport Siswa. Server tetap memaksa raport pelatih memakai ID pelatih
  dari akun yang login.
- Tidak membuka Finance, Marketing, Data Master non-siswa, Settings
  Sistem, dan tidak dapat menghapus permanen.

### STUDENT — siswa

- Melihat jadwal program dan kapasitas slot.
- Dapat membooking slot **Private** yang kosong atas nama profil
  siswanya sendiri serta memilih pelatih dan menulis fokus/catatan sesi.
- Dapat membatalkan booking Private miliknya sendiri.
- Booking miliknya ditandai **“Booking Anda”**. Nama/detail siswa pada
  booking pengguna lain tidak dikirim ke browser, tetapi jumlah terisi
  tetap akurat.
- Melihat Raport milik sendiri, Paket Saya/perpanjangan paket, dan
  Settings Profil & Keamanan.
- Booking persisten yang tersedia saat ini adalah Private. Jadwal grup
  AAA/A3/SWDC belum mempunyai model enrollment/booking persisten,
  sehingga untuk grup siswa masih melihat jadwal dan kapasitasnya.

## 2. Matriks fitur

| Fitur | SUPERADMIN | OWNER | ADMIN | COACH | STUDENT |
| --- | :---: | :---: | :---: | :---: | :---: |
| Ringkasan | ✓ | ✓ | ✓ | ✓ | ✓ |
| Data Master — Staff/Pelatih/Tempat Latihan | ✓ | ✓ | ✓ | – | – |
| Data Master — Siswa | ✓ kelola | ✓ kelola | ✓ kelola | ✓ lihat | – |
| Operasional — Jadwal Keseluruhan | ✓ kelola | ✓ kelola | ✓ kelola | ✓ lihat | – |
| Jadwal AAA/A3/SWDC/Private | ✓ | ✓ | ✓ | ✓ lihat | ✓ lihat + booking Private sendiri |
| Raport Siswa | ✓ kelola | ✓ kelola | ✓ kelola | ✓ buat/nilai | ✓ milik sendiri, lihat |
| Finance | ✓ | ✓ | ✓ kasir/transaksi | – | – |
| Paket Saya | ✓ mode self-service | – | – | – | ✓ |
| Marketing/Lead | ✓ | ✓ | ✓ | – | – |
| Settings — Profil & Keamanan | ✓ | ✓ | ✓ | ✓ | ✓ |
| Settings — Sistem | ✓ | – | – | – | – |
| Hapus permanen | ✓ | ✓ | – | – | – |

“Kelola” terutama berarti buat dan ubah. Pembatalan booking dan hapus
override pelatih adalah aksi operasional, bukan penghapusan permanen;
pengelola bisnis dapat melakukannya, sedangkan STUDENT hanya dapat
membatalkan booking miliknya sendiri.

## 3. Perubahan database

Enum role sekarang:

```prisma
enum UserRole {
  SUPERADMIN
  OWNER
  ADMIN
  COACH
  STUDENT
}
```

Seeder idempotent sekarang membuat tiga akun tingkat pengelolaan yang
terpisah, semuanya memakai password seed `password123`:

| Username | Role | Email |
| --- | --- | --- |
| `superadmin` | `SUPERADMIN` | `superadmin@aaa.com` |
| `owner` | `OWNER` | `owner@aaa.com` |
| `admin` | `ADMIN` | `admin@aaa.com` |

Akun ini hanya untuk development/seed. Ganti password sebelum
digunakan di lingkungan nyata.

## 4. Lapisan keamanan

1. **Matriks terpusat** — `lib/auth/permissions.js` menyediakan
   `FEATURE_ROLES`, `isSuperadmin`, `isAdminLevel`,
   `canPermanentlyDelete`, dan `canManageSystemSettings`.
   `canAccessFeature` memberikan bypass God Mode kepada SUPERADMIN
   untuk semua fitur yang terdaftar.
2. **Menu** — sidebar difilter dengan matriks yang sama.
3. **Halaman** — `requireFeatureAccess()` menolak URL yang diketik
   langsung oleh role yang tidak berhak.
4. **Tombol/UI** — `canManage` untuk pengelola bisnis dan
   `canDelete` untuk SUPERADMIN/OWNER diteruskan sampai komponen dan
   hook. STUDENT menerima `canBook` terpisah agar hak booking tidak
   membuka hak mengubah jadwal/menugaskan pelatih.
5. **API** — Route Handler diperbarui: pengelolaan bisnis
   `SUPERADMIN|OWNER|ADMIN`, hapus permanen `SUPERADMIN|OWNER`,
   Raport editor `SUPERADMIN|OWNER|ADMIN|COACH`, dan booking Private
   `SUPERADMIN|OWNER|ADMIN|STUDENT`.
6. **Service booking** — untuk role STUDENT, `studentId` dari client
   tidak dipercaya. Server mengambil profil siswa dari user session
   melalui relasi `Student.userId`, menolak profil nonaktif, dan
   menolak pembatalan booking milik siswa lain dengan HTTP 403.
7. **Privasi occurrence** — `GET /api/operational/occurrences` kini
   viewer-aware. Pengelola bisnis melihat semua booking; COACH hanya
   melihat identitas booking pada slot yang ditugaskan kepadanya;
   STUDENT hanya melihat booking miliknya. `bookedCount` tetap dihitung
   dari seluruh booking terkonfirmasi.

## 5. Pengujian yang dijalankan

- `prisma validate`: valid.
- `node --check` untuk API, library, hook, dan seed: lulus.
- Uji matriks permission: **32 PASS / 0 FAIL**.
- Uji mock occurrence/booking: **19 PASS / 0 FAIL**, mencakup
  visibilitas SUPERADMIN/OWNER/ADMIN, COACH yang ditugaskan/tidak,
  STUDENT pemilik/bukan pemilik, pemaksaan `studentId` dari session,
  dan penolakan pembatalan booking orang lain.
- Bundle/transpile esbuild untuk API, halaman terkait, dan komponen JSX
  yang diubah: lulus.

## 6. Perintah penerapan lokal

Ada nilai enum baru sehingga migration diperlukan:

```bash
# Ekstrak role-superadmin-hierarchy.zip dari root proyek.
# Hentikan dev server terlebih dahulu.
npx prisma migrate dev --name add_superadmin_role
npx prisma generate
npm run seed
npm run dev
```

Bila paket RBAC sebelumnya belum diterapkan, perintah migration yang
sama akan membuat migration berdasarkan seluruh perbedaan schema saat
ini, termasuk OWNER dan kolom `User.phone` bila keduanya belum ada di
database lokal.

Uji cepat setelah login:

- `superadmin`: semua menu tampil, tab Settings Sistem tampil, tombol
  hapus tampil.
- `owner`: operasional bisnis dan tombol hapus tampil, tab Settings
  Sistem tidak tampil.
- `admin`: jadwal, Finance, dan Marketing dapat dikelola, tetapi
  tombol hapus permanen dan Settings Sistem tidak tampil.
- `coach01`: jadwal/Raport/Siswa tampil; slot miliknya bertanda
  “Kelas Anda”.
- `student01`: pada Jadwal Private dapat booking slot kosong dan
  membatalkan booking bertanda “Booking Anda”; booking siswa lain
  hanya terlihat sebagai slot terisi tanpa nama siswa.
