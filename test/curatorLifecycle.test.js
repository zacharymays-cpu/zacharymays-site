// test/curatorLifecycle.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { normalizeName, nextStatusFor } = require('../src/lib/curatorLifecycle');

test('normalizeName strips punctuation/case/spacing', () => {
  assert.strictEqual(normalizeName("Peoples Temple / Jonestown"), 'peoplestemplejonestown');
  assert.strictEqual(normalizeName("Heaven's Gate"), 'heavensgate');
  assert.strictEqual(normalizeName('  NXIVM  '), 'nxivm');
});

test('approve publishes a PENDING org', () => {
  assert.strictEqual(nextStatusFor('approve', 'PENDING'), 'ACCEPTED');
  assert.strictEqual(nextStatusFor('approve', 'SOURCES_INSUFFICIENT'), 'ACCEPTED');
});

test('approve does not change an already-ACCEPTED org status', () => {
  assert.strictEqual(nextStatusFor('approve', 'ACCEPTED'), null); // null = leave status unchanged
});

test('reject archives regardless of current status', () => {
  assert.strictEqual(nextStatusFor('reject', 'PENDING'), 'ARCHIVED');
  assert.strictEqual(nextStatusFor('reject', 'ACCEPTED'), 'ARCHIVED');
});

test('modify and request_evidence never change status', () => {
  assert.strictEqual(nextStatusFor('modify', 'PENDING'), null);
  assert.strictEqual(nextStatusFor('request_evidence', 'ACCEPTED'), null);
});
