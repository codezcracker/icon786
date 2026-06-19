/** Backend API base URL. Empty = same origin (Render single-server or Vite dev proxy). */
export function getApiBase() {
  const url = import.meta.env.VITE_API_URL?.trim();
  return url ? url.replace(/\/$/, '') : '';
}

export function apiUrl(path) {
  const base = getApiBase();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export function hasBackend() {
  if (getApiBase()) return true;
  // Same-server Render deploy, or local dev via Vite /api proxy
  return import.meta.env.PROD || import.meta.env.DEV;
}
