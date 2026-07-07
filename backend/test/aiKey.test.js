const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cleanKey } = require('../src/services/aiService');

test('cleanKey strips quotes and KEY=value paste mistakes', () => {
  assert.equal(cleanKey('hf_abc123'), 'hf_abc123');
  assert.equal(cleanKey('"hf_abc123"'), 'hf_abc123');
  assert.equal(cleanKey("HUGGINGFACE_API_KEY=hf_abc123"), 'hf_abc123');
  assert.equal(cleanKey('  hf_token=value  '), 'value');
});

test('cleanKey returns empty for invalid input', () => {
  assert.equal(cleanKey(''), '');
  assert.equal(cleanKey(null), '');
});
