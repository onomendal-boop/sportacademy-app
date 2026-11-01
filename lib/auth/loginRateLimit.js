import { createHmac } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';

// Rate limit login disimpan di MySQL melalui Prisma agar tetap berlaku
// lintas restart dan lintas instance server. Dua bucket dipakai bersamaan:
// - IP + username: menahan password guessing terhadap satu akun dari satu IP.
// - IP saja: menahan password spraying ke banyak username dari satu IP.
//
// Kunci bucket adalah HMAC-SHA256, sehingga IP dan username mentah tidak
// perlu disimpan pada tabel login_rate_limits.
export const LOGIN_RATE_LIMIT_CONFIG = Object.freeze({
  windowMs: 15 * 60 * 1000,
  blockMs: 15 * 60 * 1000,
  ipUsernameLimit: 5,
  ipLimit: 20,
});

function getKeySecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'aaa-sport-academy-login-rate-limit-development-secret'
  );
}

function hashBucketKey(parts) {
  return createHmac('sha256', getKeySecret())
    .update(parts.join('\0'))
    .digest('hex');
}

function normalizeIp(value) {
  if (typeof value !== 'string') return 'unknown';

  const normalized = value.trim().toLowerCase();

  // Terima IPv4/IPv6 saja. Nilai lain dari header diperlakukan sebagai
  // tidak diketahui agar tidak menjadi kunci bucket yang tidak terkendali.
  if (
    normalized.length === 0 ||
    normalized.length > 100 ||
    !/^[0-9a-f:.]+$/.test(normalized)
  ) {
    return 'unknown';
  }

  return normalized;
}

function normalizeUsername(value) {
  return typeof value === 'string'
    ? value.trim().toLowerCase().slice(0, 100)
    : '';
}

/**
 * Ambil IP client dari header proxy yang umum. Header ini hanya seaman
 * proxy/platform di depan aplikasi; pada deployment tanpa proxy tepercaya,
 * bucket tetap memberi perlindungan dasar dan pasangan IP+username tidak
 * bergantung pada keberadaan akun.
 */
export function getLoginClientIp(request) {
  const headers = request?.headers;
  if (!headers || typeof headers.get !== 'function') return 'unknown';

  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('x-vercel-forwarded-for')?.split(',')[0],
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',')[0],
  ];

  for (const candidate of candidates) {
    const ip = normalizeIp(candidate);
    if (ip !== 'unknown') return ip;
  }

  return 'unknown';
}

function buildBucketSpecs({ ip, username }) {
  const normalizedIp = normalizeIp(ip);
  const normalizedUsername = normalizeUsername(username);

  return [
    {
      scope: 'ip',
      keyHash: hashBucketKey(['login-rate-limit', 'ip', normalizedIp]),
      limit: LOGIN_RATE_LIMIT_CONFIG.ipLimit,
    },
    {
      scope: 'ip-username',
      keyHash: hashBucketKey([
        'login-rate-limit',
        'ip-username',
        normalizedIp,
        normalizedUsername,
      ]),
      limit: LOGIN_RATE_LIMIT_CONFIG.ipUsernameLimit,
    },
  ];
}

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

export async function checkLoginRateLimit(context, now = new Date()) {
  const checkedAt = toDate(now);
  const specs = buildBucketSpecs(context);

  // Pembersihan oportunistik; expiresAt selalu diatur ke akhir window
  // atau akhir masa blokir, mana yang lebih lama.
  await prisma.loginRateLimit.deleteMany({
    where: { expiresAt: { lte: checkedAt } },
  });

  const records = await prisma.loginRateLimit.findMany({
    where: { keyHash: { in: specs.map((spec) => spec.keyHash) } },
    select: { keyHash: true, blockedUntil: true },
  });

  let blockedUntil = null;

  for (const record of records) {
    if (
      record.blockedUntil &&
      record.blockedUntil.getTime() > checkedAt.getTime() &&
      (!blockedUntil || record.blockedUntil.getTime() > blockedUntil.getTime())
    ) {
      blockedUntil = record.blockedUntil;
    }
  }

  if (blockedUntil) {
    return {
      allowed: false,
      blockedUntil,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((blockedUntil.getTime() - checkedAt.getTime()) / 1000)
      ),
    };
  }

  return {
    allowed: true,
    blockedUntil: null,
    retryAfterSeconds: 0,
  };
}

