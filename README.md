Panduan Setup Dependency — AAA Sport Academy
Panduan ini menyiapkan project Next.js App Router + JavaScript dengan Tailwind CSS v3, Shadcn/UI, Radix UI, TanStack Query v5, React Hook Form, Zod, Prisma, PostgreSQL, Recharts, date-fns, Lucide React, dan Sonner.

Keputusan kompatibilitas versi
Stack final meminta
tailwind.config.js

- tailwindcss-animate. Itu adalah jalur Tailwind CSS v3. Karena shadcn@latest saat panduan ini diperiksa sudah mengarah ke ekosistem Tailwind v4, perintah berikut tidak dipakai untuk baseline v3:

Bash

# Jangan gunakan untuk setup Tailwind v3 pada panduan ini

npx shadcn@latest init
Gunakan CLI yang masih menghasilkan konfigurasi Tailwind v3:

Bash

npx shadcn@2.3.0 init
Prisma juga dikunci ke v6.19.3 agar pola klasik berikut tetap valid dan sesuai schema project yang sudah ada:

generator client dengan prisma-client-js
url = env("DATABASE_URL") di schema.prisma
import client dari @prisma/client

1. Prasyarat
   Pastikan Node.js minimal 20.9:

Bash

node --version
npm --version 2. Inisialisasi Next.js
Gunakan JavaScript, App Router, tanpa src, dan alias @/\*. Tailwind bawaan create-next-app dilewati lebih dulu karena versi terbarunya mengarah ke Tailwind v4, sedangkan baseline project ini memakai Tailwind v3.

Bash

npx create-next-app@latest aaa-sport-academy \
 --js \
 --no-tailwind \
 --eslint \
 --app \
 --no-src-dir \
 --import-alias "@/\*" \
 --use-npm

cd aaa-sport-academy
Jika mengerjakan workspace AAA Sport Academy yang sudah berisi file app, components, lib, dan prisma, lewati perintah create-next-app di atas dan mulai dari instalasi Tailwind di root project yang sudah ada.

3. Install Tailwind CSS v3
   Bash

npm install -D tailwindcss@^3.4.19 postcss@^8.5.32 autoprefixer@^10.6.2
npx tailwindcss init -p
Setelah langkah ini, siapkan file minimum yang dibutuhkan Shadcn CLI:

gunakan
postcss.config.js
hasil tailwindcss init -p atau versi final pada panduan ini
ganti
jsconfig.json
dengan versi alias @/\* pada panduan ini
pastikan
globals.css
sudah ada dan berisi directive Tailwind
Jangan memasang
tailwind.config.js
dan
globals.css
final sebelum shadcn init, karena CLI akan memperbarui kedua file tersebut. Versi final dipasang setelah init selesai.

Pastikan
globals.css
diawali:

CSS

@tailwind base;
@tailwind components;
@tailwind utilities; 4. Inisialisasi Shadcn/UI
Jalankan:

Bash

npx shadcn@2.3.0 init
Jawaban prompt yang digunakan:

text

Which style would you like to use?
New York

Which color would you like to use as the base color?
Slate

Would you like to use CSS variables for theming?
yes

How would you like to proceed? # jika peringatan React 19 muncul
Use --legacy-peer-deps
Catatan penting: base color bukan primary color. Slate hanya menjadi palet netral. Warna utama brand #0066CC dipasang melalui CSS variable --primary: 210 100% 40% dan token primary/ocean di
tailwind.config.js
.

