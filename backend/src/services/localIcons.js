const fs = require('fs');
const path = require('path');
const icon786Icons = require('@icon786/icons');
const catalog = require('../data/permissive-prefixes.json');
const { isPermissivePrefix } = require('../utils/permissiveLicenses');

const collectionsMeta = icon786Icons.getCollections();

const MAX_CACHE = 4;
const iconSetCache = new Map();

const PREFIXES_BY_SIZE = [...catalog.prefixes].sort(
  (a, b) => (collectionsMeta[b]?.total || 0) - (collectionsMeta[a]?.total || 0)
);

function trimCache() {
  while (iconSetCache.size > MAX_CACHE) {
    const oldest = iconSetCache.keys().next().value;
    iconSetCache.delete(oldest);
  }
}

function loadIconSet(prefix, { retain = true } = {}) {
  if (!isPermissivePrefix(prefix)) return null;
  if (iconSetCache.has(prefix)) {
    const hit = iconSetCache.get(prefix);
    iconSetCache.delete(prefix);
    if (retain) iconSetCache.set(prefix, hit);
    return hit;
  }
  try {
    const file = icon786Icons.locate(prefix);
    if (!fs.existsSync(file)) return null;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (retain) {
      iconSetCache.set(prefix, data);
      trimCache();
    }
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

function searchInSet(prefix, q, max) {
  const data = loadIconSet(prefix, { retain: false });
  if (!data) return [];
  const names = [
    ...Object.keys(data.icons || {}),
    ...Object.keys(data.aliases || {}),
  ];
  const results = [];
  for (const name of names) {
    if (!q || name.toLowerCase().includes(q) || prefix.includes(q)) {
      results.push(`${prefix}:${name}`);
      if (results.length >= max) break;
    }
  }
  return results;
}

async function search(query, prefix, limit = 999) {
  const q = (query || '').trim().toLowerCase();
  const max = Math.min(Math.max(parseInt(limit, 10) || 999, 1), 9999);

  if (prefix) {
    if (!isPermissivePrefix(prefix)) return [];
    return searchInSet(prefix, q, max);
  }

  const results = [];
  for (const p of PREFIXES_BY_SIZE) {
    if (results.length >= max) break;
    const found = searchInSet(p, q, max - results.length);
    results.push(...found);
  }
  return results;
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
};
