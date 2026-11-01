// Client-side API functions. File ini aman diimpor oleh Client Component/hook.
// Tidak ada query database, bcrypt, atau akses cookie server di file ini.

function normalizeLoginPayload(values) {
  return {
    username: values.username.trim().toLowerCase(),
    password: values.password,
  };
}

export async function loginRequest(values) {
  let response;

  try {
    response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify(normalizeLoginPayload(values)),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.',
    };
  }

  const data = await response.json().catch(() => null);

  // API auth kita selalu mengembalikan JSON berisi `code`. Kegagalan
  // kredensial memakai INVALID_CREDENTIALS yang generik, sedangkan HTTP
  // 404 tanpa code berarti route /api/auth/login tidak ditemukan oleh
  // Next.js.
  if (response.status === 404 && !data?.code) {
    return {
      ok: false,
      status: response.status,
      code: 'AUTH_API_NOT_FOUND',
      message:
        'Endpoint login tidak ditemukan. Pastikan file app/api/auth/login/route.js tersedia, lalu restart server.',
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      code: data?.code ?? 'LOGIN_FAILED',
      message:
        data?.message ??
        'Login gagal. Periksa kembali username dan password Anda.',
      fieldErrors: data?.fieldErrors,
    };
  }

  return {
    ok: true,
    status: response.status,
    user: data?.user ?? null,
  };
}

export async function logoutRequest() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function profileRequest(url, method, payload) {
  let response;

  try {
    response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.',
    };
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      code: data?.code ?? 'REQUEST_FAILED',
      message: data?.message ?? 'Permintaan gagal diproses. Coba lagi.',
      fieldErrors: data?.fieldErrors,
    };
  }

  return { ok: true, status: response.status, ...data };
}

export function updateProfileRequest(values) {
  return profileRequest('/api/auth/profile', 'PATCH', values);
}

export function changePasswordRequest(values) {
  return profileRequest('/api/auth/change-password', 'POST', values);
}
