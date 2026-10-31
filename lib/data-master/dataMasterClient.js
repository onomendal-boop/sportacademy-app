// Client API untuk Data Master. Aman dipakai dari hook/Client Component.

export class DataMasterApiError extends Error {
  constructor(payload, status) {
    super(payload?.message ?? 'Terjadi kesalahan saat memproses data.');
    this.name = 'DataMasterApiError';
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
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new DataMasterApiError(
      {
        code: 'NETWORK_ERROR',
        message: 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.',
      },
      0
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new DataMasterApiError(payload, response.status);
  }

  return payload?.data ?? payload;
}

function createResourceApi(basePath) {
  return {
    create: (payload) => requestJson(basePath, { method: 'POST', body: payload }),
    update: (id, payload) =>
      requestJson(`${basePath}/${id}`, { method: 'PATCH', body: payload }),
    remove: (id) => requestJson(`${basePath}/${id}`, { method: 'DELETE' }),
  };
}

export const staffApi = createResourceApi('/api/data-master/staff');
export const studentApi = createResourceApi('/api/data-master/students');
export const coachApi = createResourceApi('/api/data-master/coaches');
export const trainingVenueApi = createResourceApi(
  '/api/data-master/training-venues'
);
