# Data Siswa — AAA Sport Academy

Halaman `/dashboard/students` (menu **Data Master → Siswa**) sekarang terhubung ke database melalui model `Student` yang sama dengan yang dipakai Operasional (opsi booking Private) dan Finance (opsi pembayaran/langganan). Tidak ada perubahan schema dan tidak perlu migrasi baru.

## Struktur file

```text
app/
  dashboard/students/page.js            (diubah: Server Page + Suspense)
  api/data-master/students/route.js     (baru: GET, POST)
  api/data-master/students/[id]/route.js (baru: PATCH, DELETE)

components/data-master/
  StudentManager.jsx                    (baru)

hooks/
  useStudentManager.js                  (baru)

lib/data-master/
  studentService.js                     (baru)
  constants.js                          (ditambah opsi level/status siswa)
  dataMasterClient.js                   (ditambah studentApi)

lib/validations/
  dataMaster.js                         (ditambah studentSchema)
```

## Perintah setelah menyalin file

Tidak ada migrasi/seed baru — data siswa seed yang sudah ada langsung tampil.
Cukup restart dev server (hapus cache `.next` bila route API belum terbaca):

```powershell
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npm run dev
```

## Aturan bisnis

1. Siswa baru berstatus **Menunggu (PENDING)** secara default; admin dapat memilih status lain saat input.
2. Usia divalidasi 3–18 tahun dan terisi otomatis dari **Tanggal Lahir** bila diisi. Tanggal lahir tidak boleh di masa depan.
3. Kontak ortu/wali wajib nomor WhatsApp Indonesia (`08...`, `62...`, atau `+62...`); spasi/strip dibersihkan otomatis.
4. Riwayat kesehatan maksimal 500 karakter dan hanya tampil di halaman Data Master Siswa.
5. Siswa yang sudah memiliki **langganan, transaksi, atau booking tidak dapat dihapus** (409) — ubah status menjadi **Nonaktif** agar histori Finance/Operasional tetap terjaga.
6. Bila siswa benar-benar dihapus, akun login `STUDENT` yang terhubung ikut dihapus agar tidak menjadi akun yatim.
7. Mengubah nama siswa ikut menyelaraskan nama pada akun login yang terhubung.
8. Pembayaran lunas di Finance tetap mengaktifkan siswa `PENDING` menjadi `ACTIVE` secara otomatis.

## Endpoint

| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/data-master/students` | User login |
| POST | `/api/data-master/students` | ADMIN |
| PATCH/DELETE | `/api/data-master/students/[id]` | ADMIN |

User non-admin membuka halaman dalam mode lihat saja.
