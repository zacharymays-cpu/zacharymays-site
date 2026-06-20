const { test } = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const { blindIndex, pLabel, normalize } = require('../../src/lib/identity/blindIndex.js');

const TEST_HMAC_HEX = 'ab'.repeat(32);
function expectedBidx(name) {
  const norm = name.toLowerCase().split(/\s+/).filter(Boolean).join(' ');
  return crypto.createHmac('sha256', Buffer.from(TEST_HMAC_HEX, 'hex')).update(norm, 'utf8').digest('hex');
}

test('normalize collapses whitespace + lowercases', () => {
  assert.strictEqual(normalize('  Jane   DOE '), 'jane doe');
});

test('blindIndex matches HMAC-SHA256 of normalized name (cross-language parity)', () => {
  assert.strictEqual(blindIndex('  Jane   DOE ', TEST_HMAC_HEX), blindIndex('jane doe', TEST_HMAC_HEX));
  assert.strictEqual(blindIndex('Jane Doe', TEST_HMAC_HEX), expectedBidx('Jane Doe'));
  assert.strictEqual(blindIndex('Jane Doe', TEST_HMAC_HEX).length, 64);
  assert.notStrictEqual(blindIndex('jane doe', TEST_HMAC_HEX), blindIndex('john doe', TEST_HMAC_HEX));
});

test('pLabel derives P-<first 8 of uuid>', () => {
  assert.strictEqual(pLabel('550e8400-e29b-41d4-a716-446655440000'), 'P-550e8400');
});
