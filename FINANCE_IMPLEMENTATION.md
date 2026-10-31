# Grup Finance — AAA Sport Academy

Grup Finance sekarang terhubung ke database MySQL melalui Prisma. Mock Finance lama sudah diganti dengan halaman server, API, service, hook, dan komponen yang terpisah.

## Struktur file

```text
app/
  dashboard/finance/page.js
  api/finance/
    packages/route.js
    packages/[id]/route.js
    subscriptions/route.js
    subscriptions/[id]/route.js
    transactions/route.js
    transactions/[id]/route.js

components/finance/
  FinanceManager.jsx
  FinanceSections.jsx
  FinanceModals.jsx
  FinanceUI.jsx
  FinanceSkeleton.jsx

hooks/
  useFinanceManager.js

lib/finance/
  constants.js
  financeUtils.js
  financeClient.js
  financeOptionsService.js
  packageService.js
  subscriptionService.js
  transactionService.js
  referenceService.js
  routeHelpers.js

lib/validations/
  finance.js

prisma/
  schema.prisma
  seed.js
```

## Perubahan database

- Model baru `Package` untuk katalog paket.
- `Package.defaultTrainingVenueId` terhubung ke Data Master Tempat Latihan/model internal `Pool`.
- `Subscription.packageId` terhubung ke `Package`, tetapi snapshot nama, program, harga, dan nama kolam tetap disimpan.
- `Transaction.packageId` terhubung ke `Package`, sehingga invoice pending tetap dapat mengaktifkan/memperpanjang langganan saat menjadi lunas.
- Invoice tetap unik dengan format `INV-YYYYMMDD-0001`.

## Perintah setelah menyalin file

Jalankan dari root proyek. Di Windows, hentikan dev server terlebih dahulu agar Prisma Generate tidak terkunci oleh proses Node/Next.

```powershell
npx prisma migrate dev --name add_finance_package_catalog
npx prisma generate
npm run seed

if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npm run dev
```

Seeder Finance bersifat idempotent untuk data seed dan menambahkan:

- 6 paket katalog;
- 10 langganan siswa;
- 17 transaksi contoh dengan tanggal relatif terhadap hari seed dijalankan.

## Alur bisnis utama

1. Admin memilih **Catat Pembayaran**, siswa aktif/pending, dan paket aktif.
2. Pembayaran **PAID** membuat langganan aktif atau memperpanjang langganan yang dipilih.
3. Pembayaran **PENDING** membuat langganan pending.
4. Saat transaksi pending dikonfirmasi **PAID**, langganan pending diaktifkan tanpa menggandakan sesi/durasi.
5. Perpanjangan langganan aktif ditambahkan dari tanggal kedaluwarsa lama agar masa aktif tidak hilang.
6. Siswa berstatus `PENDING` otomatis menjadi `ACTIVE` setelah pembayaran lunas.
7. Transaksi lunas/refund tidak dapat dihapus demi audit; gunakan status `REFUNDED` bila dana dikembalikan.
8. Paket/langganan yang sudah mempunyai histori tidak dihapus permanen; paket dinonaktifkan dan langganan dibatalkan/diselesaikan.
9. Laporan pendapatan hanya menghitung transaksi `PAID`. Export CSV tetap menyertakan semua status untuk audit.

## Endpoint

| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/finance/packages` | User login |
| POST | `/api/finance/packages` | ADMIN |
| PATCH/DELETE | `/api/finance/packages/[id]` | ADMIN |
| GET | `/api/finance/subscriptions` | User login |
| POST | `/api/finance/subscriptions` | ADMIN |
| PATCH/DELETE | `/api/finance/subscriptions/[id]` | ADMIN |
| GET | `/api/finance/transactions` | User login |
| POST | `/api/finance/transactions` | ADMIN |
| PATCH/DELETE | `/api/finance/transactions/[id]` | ADMIN |

User non-admin tetap dapat membuka Finance dalam mode lihat saja.
