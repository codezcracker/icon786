// Icons served from our backend (@iconify/json on disk — no Iconify API dependency)
import {
  isPermissivePrefix,
  PERMISSIVE_STATS,
} from './permissiveLicenses';
import {
  exportSvgToPng,
  exportSvgToJpg,
  exportSvgToWebP,
} from './svgExport';
import { apiUrl } from './api';

export { PERMISSIVE_STATS };

let fullResultCache = {};

async function fetchFullResults(query, prefix) {
  const q = (query || '').trim();

  if (prefix && !isPermissivePrefix(prefix)) {
    return [];
  }

  if (!q && prefix) {
    try {
      const res = await fetch(`${apiUrl('/api/icons/collection')}?prefix=${encodeURIComponent(prefix)}`);
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

  try {
    const params = new URLSearchParams({ q: q || 'home', limit: '999' });
    if (prefix) params.set('prefix', prefix);
    const res = await fetch(`${apiUrl('/api/icons/search')}?${params}`);
    if (!res.ok) throw new Error('search failed');
    const data = await res.json();
    return data.icons || [];
  } catch (e) {
    console.warn('Search failed:', e);
    return [];
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

let svgRepoCache = {};
export async function searchSvgRepo(query, start = 0, limit = 20) {
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
    const params = new URLSearchParams({ color });
    const res = await fetch(`${apiUrl(`/api/icons/svg/${prefix}/${name}`)}?${params}`);
    if (!res.ok) throw new Error('Failed to get SVG');
    return await res.text();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getIconData(prefix, name) {
  try {
    const res = await fetch(apiUrl(`/api/icons/data/${prefix}/${name}`));
    if (!res.ok) throw new Error('Failed to get icon data');
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getCollectionIcons(prefix) {
  try {
    const res = await fetch(`${apiUrl('/api/icons/collection')}?prefix=${encodeURIComponent(prefix)}`);
    if (!res.ok) throw new Error('Failed to get collection');
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

let _collectionsCache = null;

export async function getAllCollections() {
  if (_collectionsCache) return _collectionsCache;
  try {
    const res = await fetch(apiUrl('/api/icons/collections'));
    if (!res.ok) throw new Error('Failed');
    const raw = await res.json();

    const arr = Object.entries(raw)
      .map(([prefix, info]) => ({
        prefix,
        name: info.name || prefix,
        total: info.total || 0,
        category: info.category || 'Other',
        palette: !!info.palette,
        samples: info.samples || [],
        license: (info.license && info.license.title) || '',
        author: (info.author && info.author.name) || '',
        color: colorForPrefix(prefix),
      }))
      .sort((a, b) => b.total - a.total);

    _collectionsCache = arr;
    return arr;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function colorForPrefix(prefix) {
  let h = 0;
  for (let i = 0; i < prefix.length; i++) h = (h * 31 + prefix.charCodeAt(i)) % 360;
  return `hsl(${h}, 62%, 52%)`;
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
