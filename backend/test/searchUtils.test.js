const { test } = require('node:test');
const assert = require('node:assert/strict');
const { expandQuery, getSuggestions } = require('../src/utils/searchUtils');

test('expandQuery adds synonyms', () => {
  const terms = expandQuery('home');
  assert.ok(terms.includes('home'));
  assert.ok(terms.some((t) => t.includes('house') || t === 'homepage'));
});

test('getSuggestions returns related terms', () => {
  const suggestions = getSuggestions('set', 5);
  assert.ok(Array.isArray(suggestions));
  assert.ok(suggestions.length > 0);
});
