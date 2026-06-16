// test/intakeDedup.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { rankDuplicates } = require('../src/lib/intakeDedup');

const cands = [
  { id: '1', name: 'Heaven\'s Gate', kind: 'org' },
  { id: '2', name: 'NXIVM', kind: 'org' },
  { id: '3', name: 'Peoples Temple / Jonestown', kind: 'proposal' },
];

test('exact normalized match scores 1 and sorts first', () => {
  const r = rankDuplicates('heavens gate', cands);
  assert.strictEqual(r[0].id, '1');
  assert.strictEqual(r[0].score, 1);
  assert.strictEqual(r[0].exact, true);
});

test('fuzzy near-match is flagged above threshold', () => {
  const r = rankDuplicates('Peoples Temple Jonestown', cands, { threshold: 0.6 });
  assert.ok(r.some((c) => c.id === '3' && c.score >= 0.6));
});

test('no match returns empty', () => {
  const r = rankDuplicates('Totally Unrelated Group 9000', cands, { threshold: 0.6 });
  assert.strictEqual(r.length, 0);
});

test('results sorted by score descending', () => {
  const r = rankDuplicates('NXIVM', cands, { threshold: 0.3 });
  for (let i = 0; i < r.length - 1; i++) assert.ok(r[i].score >= r[i + 1].score);
});
