# Raport Siswa — Grup Operasional AAA Sport Academy

Fitur raport perkembangan siswa yang terhubung database MySQL melalui Prisma.
Halaman: **Operasional → Raport Siswa** (`/dashboard/operasional/raport`).

## 1. Struktur file

```text
app/
  api/operational/reports/
    route.js                  # GET daftar raport, POST buat raport
    [id]/route.js             # PATCH ubah/terbitkan, DELETE (Admin)
  dashboard/operasional/raport/
    page.js                   # Server Component + Suspense + skeleton
components/
  operational/
    StudentReportManager.jsx  # statistik, filter, tabel, aksi
    StudentReportModals.jsx   # form nilai kompetensi + detail raport
  dashboard/dashboardMenu.js  # EDIT: menu "Raport Siswa" di grup Operasional
  data-master/StudentManager.jsx # EDIT: aktivitas siswa menampilkan jumlah raport
hooks/
  useStudentReportManager.js  # seluruh state, editor item, cetak raport
lib/
  operational/
    reportService.js          # query Prisma, aturan terbit & naik level
    constants.js              # EDIT: katalog kompetensi + label raport
    operationalClient.js      # EDIT: reportApi
    operationalOptionsService.js # EDIT: getReportStudents()
    routeHelpers.js           # EDIT: pesan validationResponse bisa diubah
  validations/operational.js  # EDIT: reportSchema + reportItemSchema
  data-master/studentService.js # EDIT: guard hapus siswa memperhitungkan raport
prisma/
  schema.prisma               # EDIT: model StudentReport + StudentReportItem
  seed.js                     # EDIT: 7 raport contoh idempotent
```

## 2. Perubahan schema Prisma (perlu migration)

```prisma
enum ReportStatus { DRAFT PUBLISHED }
enum ReportRecommendation { STAY LEVEL_UP EXTRA_PRACTICE }

model StudentReport {
  id               String   @id @default(cuid())
  studentId        String              // -> Student (onDelete: Restrict)
  coachId          String?             // -> User COACH "ReportCoach" (SetNull)
  level            StudentLevel        // snapshot level saat raport dibuat
  periodLabel      String   @db.VarChar(80)
  periodStart      DateTime? @db.Date
  periodEnd        DateTime? @db.Date
  sessionsAttended Int?
  totalSessions    Int?
  coachNotes       String?  @db.Text
  recommendation   ReportRecommendation @default(STAY)
  status           ReportStatus @default(DRAFT)
  publishedAt      DateTime?
  items            StudentReportItem[]
  @@unique([studentId, periodLabel])
  @@map("student_reports")
}

model StudentReportItem {
  id         String @id @default(cuid())
  reportId   String             // -> StudentReport (onDelete: Cascade)
  competency String @db.VarChar(120)
  score      Int                // 1..5
  note       String? @db.VarChar(300)
  sortOrder  Int    @default(0)
  @@map("student_report_items")
}
```

Tambahan relasi: `User.studentReports` ("ReportCoach") dan `Student.reports`.

## 3. Alur kerja & aturan bisnis

1. **Membuat raport** — Admin/Pelatih menekan *Buat Raport*, memilih siswa.
   Level terisi otomatis mengikuti level siswa dan template kompetensi level
   tersebut langsung dimuat (AAA 7 item, A3 7 item, SWDC 8 item). Item dapat
   ditambah, diubah namanya, atau dihapus (maksimal 20).
2. **Penilaian** — Skor 1–5 per kompetensi (1 Perlu Bimbingan, 2 Mulai
   Berkembang, 3 Berkembang, 4 Mahir, 5 Sangat Mahir) + catatan opsional per
   item. Rata-rata dan persen kehadiran dihitung otomatis.
3. **Satu raport per periode** — siswa tidak dapat memiliki dua raport dengan
   label periode sama (unique di database + pesan 409 yang jelas). Siswa pada
   raport yang sudah dibuat tidak dapat diganti.
4. **Draf vs Terbit** — status DRAFT belum final. Tombol kirim menerbitkan
   raport (mengisi `publishedAt`); tombol undo mengembalikan ke draf.
5. **Naik level otomatis** — bila raport diterbitkan dengan rekomendasi
   `LEVEL_UP`, level siswa di Data Master naik satu jenjang (AAA → A3 →
   SWDC) selama level siswa saat itu masih sama dengan level snapshot
   raport. Mengembalikan raport ke draf tidak menurunkan kembali level.
6. **Cetak untuk orang tua** — tombol printer membuka lembar raport rapi
   (capaian per kompetensi, rata-rata/predikat, catatan pelatih, tanda
   tangan pelatih penilai) untuk dicetak/disimpan sebagai PDF. Raport draf
   dicetak dengan penanda "DRAF".
7. **Guard data** — siswa berstatus Nonaktif tidak dapat menerima raport
   baru; siswa yang memiliki raport tidak dapat dihapus dari Data Master
   (harus diubah menjadi Nonaktif).

## 4. Hak akses

| Aksi | ADMIN | COACH | STUDENT |
| --- | :---: | :---: | :---: |
| Lihat daftar, detail, cetak | ✓ | ✓ | ✓ (lihat saja) |
| Buat / ubah / terbitkan | ✓ | ✓ | ✗ |
| Hapus raport | ✓ | ✗ | ✗ |

Pelatih yang membuat raport otomatis tercatat sebagai pelatih penilai dan
tidak dapat memindahkan penilaian ke pelatih lain; Admin bebas memilih.

## 5. Endpoint API

| Method | Endpoint | Role | Keterangan |
| --- | --- | --- | --- |
| GET | `/api/operational/reports` | login | Semua raport + item + siswa + pelatih |
| POST | `/api/operational/reports` | ADMIN, COACH | Buat raport (201) |
| PATCH | `/api/operational/reports/[id]` | ADMIN, COACH | Ubah raport / terbit / draf |
| DELETE | `/api/operational/reports/[id]` | ADMIN | Hapus raport + itemnya |

DTO menyertakan `averageScore`, `attendancePercent`, dan `promotedToLevel`
(level tujuan bila penerbitan ini menaikkan level siswa, selain itu null).

Kode error khusus: `DUPLICATE_REPORT_PERIOD` (409), `STUDENT_INACTIVE` (409),
`REPORT_STUDENT_LOCKED` (409), `INVALID_STUDENT` / `INVALID_COACH` (400).

## 6. Seed contoh

`npm run seed` kini juga membuat 7 raport contoh yang idempotent (dihapus dan
dibuat ulang untuk siswa seed): campuran Terbit/Draf pada bulan berjalan dan
bulan sebelumnya untuk level AAA, A3, dan SWDC, termasuk satu rekomendasi
naik level berstatus Draf (student02) yang dapat dicoba diterbitkan untuk
melihat kenaikan level otomatis.

## 7. Perintah lokal

Fitur ini menambah model baru, **perlu migration + generate + seed**:

```bash
# 1. Ekstrak raport-siswa-operational.zip dari root proyek, hentikan dev server
# 2. Buat tabel student_reports & student_report_items
npx prisma migrate dev --name add_student_reports
npx prisma generate
# 3. Isi data contoh (idempotent, aman dijalankan ulang)
npm run seed
# 4. Bersihkan cache build lalu jalankan ulang
#    (PowerShell: Remove-Item -Recurse -Force .next)
npm run dev
```

Buka **Operasional → Raport Siswa** di sidebar.
