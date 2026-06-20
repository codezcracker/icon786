#!/usr/bin/env node
/**
 * Copy permissive icon sets into packages/icon786-icons (owned by Icon786).
 * Run from repo root: node scripts/vendor-icons.js
 *
 * Requires a one-time source at backend/node_modules/@iconify/json
 * (npm run install:all in backend). After vendoring, the app uses only
 * packages/icon786-icons — no Iconify npm packages at runtime.
 */
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '../backend/node_modules/@iconify/json');
const SOURCE_JSON = path.join(SOURCE, 'json');
const OUT = path.join(__dirname, '../packages/icon786-icons');
const OUT_JSON = path.join(OUT, 'json');

const catalog = require('../backend/src/data/permissive-prefixes.json');

if (!fs.existsSync(SOURCE_JSON)) {
  console.error('Missing icon source. Run: cd backend && npm install @iconify/json');
  console.error('Then run this script once to vendor icons into packages/icon786-icons/');
  process.exit(1);
}

fs.mkdirSync(OUT_JSON, { recursive: true });

const allCollections = JSON.parse(
  fs.readFileSync(path.join(SOURCE, 'collections.json'), 'utf8')
);
const filteredCollections = {};

let copied = 0;
for (const prefix of catalog.prefixes) {
  const src = path.join(SOURCE_JSON, `${prefix}.json`);
  const dest = path.join(OUT_JSON, `${prefix}.json`);
  if (!fs.existsSync(src)) {
    console.warn(`  skip missing: ${prefix}`);
    continue;
  }
  fs.copyFileSync(src, dest);
  filteredCollections[prefix] = allCollections[prefix];
  copied++;
  if (copied % 20 === 0) console.log(`  copied ${copied}/${catalog.prefixes.length}…`);
}

fs.writeFileSync(
  path.join(OUT, 'collections.json'),
  JSON.stringify(filteredCollections, null, 2)
);
fs.writeFileSync(
  path.join(OUT, 'prefixes.json'),
  JSON.stringify(catalog, null, 2)
);

console.log(`Done: ${copied} sets → packages/icon786-icons/json/`);
