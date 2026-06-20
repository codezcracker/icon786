const fs = require('fs');
const icon786Icons = require('@icon786/icons');
const catalog = require('../data/permissive-prefixes.json');
const { isPermissivePrefix } = require('../utils/permissiveLicenses');
const { expandQuery, scoreIconName, getSuggestions, fuzzyScore: termFuzzy, POPULAR_TERMS } = require('../utils/searchUtils');

const collectionsMeta = icon786Icons.getCollections();

const MAX_CACHE = 8;
const iconSetCache = new Map();

const PREFIXES_BY_SIZE = [...catalog.prefixes].sort(
  (a, b) => (collectionsMeta[b]?.total || 0) - (collectionsMeta[a]?.total || 0)
);

const DEFAULT_BROWSE = [
  'mdi:home', 'mdi:account', 'mdi:magnify', 'mdi:cog', 'mdi:heart', 'mdi:star',
  'ph:house-bold', 'ph:user-bold', 'ph:magnifying-glass-bold', 'ph:gear-bold',
  'tabler:home', 'tabler:user', 'tabler:search', 'tabler:settings',
  'lucide:home', 'lucide:user', 'lucide:search', 'lucide:settings',
  'ri:home-line', 'ri:user-line', 'ri:search-line', 'ri:settings-line',
];

function trimCache() {
  while (iconSetCache.size > MAX_CACHE) {
    iconSetCache.delete(iconSetCache.keys().next().value);
  }
}

function loadIconSet(prefix) {
  if (!isPermissivePrefix(prefix)) return null;
  if (iconSetCache.has(prefix)) return iconSetCache.get(prefix);
  try {
    const file = icon786Icons.locate(prefix);
    if (!fs.existsSync(file)) return null;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    iconSetCache.set(prefix, data);
    trimCache();
    return data;
  } catch (e) {
    console.warn(`Failed to load icon set "${prefix}":`, e.message);
    return null;
  }
}

function resolveIcon(data, name) {
  if (!data) return null;
  if (data.icons[name]) return data.icons[name];
  const alias = data.aliases?.[name];
  if (alias?.parent && data.icons[alias.parent]) {
    return { ...data.icons[alias.parent], ...alias };
  }
  return null;
}

function strictScore(name, terms) {
  if (!terms.length) return 1;
  const n = name.toLowerCase();
  const parts = n.split(/[-_./]+/);
  let best = 0;
  for (const term of terms) {
    if (!term) continue;
    if (n === term) best = Math.max(best, 100);
    else if (n.startsWith(term)) best = Math.max(best, 85);
    else if (parts.some((p) => p === term)) best = Math.max(best, 75);
    else if (parts.some((p) => p.startsWith(term))) best = Math.max(best, 65);
    else if (n.includes(term)) best = Math.max(best, 55);
  }
  return best;
}

function searchInSet(prefix, terms, max, { fuzzy = false } = {}) {
  const data = loadIconSet(prefix);
  if (!data) return [];
  const names = [
    ...Object.keys(data.icons || {}),
    ...Object.keys(data.aliases || {}),
  ];
  const scored = [];
  const useFuzzy = fuzzy && terms.some((t) => t && t.length >= 3);

  for (const name of names) {
    let score = strictScore(name, terms);
    if (score === 0 && useFuzzy) {
      score = scoreIconName(name, terms);
      if (score < 30) continue;
    } else if (score === 0) continue;
    scored.push({ id: `${prefix}:${name}`, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max);
}

function searchAllSets(terms, max, opts) {
  const merged = new Map();
  for (const prefix of PREFIXES_BY_SIZE) {
    if (merged.size >= max * 2) break;
    const hits = searchInSet(prefix, terms, max, opts);
    for (const { id, score } of hits) {
      const prev = merged.get(id);
      if (!prev || score > prev) merged.set(id, score);
    }
  }
  return [...merged.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([id]) => id);
}

async function search(query, prefix, limit = 999) {
  const q = (query || '').trim().toLowerCase();
  const max = Math.min(Math.max(parseInt(limit, 10) || 999, 1), 9999);

  if (!q && !prefix) {
    return { icons: DEFAULT_BROWSE, suggestions: [], query: q };
  }

  const terms = expandQuery(q);
  if (!terms.length && q) terms.push(q);

  const suggestions = q.length >= 2 ? getSuggestions(q) : [];
  const isKnownTerm = POPULAR_TERMS.includes(q);
  const closeSuggestion = !isKnownTerm
    ? suggestions.find((s) => s !== q && termFuzzy(s, q) > 0.35)
    : null;
  const searchTerms = closeSuggestion ? expandQuery(closeSuggestion) : terms;

  let icons;
  if (prefix) {
    if (!isPermissivePrefix(prefix)) return { icons: [], suggestions, query: q };
    icons = searchInSet(prefix, searchTerms.length ? searchTerms : [q], max).map((x) => x.id);
  } else {
    icons = searchAllSets(searchTerms.length ? searchTerms : [q], max);
    if (!closeSuggestion && icons.length < 8) {
      const fuzzy = searchAllSets(terms.length ? terms : [q], max, { fuzzy: true });
      const seen = new Set(icons);
      for (const id of fuzzy) {
        if (!seen.has(id)) icons.push(id);
        if (icons.length >= max) break;
      }
    }
  }

  return { icons, suggestions, query: q };
}

function getCollections() {
  return collectionsMeta;
}

function getCollection(prefix) {
  const data = loadIconSet(prefix);
  if (!data) return null;
  const uncategorized = Object.keys(data.icons || {});
  const result = {
    prefix: data.prefix || prefix,
    total: uncategorized.length + Object.keys(data.aliases || {}).length,
    title: data.info?.name || collectionsMeta[prefix]?.name || prefix,
    uncategorized,
  };
  if (data.categories) result.categories = data.categories;
  return result;
}

function getIconsJSON(prefix, names) {
  const data = loadIconSet(prefix);
  if (!data) return null;
  const icons = {};
  const aliases = {};
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    if (data.icons[trimmed]) icons[trimmed] = data.icons[trimmed];
    else if (data.aliases?.[trimmed]) aliases[trimmed] = data.aliases[trimmed];
  }
  return {
    prefix: data.prefix || prefix,
    icons,
    aliases,
    width: data.width,
    height: data.height,
  };
}

function getIconSVG(prefix, name, { color = 'currentColor', width, height } = {}) {
  const data = loadIconSet(prefix);
  const icon = resolveIcon(data, name);
  if (!icon) return null;

  const w = parseInt(width, 10) || icon.width || data.width || 24;
  const h = parseInt(height, 10) || icon.height || data.height || 24;
  let body = icon.body;
  if (color && color !== 'currentColor') {
    body = body.replace(/currentColor/g, color);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

function getBatchSVG(iconIds) {
  const svgs = {};
  for (const id of iconIds) {
    if (!id || typeof id !== 'string' || !id.includes(':')) continue;
    const colon = id.indexOf(':');
    const prefix = id.slice(0, colon);
    const name = id.slice(colon + 1);
    const svg = getIconSVG(prefix, name);
    if (svg) svgs[id] = svg;
  }
  return svgs;
}

module.exports = {
  search,
  getCollections,
  getCollection,
  getIconsJSON,
  getIconSVG,
  getBatchSVG,
};
