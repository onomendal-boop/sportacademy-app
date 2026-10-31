// Client API untuk Grup Operasional. Aman dipakai hook/Client Component.

export class OperationalApiError extends Error {
  constructor(payload, status) {
    super(payload?.message ?? 'Terjadi kesalahan saat memproses jadwal.');
    this.name = 'OperationalApiError';
    this.status = status;
    this.code = payload?.code ?? 'REQUEST_FAILED';
    this.fieldErrors = payload?.fieldErrors ?? {};
  }
}

async function requestJson(path, { method = 'GET', body } = {}) {
  let response;

  try {
    response = await fetch(path, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      credentials: 'same-origin',
      cache: 'no-store',
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new OperationalApiError(
      {
        code: 'NETWORK_ERROR',
        message: 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.',
      },
      0
    );
  }

  const rawText = await response.text().catch(() => '');
  let payload = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (!payload?.message) {
      const endpoint = path.split('?')[0];
      const fallbackMessage =
        response.status === 404
          ? `Endpoint Operasional tidak ditemukan (404): ${method} ${endpoint}. Pastikan file Route Handler pada app/api/operational sudah tersalin, lalu restart dev server.`
          : response.status === 401
            ? 'Sesi login sudah berakhir. Silakan login kembali.'
            : response.status === 403
              ? 'Akun Anda tidak memiliki izin untuk melakukan tindakan ini.'
              : `Server mengembalikan kesalahan ${response.status} saat memproses jadwal. Periksa terminal dev server untuk detailnya.`;

      payload = {
        ...(payload && typeof payload === 'object' ? payload : {}),
        code:
          payload?.code ??
          (response.status === 404 ? 'ENDPOINT_NOT_FOUND' : 'INVALID_RESPONSE'),
        message: fallbackMessage,
      };
    }

    throw new OperationalApiError(payload, response.status);
  }

  if (payload === null && rawText) {
    throw new OperationalApiError(
      {
        code: 'INVALID_RESPONSE',
        message: 'Server mengembalikan respons yang tidak valid saat memproses jadwal.',
      },
      response.status
    );
  }

  return payload?.data ?? payload;
}

export const scheduleApi = {
  create: (payload) =>
    requestJson('/api/operational/schedules', { method: 'POST', body: payload }),
  update: (id, payload) =>
    requestJson(`/api/operational/schedules/${id}`, {
      method: 'PATCH',
      body: payload,
    }),
  remove: (id) =>
    requestJson(`/api/operational/schedules/${id}`, { method: 'DELETE' }),
};

export async function fetchOccurrences({ program, weekStart }) {
  const params = new URLSearchParams({ weekStart });
  if (program) params.set('program', program);

  return requestJson(`/api/operational/occurrences?${params.toString()}`);
}

export async function assignCoachToOccurrence(payload) {
  return requestJson('/api/operational/occurrences/coach-assignment', {
    method: 'POST',
    body: payload,
  });
}

export async function removeCoachAssignment(payload) {
  return requestJson('/api/operational/occurrences/coach-assignment', {
    method: 'DELETE',
    body: payload,
  });
}

export async function createPrivateBooking(payload) {
  return requestJson('/api/operational/occurrences/private-booking', {
    method: 'POST',
    body: payload,
  });
}

export async function cancelPrivateBooking(bookingId) {
  return requestJson('/api/operational/occurrences/private-booking', {
    method: 'DELETE',
    body: { bookingId },
  });
}

export const reportApi = {
  list: () => requestJson('/api/operational/reports'),
  create: (payload) =>
    requestJson('/api/operational/reports', { method: 'POST', body: payload }),
  update: (id, payload) =>
    requestJson(`/api/operational/reports/${id}`, {
      method: 'PATCH',
      body: payload,
    }),
  remove: (id) =>
    requestJson(`/api/operational/reports/${id}`, { method: 'DELETE' }),
};
