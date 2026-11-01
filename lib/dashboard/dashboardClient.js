async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload?.message ?? 'Permintaan dashboard gagal diproses. Silakan coba lagi.'
    );
  }

  return payload?.data;
}

export async function fetchDashboardSearch(query, signal) {
  const searchParams = new URLSearchParams({ q: query });
  const response = await fetch(`/api/dashboard/search?${searchParams.toString()}`, {
    cache: 'no-store',
    signal,
  });

  return parseResponse(response);
}

export async function fetchDashboardNotifications(signal) {
  const response = await fetch('/api/dashboard/notifications', {
    cache: 'no-store',
    signal,
  });

  return parseResponse(response);
}

export async function markDashboardNotificationsRead(keys) {
  const response = await fetch('/api/dashboard/notifications/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ keys }),
  });

  return parseResponse(response);
}
