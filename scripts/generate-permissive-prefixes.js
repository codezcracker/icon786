#!/usr/bin/env node
/**
 * Regenerate permissive-prefixes.json from @iconify/json metadata.
 * Run from repo root: node scripts/generate-permissive-prefixes.js
 */
const fs = require('fs');
const path = require('path');

const collections = require('../frontend/node_modules/@iconify/json/collections.json');

const PERMISSIVE = /^(MIT|Apache 2\.0|ISC|Unlicense|0BSD|BSD|CC0|Public Domain)/i;
const ATTRIBUTION = /CC BY(?!-SA)/i;
const SHAREALIKE = /CC BY-SA|GPL|LGPL|OFL/i;
const TRADEMARK = new Set([
  'simple-icons', 'logos', 'devicon', 'skill-icons', 'fa6-brands', 'fa-brands',
  'vscode-icons', 'cib', 'bxl', 'brandico', 'entypo-social', 'zmdi', 'flat-ui',
  'cryptocurrency', 'cryptocurrency-color', 'arcticons', 'streamline-logos',
]);

function isPermissive(prefix, info) {
  if (TRADEMARK.has(prefix)) return false;
  const lic = (info.license && info.license.title) || '';
  if (SHAREALIKE.test(lic)) return false;
  if (ATTRIBUTION.test(lic)) return false;
  if (PERMISSIVE.test(lic)) return true;
  if (/CC BY/i.test(lic)) return false;
  return false;
}

const prefixes = [];
let total = 0;
for (const [prefix, info] of Object.entries(collections)) {
  if (isPermissive(prefix, info)) {
    prefixes.push(prefix);
    total += info.total || 0;
  }
}
prefixes.sort();

const out = {
  generated: new Date().toISOString().slice(0, 10),
  prefixes,
  setCount: prefixes.length,
  totalIcons: total,
};

const targets = [
  'frontend/src/data/permissive-prefixes.json',
  'backend/src/data/permissive-prefixes.json',
];

for (const rel of targets) {
  const file = path.join(__dirname, '..', rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
  console.log('Wrote', rel);
}

console.log(`Catalog: ${out.setCount} sets, ${out.totalIcons.toLocaleString()} icons`);
