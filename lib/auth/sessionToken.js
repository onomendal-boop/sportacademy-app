import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 jam

const DEVELOPMENT_SECRET = 'aaa-sport-academy-local-development-secret';

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (secret) return secret;

  // Fallback hanya untuk development lokal. Production wajib memakai AUTH_SECRET.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET belum dikonfigurasi di environment production.');
  }

  return DEVELOPMENT_SECRET;
}

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeJson(value) {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function sign(value) {
  return createHmac('sha256', getAuthSecret()).update(value).digest('base64url');
}

/**
 * Token session stateless: payloadBase64Url.signatureHmac.
 * Payload hanya berisi data profil aman, tidak pernah berisi password/hash.
 */
export function createSessionToken(user, ttlSeconds = SESSION_TTL_SECONDS) {
  const issuedAt = Math.floor(Date.now() / 1000);

  const payload = {
    sub: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage ?? null,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };

  const encodedPayload = encodeJson(payload);

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token) {
  if (typeof token !== 'string' || token.length === 0) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expectedSignature = sign(encodedPayload);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = decodeJson(encodedPayload);
  const now = Math.floor(Date.now() / 1000);

  if (
    !payload?.sub ||
    !payload?.username ||
    !payload?.role ||
    !Number.isFinite(payload?.exp) ||
    payload.exp <= now
  ) {
    return null;
  }

  return payload;
}