async function runSerializableTransaction(callback) {
  let lastError;

  // Serializable mencegah percobaan paralel melewati batas hanya karena
  // membaca counter yang sama. P2034 adalah konflik transaksi Prisma dan
  // aman dicoba ulang beberapa kali untuk operasi sekecil ini.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(callback, {
        isolationLevel: 'Serializable',
        maxWait: 5000,
        timeout: 10000,
      });
    } catch (error) {
      lastError = error;
      if (error?.code !== 'P2034' || attempt === 2) throw error;
    }
  }

  throw lastError;
}

export async function recordFailedLoginAttempt(context, now = new Date()) {
  const attemptedAt = toDate(now);
  const specs = buildBucketSpecs(context);
  const { windowMs, blockMs } = LOGIN_RATE_LIMIT_CONFIG;

  return runSerializableTransaction(async (tx) => {
    const results = [];

    for (const spec of specs) {
      const existing = await tx.loginRateLimit.findUnique({
        where: { keyHash: spec.keyHash },
        select: {
          attempts: true,
          windowStartedAt: true,
          blockedUntil: true,
          expiresAt: true,
        },
      });

      const windowExpired =
        existing &&
        attemptedAt.getTime() - existing.windowStartedAt.getTime() >= windowMs;
      const blockExpired =
        !existing?.blockedUntil ||
        existing.blockedUntil.getTime() <= attemptedAt.getTime();
      const bucketExpired =
        existing && existing.expiresAt.getTime() <= attemptedAt.getTime();

      if (!existing || bucketExpired || (windowExpired && blockExpired)) {
        const expiresAt = new Date(attemptedAt.getTime() + windowMs);
        const data = {
          attempts: 1,
          windowStartedAt: attemptedAt,
          blockedUntil: null,
          expiresAt,
        };

        if (existing) {
          await tx.loginRateLimit.update({
            where: { keyHash: spec.keyHash },
            data,
          });
        } else {
          await tx.loginRateLimit.create({
            data: { keyHash: spec.keyHash, ...data },
          });
        }

        results.push({
          scope: spec.scope,
          attempts: 1,
          limit: spec.limit,
          blockedUntil: null,
        });
        continue;
      }

      // Request yang sudah terblokir seharusnya berhenti pada check.
      // Jangan perpanjang masa blokir apabila jalur ini tetap tercapai.
      if (
        existing.blockedUntil &&
        existing.blockedUntil.getTime() > attemptedAt.getTime()
      ) {
        results.push({
          scope: spec.scope,
          attempts: existing.attempts,
          limit: spec.limit,
          blockedUntil: existing.blockedUntil,
        });
        continue;
      }

      const attempts = existing.attempts + 1;
      const blockedUntil =
        attempts >= spec.limit
          ? new Date(attemptedAt.getTime() + blockMs)
          : null;

      await tx.loginRateLimit.update({
        where: { keyHash: spec.keyHash },
        data: {
          attempts,
          blockedUntil,
          expiresAt: blockedUntil ?? existing.expiresAt,
        },
      });

      results.push({
        scope: spec.scope,
        attempts,
        limit: spec.limit,
        blockedUntil,
      });
    }

    return results;
  });
}

export async function clearSuccessfulLoginAttempt(context) {
  const accountBucket = buildBucketSpecs(context).find(
    (spec) => spec.scope === 'ip-username'
  );

  if (!accountBucket) return;

  // Hanya bucket akun+IP yang dibersihkan. Bucket IP global sengaja tidak
  // direset oleh satu login sukses agar tidak dapat dipakai untuk membuka
  // kembali kuota password spraying dari IP yang sama.
  await prisma.loginRateLimit.deleteMany({
    where: { keyHash: accountBucket.keyHash },
  });
}
