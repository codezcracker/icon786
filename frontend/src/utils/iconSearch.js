// Iconify API — commercial-safe catalog only (MIT / Apache / ISC / CC0)
import {
  isPermissivePrefix,
  filterIconIds,
  PERMISSIVE_STATS,
} from './permissiveLicenses';
import {
  exportSvgToPng,
  exportSvgToJpg,
  exportSvgToWebP,
} from './svgExport';

export { PERMISSIVE_STATS };

const ICONIFY_API = 'https://api.iconify.design';

// Cache holds the FULL result list per query+prefix. We fetch once and
// paginate client-side, because Iconify's /search has no offset support
// (it rejects a `start` param) and caps at 999 results.
let fullResultCache = {};

async function fetchFullResults(query, prefix) {
  const q = (query || '').trim();

  if (prefix && !isPermissivePrefix(prefix)) {
    return [];
  }

  // No search text → list the ENTIRE collection (could be thousands of icons)
  if (!q && prefix) {
    try {
      const res = await fetch(`${ICONIFY_API}/collection?prefix=${encodeURIComponent(prefix)}`);
      if (!res.ok) throw new Error('collection failed');
      const data = await res.json();
      const names = [
        ...(data.uncategorized || []),
        ...(data.categories ? Object.values(data.categories).flat() : []),
      ];
      return names.map((n) => `${prefix}:${n}`);
    } catch (e) {
      console.warn('Collection fetch failed:', e);
      return [];
    }
  }

  // Otherwise full-text search (max 999 results, no offset)
  try {
    const params = new URLSearchParams({ query: q || 'home', limit: '999' });
    if (prefix) params.set('prefix', prefix);
    const res = await fetch(`${ICONIFY_API}/search?${params}`);
    if (!res.ok) throw new Error('search failed');
    const data = await res.json();
    return filterIconIds(data.icons || []);
  } catch (e) {
    console.warn('Search fallback:', e);
    return generateFallbackIcons(query, prefix, 0, 120);
  }
}

export async function searchIcons(query, prefix, offset = 0, limit = 60) {
  const cacheKey = `${query || ''}::${prefix || ''}`;
  if (!fullResultCache[cacheKey]) {
    fullResultCache[cacheKey] = await fetchFullResults(query, prefix);
  }
  const full = fullResultCache[cacheKey];
  return full.slice(offset, offset + limit);
}

import { apiUrl, hasBackend } from './api';

// SVG Repo source (Public Domain / CC0). Returns { configured, icons:[{id,title,url}], next }
let svgRepoCache = {};
export async function searchSvgRepo(query, start = 0, limit = 20) {
  if (!hasBackend()) {
    return { configured: false, icons: [], next: null };
  }
  const key = `${query}::${start}::${limit}`;
  if (svgRepoCache[key]) return svgRepoCache[key];
  try {
    const params = new URLSearchParams({ q: query || 'icon', limit: String(limit), start: String(start) });
    const res = await fetch(`${apiUrl('/api/icons/svgrepo')}?${params}`);
    if (!res.ok) throw new Error('svgrepo failed');
    const data = await res.json();
    svgRepoCache[key] = data;
    return data;
  } catch (e) {
    console.warn('SVG Repo fetch failed:', e);
    return { configured: true, icons: [], next: null, error: e.message };
  }
}

export async function getIconSVG(prefix, name, color = 'currentColor') {
  try {
    const res = await fetch(`${ICONIFY_API}/${prefix}/${name}.svg?color=${encodeURIComponent(color)}`);
    if (!res.ok) throw new Error('Failed to get SVG');
    return await res.text();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getIconData(prefix, name) {
  try {
    const res = await fetch(`${ICONIFY_API}/${prefix}.json?icons=${name}`);
    if (!res.ok) throw new Error('Failed to get icon data');
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getCollectionIcons(prefix, limit = 200) {
  try {
    const res = await fetch(`${ICONIFY_API}/collection?prefix=${prefix}&pretty=1`);
    if (!res.ok) throw new Error('Failed to get collection');
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

let _collectionsCache = null;

// Permissive collections only (~134 sets, ~201k icons). Sorted by icon count.
export async function getAllCollections() {
  if (_collectionsCache) return _collectionsCache;
  try {
    const res = await fetch(`${ICONIFY_API}/collections`);
    if (!res.ok) throw new Error('Failed');
    const raw = await res.json();

    const arr = Object.entries(raw)
      .filter(([prefix]) => isPermissivePrefix(prefix))
      .map(([prefix, info]) => ({
      prefix,
      name: info.name || prefix,
      total: info.total || 0,
      category: info.category || 'Other',
      palette: !!info.palette,                       // multicolor set
      samples: info.samples || [],                   // real, valid icon names
      license: (info.license && info.license.title) || 'Open Source',
      author: (info.author && info.author.name) || '',
      color: colorForPrefix(prefix),
    })).sort((a, b) => b.total - a.total);

    _collectionsCache = arr;
    return arr;
  } catch (e) {
    console.error(e);
    return [];
  }
}

// Deterministic brand-ish color per collection prefix (stable across renders)
export function colorForPrefix(prefix) {
  let h = 0;
  for (let i = 0; i < prefix.length; i++) h = (h * 31 + prefix.charCodeAt(i)) % 360;
  // keep saturation/lightness pleasant
  return `hsl(${h}, 62%, 52%)`;
}

function generateFallbackIcons(query, prefix, offset, limit) {
  const sets = prefix
    ? (isPermissivePrefix(prefix) ? [prefix] : [])
    : ['mdi', 'ph', 'tabler', 'lucide', 'ri', 'bi', 'carbon', 'fluent'];
  const icons = [];
  const terms = ['home', 'user', 'heart', 'star', 'arrow-right', 'arrow-left', 'check', 'close', 'menu', 'search', 'settings', 'mail', 'phone', 'camera', 'image', 'video', 'music', 'code', 'file', 'folder'];
  for (let i = offset; i < offset + limit; i++) {
    const set = sets[i % sets.length];
    const term = terms[i % terms.length];
    icons.push(`${set}:${term}`);
  }
  return icons;
}

/** @deprecated Use exportSvgToPng with options */
export function svgToPng(svgString, size = 512, options = {}) {
  return exportSvgToPng(svgString, { maxSize: size, ...options });
}

export function svgToJpg(svgString, size = 512, bg = '#ffffff', options = {}) {
  return exportSvgToJpg(svgString, { maxSize: size, background: bg, ...options });
}

export function svgToWebP(svgString, size = 512, options = {}) {
  return exportSvgToWebP(svgString, { maxSize: size, ...options });
}
