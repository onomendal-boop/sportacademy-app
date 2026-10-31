// Client API untuk Grup Finance. Aman dipakai hook/Client Component.

export class FinanceApiError extends Error {
  constructor(payload, status) {
    super(payload?.message ?? 'Terjadi kesalahan saat memproses data keuangan.');
    this.name = 'FinanceApiError';
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
    throw new FinanceApiError(
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
          ? `Endpoint Finance tidak ditemukan (404): ${method} ${endpoint}. Pastikan file Route Handler pada app/api/finance sudah tersalin, lalu restart dev server.`
          : response.status === 401
            ? 'Sesi login sudah berakhir. Silakan login kembali.'
            : response.status === 403
              ? 'Akun Anda tidak memiliki izin untuk melakukan tindakan ini.'
              : `Server mengembalikan kesalahan ${response.status} saat memproses data keuangan. Periksa terminal dev server untuk detailnya.`;

      payload = {
        ...(payload && typeof payload === 'object' ? payload : {}),
        code:
          payload?.code ??
          (response.status === 404 ? 'ENDPOINT_NOT_FOUND' : 'INVALID_RESPONSE'),
        message: fallbackMessage,
      };
    }

    throw new FinanceApiError(payload, response.status);
  }

  if (payload === null && rawText) {
    throw new FinanceApiError(
      {
        code: 'INVALID_RESPONSE',
        message: 'Server mengembalikan respons yang tidak valid saat memproses data keuangan.',
      },
      response.status
    );
  }

  return payload?.data ?? payload;
}

function createResourceApi(basePath) {
  return {
    list: () => requestJson(basePath),
    create: (payload) => requestJson(basePath, { method: 'POST', body: payload }),
    update: (id, payload) =>
      requestJson(`${basePath}/${id}`, { method: 'PATCH', body: payload }),
    remove: (id) => requestJson(`${basePath}/${id}`, { method: 'DELETE' }),
  };
}

export const packageApi = createResourceApi('/api/finance/packages');
export const subscriptionApi = createResourceApi('/api/finance/subscriptions');
export const transactionApi = createResourceApi('/api/finance/transactions');

export const renewalApi = {
  create: (payload) =>
    requestJson('/api/finance/renewal-requests', {
      method: 'POST',
      body: payload,
    }),
};