Setelah init selesai, ganti ulang
tailwind.config.js
dan
globals.css
dengan versi final pada panduan/workspace ini. Langkah ini memastikan token semantic memakai channel HSL yang kompatibel dengan Tailwind v3 dan --primary benar-benar bernilai 210 100% 40% (#0066CC).

Berikutnya kunci kembali tailwind-merge ke major v2 karena project memakai Tailwind v3:

Bash

npm install tailwind-merge@^2.6.1
Berikutnya tambahkan komponen fondasi yang relevan untuk dashboard AAA Sport Academy:

Bash

npx shadcn@2.3.0 add \
 button card badge table \
 input label textarea select \
 dialog dropdown-menu tabs switch \
 separator skeleton avatar checkbox \
 popover tooltip accordion scroll-area sonner
Perintah add tersebut menginstall Radix primitives yang dibutuhkan secara otomatis, misalnya @radix-ui/react-slot, @radix-ui/react-dialog, @radix-ui/react-select, dan @radix-ui/react-tabs.

Untuk workspace yang sudah memiliki komponen custom Button.jsx, Card.jsx, Badge.jsx, dan Table.jsx, jangan menimpa file secara membabi buta. Pada filesystem yang tidak case-sensitive, button.jsx dan Button.jsx dapat bertabrakan. Migrasi komponen custom ke Shadcn sebaiknya dilakukan bertahap per komponen.

5. Install dependency aplikasi
   Bash

npm install \
 @prisma/client@^6.19.3 \
 @tanstack/react-query@^5.105.0 \
 react-hook-form@^7.91.0 \
 @hookform/resolvers@^6.0.2 \
 zod@^4.6.7 \
 date-fns@^4.4.0 \
 recharts@^3.10.1 \
 lucide-react@^1.63.0 \
 clsx@^2.1.1 \
 tailwind-merge@^2.6.1 \
 class-variance-authority@^0.7.1 \
 tailwindcss-animate@^1.0.7 \
 sonner@^2.0.8 \
 next-themes@^0.4.6
Install Prisma CLI sebagai dev dependency:

Bash

npm install -D prisma@^6.19.3 6. Inisialisasi Prisma PostgreSQL
Untuk project yang belum memiliki folder prisma:

Bash

npx prisma init --datasource-provider postgresql
Untuk workspace AAA Sport Academy yang sudah memiliki
schema.prisma
, lewati prisma init. Cukup pastikan header schema memakai PostgreSQL seperti pada bagian schema di bawah.

Salin environment contoh:

Bash

# macOS/Linux/Git Bash

cp .env.example .env
PowerShell

# Windows PowerShell

Copy-Item .env.example .env
Setelah DATABASE_URL asli terisi dan model tersedia:

Bash

npx prisma validate
npx prisma generate
npx prisma migrate dev --name init 7. Verifikasi
Bash

npm run lint
npm run build
npm run dev
Buka aplikasi di http://localhost:3000.

8.  package.json
    — dependencies dan devDependencies
    Versi di bawah adalah hasil baseline setelah seluruh perintah di atas dijalankan, termasuk komponen fondasi Shadcn. Patch version dapat berubah sewaktu-waktu; simpan package-lock.json untuk reproduksibilitas.

JSON

{
"dependencies": {
"@hookform/resolvers": "^6.0.2",
"@prisma/client": "^6.19.3",
"@radix-ui/react-accordion": "^1.3.1",
"@radix-ui/react-avatar": "^1.3.1",
"@radix-ui/react-checkbox": "^1.4.1",
"@radix-ui/react-dialog": "^1.3.1",
"@radix-ui/react-dropdown-menu": "^2.2.1",
"@radix-ui/react-label": "^2.1.17",
"@radix-ui/react-popover": "^1.3.1",
"@radix-ui/react-scroll-area": "^1.4.0",
"@radix-ui/react-select": "^2.4.1",
"@radix-ui/react-separator": "^1.2.0",
"@radix-ui/react-slot": "^1.5.0",
"@radix-ui/react-switch": "^1.4.1",
"@radix-ui/react-tabs": "^1.2.1",
"@radix-ui/react-tooltip": "^1.4.1",
"@tanstack/react-query": "^5.105.0",
"class-variance-authority": "^0.7.1",
"clsx": "^2.1.1",
"date-fns": "^4.4.0",
"lucide-react": "^1.63.0",
"next": "16.4.3",
"next-themes": "^0.4.6",
"react": "19.3.0",
"react-dom": "19.3.0",
"react-hook-form": "^7.91.0",
"recharts": "^3.10.1",
"sonner": "^2.0.8",
"tailwind-merge": "^2.6.1",
"tailwindcss-animate": "^1.0.7",
"zod": "^4.6.7"
},
"devDependencies": {
"autoprefixer": "^10.6.2",
"eslint": "^9",
"eslint-config-next": "16.4.3",
"postcss": "^8.5.32",
"prisma": "^6.19.3",
"tailwindcss": "^3.4.19"
}
}
shadcn tidak perlu menjadi dependency runtime karena dipanggil sebagai CLI melalui npx. next-themes ditambahkan untuk wrapper Shadcn Sonner dan dukungan dark mode berbasis class.

9.  tailwind.config.js
    Lihat file
    tailwind.config.js
    di root project. Konfigurasi tersebut sudah mencakup:

primary.DEFAULT dari CSS variable --primary
palet ocean dengan ocean.600 = #0066CC
token warna Shadcn: background, card, popover, muted, accent, chart, dan sidebar
font sans = Inter
font heading/display/manrope = Manrope
radius berbasis --radius
keyframes accordion
plugin tailwindcss-animate 10.
postcss.config.js
JavaScript

module.exports = {
plugins: {
tailwindcss: {},
autoprefixer: {},
},
}; 11.
jsconfig.json
JSON

{
"compilerOptions": {
"baseUrl": ".",
"paths": {
"@/_": ["./_"]
}
}
}
Dengan konfigurasi ini import dapat ditulis sebagai:

JavaScript

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; 12.
components.json
JSON

{
"$schema": "https://ui.shadcn.com/schema.json",
"style": "new-york",
"rsc": true,
"tsx": false,
"tailwind": {
"config": "tailwind.config.js",
"css": "app/globals.css",
"baseColor": "slate",
"cssVariables": true,
"prefix": ""
},
"aliases": {
"components": "@/components",
"utils": "@/lib/utils",
"ui": "@/components/ui",
"lib": "@/lib",
"hooks": "@/hooks"
},
"iconLibrary": "lucide"
} 13. Warna primary Shadcn
#0066CC setara dengan HSL 210 100% 40%. Pada
globals.css
, token utamanya adalah:

CSS

:root {
--primary: 210 100% 40%; /_ #0066CC _/
--primary-foreground: 0 0% 100%;
--ring: 210 100% 40%;
--sidebar-primary: 210 100% 40%;
--sidebar-ring: 210 100% 40%;
}
Gunakan file
globals.css
final di root project agar seluruh token light/dark mode konsisten.

14. Memuat Inter dan Manrope
    Di root layout hasil create-next-app, ganti font bawaan menjadi:

JavaScript

import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
subsets: ["latin"],
variable: "--font-inter",
display: "swap",
});

