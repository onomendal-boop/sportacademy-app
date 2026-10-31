import { PrismaClient } from '@prisma/client';

// File ini hanya dipakai di server (API Route, Server Component, Server Action).
// Singleton mencegah pembuatan banyak koneksi Prisma saat hot-reload development.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
