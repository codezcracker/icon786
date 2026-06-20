const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const JSON_DIR = path.join(ROOT, 'json');

function locate(prefix) {
  return path.join(JSON_DIR, `${prefix}.json`);
}

function loadSet(prefix) {
  const file = locate(prefix);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function getCollections() {
  return require('./collections.json');
}

function getCatalog() {
  return require('./prefixes.json');
}

function listPrefixes() {
  return getCatalog().prefixes;
}

module.exports = {
  ROOT,
  JSON_DIR,
  locate,
  loadSet,
  getCollections,
  getCatalog,
  listPrefixes,
};
