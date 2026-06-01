/** Backend API base URL (set VITE_API_URL in Vercel env for font generator / SVG Repo). */
export function getApiBase() {
  const url = import.meta.env.VITE_API_URL?.trim();
  return url ? url.replace(/\/$/, '') : '';
}

export function apiUrl(path) {
  const base = getApiBase();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : '';
}

export function hasBackend() {
  return Boolean(getApiBase());
}
