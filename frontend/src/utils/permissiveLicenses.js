import catalog from '../data/permissive-prefixes.json';

/** MIT / Apache / ISC / CC0 sets — no attribution, no share-alike, no brand-logo sets */
export const PERMISSIVE_PREFIXES = new Set(catalog.prefixes);

export const PERMISSIVE_STATS = {
  setCount: catalog.setCount,
  totalIcons: catalog.totalIcons,
  generated: catalog.generated,
};

export function isPermissivePrefix(prefix) {
  return PERMISSIVE_PREFIXES.has(prefix);
}

export function filterIconIds(iconIds) {
  return iconIds.filter((id) => {
    if (typeof id !== 'string' || !id.includes(':')) return false;
    return PERMISSIVE_PREFIXES.has(id.split(':')[0]);
  });
}
