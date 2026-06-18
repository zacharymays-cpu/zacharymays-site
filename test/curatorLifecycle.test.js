// test/curatorLifecycle.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { normalizeName, nextStatusFor, isWorklistEligible } = require('../src/lib/curatorLifecycle');

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

// A live, rated, not-yet-reviewed org is the canonical worklist row.
const eligibleOrg = {
  scoring_status: 'ACCEPTED',
  is_calibration: false,
  hc_rating: 'high',
  reviewed_at: null,
};

test('worklist includes a live, rated, un-reviewed org', () => {
  assert.strictEqual(isWorklistEligible(eligibleOrg), true);
});

test('worklist excludes an org once it has been curator-reviewed', () => {
  // Approving stamps reviewed_at — the regression this guard prevents.
  assert.strictEqual(
    isWorklistEligible({ ...eligibleOrg, reviewed_at: '2026-06-18T00:00:00Z' }),
    false,
  );
});

test('worklist excludes non-ACCEPTED, calibration, and unrated orgs', () => {
  assert.strictEqual(isWorklistEligible({ ...eligibleOrg, scoring_status: 'PENDING' }), false);
  assert.strictEqual(isWorklistEligible({ ...eligibleOrg, scoring_status: 'ARCHIVED' }), false);
  assert.strictEqual(isWorklistEligible({ ...eligibleOrg, is_calibration: true }), false);
  assert.strictEqual(isWorklistEligible({ ...eligibleOrg, hc_rating: null }), false);
});

test('worklist eligibility tolerates a null/undefined org', () => {
  assert.strictEqual(isWorklistEligible(null), false);
  assert.strictEqual(isWorklistEligible(undefined), false);
});
