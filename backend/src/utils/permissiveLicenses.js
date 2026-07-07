const catalog = require('../data/permissive-prefixes.json');

const PERMISSIVE_PREFIXES = new Set(catalog.prefixes);

function isPermissivePrefix(prefix) {
  return PERMISSIVE_PREFIXES.has(prefix);
}

function filterIconIds(iconIds) {
  return (iconIds || []).filter((id) => {
    if (typeof id !== 'string' || !id.includes(':')) return false;
    return PERMISSIVE_PREFIXES.has(id.split(':')[0]);
  });
}

function assertPermissivePrefix(prefix, res) {
  if (!isPermissivePrefix(prefix)) {
    res.status(403).json({
      error: 'This icon set is not in the commercial-safe catalog (MIT, Apache, ISC, CC0 only).',
    });
    return false;
  }
  return true;
}

module.exports = {
  PERMISSIVE_STATS: {
    setCount: catalog.setCount,
    totalIcons: catalog.totalIcons,
  },
  isPermissivePrefix,
  filterIconIds,
  assertPermissivePrefix,
};