const manrope = Manrope({
subsets: ["latin"],
variable: "--font-manrope",
display: "swap",
});

export default function RootLayout({ children }) {
return (
<html lang="id" className={`${inter.variable} ${manrope.variable}`}>
<body className="font-sans antialiased">{children}</body>
</html>
);
}
Sesuaikan contoh di atas dengan metadata dan provider yang sudah ada; jangan membuat dua root layout.

15. utils.js
    JavaScript

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
return twMerge(clsx(inputs));
} 16. Schema Prisma dasar —
schema.prisma
Header dasar untuk Prisma v6 + PostgreSQL:

prisma

generator client {
provider = "prisma-client-js"
}

datasource db {
provider = "postgresql"
url = env("DATABASE_URL")
}

// Tambahkan enum dan model aplikasi di bawah blok ini.
Schema AAA Sport Academy yang sudah ada dipertahankan seluruh modelnya. Penyesuaian PostgreSQL yang dilakukan:

provider = "mysql" menjadi provider = "postgresql"
@db.LongText yang khusus MySQL menjadi @db.Text 17.
.env.example
env

# PostgreSQL connection string untuk Prisma.

# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public

DATABASE_URL="postgresql://postgres:password@localhost:5432/aaa_sport_academy?schema=public"
Jangan commit file .env asli. File
.env.example
hanya berisi placeholder dan aman dibagikan.

18. Troubleshooting singkat
    Error alias @/\*: cek
    jsconfig.json
    , restart dev server, dan pastikan import tidak memakai path src karena project ini tidak memakai folder src.
    Warna Shadcn tidak berubah: pastikan globals.css diimpor root layout dan variable ditulis sebagai channel HSL tanpa hsl(...), misalnya 210 100% 40%.
    Class seperti bg-primary/90 tidak bekerja: pastikan token di
    tailwind.config.js
    memakai hsl(var(--primary) / <alpha-value>).
    Prisma tidak menemukan DATABASE_URL: buat .env dari
    .env.example
    , isi URL PostgreSQL yang valid, kemudian jalankan ulang npx prisma validate.
    Peer dependency saat Shadcn init: pilih Use --legacy-peer-deps hanya untuk proses CLI tersebut; jangan langsung mengaktifkan --force untuk seluruh project.
