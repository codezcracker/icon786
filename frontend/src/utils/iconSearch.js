// Icons served from @icon786/icons on the server
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

const fullResultCache = new Map();
const svgBatchCache = new Map();
let searchGeneration = 0;

function cacheKey(query, prefix) {
  return `${(query || '').trim().toLowerCase()}::${prefix || ''}`;
}

async function fetchFullResults(query, prefix, generation) {
  const q = (query || '').trim();

  if (prefix && !isPermissivePrefix(prefix)) {
    return { icons: [], suggestions: [] };
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
      return { icons: names.map((n) => `${prefix}:${n}`), suggestions: [] };
    } catch (e) {
      console.warn('Collection fetch failed:', e);
      return { icons: [], suggestions: [] };
    }
  }

  try {
    const params = new URLSearchParams({ limit: '999' });
    if (q) params.set('q', q);
    if (prefix) params.set('prefix', prefix);
    const res = await fetch(`${apiUrl('/api/icons/search')}?${params}`);
    if (!res.ok) throw new Error('search failed');
    const data = await res.json();
    if (generation !== searchGeneration) return null;
    return {
      icons: data.icons || [],
      suggestions: data.suggestions || [],
    };
  } catch (e) {
    console.warn('Search failed:', e);
    return { icons: [], suggestions: [] };
  }
}

export async function searchIcons(query, prefix, offset = 0, limit = 60) {
  const key = cacheKey(query, prefix);
  if (!fullResultCache.has(key)) {
    const generation = searchGeneration;
    const result = await fetchFullResults(query, prefix, generation);
    if (result) fullResultCache.set(key, result);
  }
  const cached = fullResultCache.get(key) || { icons: [], suggestions: [] };
  return {
    icons: cached.icons.slice(offset, offset + limit),
    suggestions: offset === 0 ? cached.suggestions : [],
    total: cached.icons.length,
  };
}

export function invalidateSearchCache() {
  searchGeneration += 1;
  fullResultCache.clear();
}

export async function fetchIconBatch(iconIds) {
  const missing = iconIds.filter((id) => id && !svgBatchCache.has(id));
  if (missing.length) {
    try {
      const res = await fetch(apiUrl('/api/icons/batch-svg'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icons: missing }),
      });
      if (res.ok) {
        const data = await res.json();
        for (const [id, svg] of Object.entries(data.svgs || {})) {
          svgBatchCache.set(id, svg);
        }
      }
    } catch (e) {
      console.warn('Batch SVG fetch failed:', e);
    }
  }
  const out = {};
  for (const id of iconIds) {
    if (svgBatchCache.has(id)) out[id] = svgBatchCache.get(id);
  }
  return out;
}

export function getCachedSvg(iconId) {
  return svgBatchCache.get(iconId) || null;
}

export async function getIconSVG(prefix, name, color = 'currentColor') {
  const id = `${prefix}:${name}`;
  if (svgBatchCache.has(id)) return svgBatchCache.get(id);
  try {
    const params = new URLSearchParams({ color });
    const res = await fetch(`${apiUrl(`/api/icons/svg/${prefix}/${name}`)}?${params}`);
    if (!res.ok) throw new Error('Failed to get SVG');
    const text = await res.text();
    svgBatchCache.set(id, text);
    return text;
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
