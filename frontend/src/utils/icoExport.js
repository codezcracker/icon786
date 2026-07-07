import { apiUrl } from './api';

/** Request ICO export from the backend (supports catalog icons or custom SVG from the editor). */
export async function exportIcoViaApi({ prefix, name, color = '#000000', svg } = {}) {
  const body = svg ? { svg, color } : { prefix, name, color };
  const res = await fetch(apiUrl('/api/export/ico'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'ICO export failed');
  }
  return res.blob();
}
