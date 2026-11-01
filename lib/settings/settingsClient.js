// Client API Settings. Aman dipakai dari Client Component.

export class SettingsApiError extends Error {
  constructor(payload, status) {
    super(payload?.message ?? 'Terjadi kesalahan saat memproses pengaturan.');
    this.name = 'SettingsApiError';
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
    throw new SettingsApiError(
      {
        code: 'NETWORK_ERROR',
        message: 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.',
      },
      0
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new SettingsApiError(payload, response.status);
  return payload?.data ?? payload;
}

async function requestBlob(path, { method = 'GET', body } = {}) {
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
    throw new SettingsApiError(
      {
        code: 'NETWORK_ERROR',
        message: 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.',
      },
      0
    );
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new SettingsApiError(payload, response.status);
  }

  const disposition = response.headers.get('content-disposition') ?? '';
  const fileNameMatch = disposition.match(/filename="([^"]+)"/i);

  return {
    blob: await response.blob(),
    fileName: fileNameMatch?.[1] ?? 'aaa-sport-academy-backup.json',
    backupId: response.headers.get('x-backup-id'),
  };
}

export const systemSettingsApi = {
  update: (payload) =>
    requestJson('/api/settings/system', { method: 'PUT', body: payload }),
};

export const databaseBackupApi = {
  list: () => requestJson('/api/settings/backup'),
  createAndDownload: () =>
    requestBlob('/api/settings/backup', { method: 'POST', body: {} }),
  download: (id) => requestBlob(`/api/settings/backup/${encodeURIComponent(id)}`),
};
