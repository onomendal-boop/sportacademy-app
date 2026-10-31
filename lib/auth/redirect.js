const DEFAULT_AUTH_REDIRECT = '/dashboard';

/**
 * Hanya izinkan redirect internal ke area dashboard.
 * Ini mencegah open-redirect melalui parameter ?next=https://website-lain.
 */
export function getSafeRedirectPath(value, fallback = DEFAULT_AUTH_REDIRECT) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (
    typeof rawValue !== 'string' ||
    !rawValue.startsWith('/') ||
    rawValue.startsWith('//') ||
    rawValue.includes('\\')
  ) {
    return fallback;
  }

  try {
    const url = new URL(rawValue, 'http://localhost');

    if (
      url.pathname !== '/dashboard' &&
      !url.pathname.startsWith('/dashboard/')
    ) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function buildLoginPath(nextPath = DEFAULT_AUTH_REDIRECT) {
  const safeNextPath = getSafeRedirectPath(nextPath);

  return `/login?next=${encodeURIComponent(safeNextPath)}`;
}
