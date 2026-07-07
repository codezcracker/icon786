const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PERMISSIVE_STATS, isPermissivePrefix } = require('../src/utils/permissiveLicenses');

test('catalog includes 200k+ icons', () => {
  assert.ok(PERMISSIVE_STATS.totalIcons > 200000);
  assert.ok(PERMISSIVE_STATS.setCount > 100);
});

test('isPermissivePrefix allows known open sets', () => {
  assert.equal(isPermissivePrefix('mdi'), true);
  assert.equal(isPermissivePrefix('not-a-real-set'), false);
});
