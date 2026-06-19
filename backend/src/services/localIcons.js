const fs = require('fs');
const { locate } = require('@iconify/json');
const collectionsMeta = require('@iconify/json/collections.json');
const catalog = require('../data/permissive-prefixes.json');
const { isPermissivePrefix } = require('../utils/permissiveLicenses');

const iconSetCache = new Map();
let searchIndex = null;
let searchIndexPromise = null;

function loadIconSet(prefix) {
  if (!isPermissivePrefix(prefix)) return null;
  if (iconSetCache.has(prefix)) return iconSetCache.get(prefix);
  try {
    const data = JSON.parse(fs.readFileSync(locate(prefix), 'utf8'));
    iconSetCache.set(prefix, data);
    return data;
  } catch (e) {
    console.warn(`Failed to load icon set "${prefix}":`, e.message);
    iconSetCache.set(prefix, null);
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

function buildSearchIndex() {
  const entries = [];
  for (const prefix of catalog.prefixes) {
    const data = loadIconSet(prefix);
    if (!data) continue;
    const add = (name) => entries.push({ id: `${prefix}:${name}`, name, prefix });
    Object.keys(data.icons || {}).forEach(add);
    Object.keys(data.aliases || {}).forEach(add);
  }
  return entries;
}

function getSearchIndex() {
  if (searchIndex) return Promise.resolve(searchIndex);
  if (!searchIndexPromise) {
    searchIndexPromise = Promise.resolve().then(() => {
      console.log('Building local icon search index…');
      const start = Date.now();
      searchIndex = buildSearchIndex();
      console.log(`Icon index ready: ${searchIndex.length} icons (${Date.now() - start}ms)`);
      return searchIndex;
    });
  }
  return searchIndexPromise;
}

async function search(query, prefix, limit = 999) {
  const q = (query || '').trim().toLowerCase();
  const max = Math.min(Math.max(parseInt(limit, 10) || 999, 1), 9999);

  if (prefix) {
    if (!isPermissivePrefix(prefix)) return [];
    const data = loadIconSet(prefix);
    if (!data) return [];
    const names = [
      ...Object.keys(data.icons || {}),
      ...Object.keys(data.aliases || {}),
    ];
    return names
      .filter((n) => !q || n.toLowerCase().includes(q))
      .slice(0, max)
      .map((n) => `${prefix}:${n}`);
  }

  const index = await getSearchIndex();
  const results = [];
  for (const entry of index) {
    if (!q || entry.name.toLowerCase().includes(q) || entry.prefix.toLowerCase().includes(q)) {
      results.push(entry.id);
      if (results.length >= max) break;
    }
  }
  return results;
}

function getCollections() {
  const out = {};
  for (const prefix of catalog.prefixes) {
    const info = collectionsMeta[prefix];
    if (info) out[prefix] = info;
  }
  return out;
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
    if (data.icons[trimmed]) {
      icons[trimmed] = data.icons[trimmed];
    } else if (data.aliases?.[trimmed]) {
      aliases[trimmed] = data.aliases[trimmed];
    }
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

module.exports = {
  search,
  getCollections,
  getCollection,
  getIconsJSON,
  getIconSVG,
  getSearchIndex,
};
