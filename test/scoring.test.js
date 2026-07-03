// test/scoring.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const {
  TRACKS,
  classifyYoung,
  classifyComposite,
  compositeBandFromTier,
  compositeDbTierFromScore,
  youngBandFromDb,
  classifyLifton,
} = require('../src/lib/scoring');

test('three tracks exist with distinct registers and no shared strings', () => {
  assert.strictEqual(TRACKS.young.register, 'Cultiness');
  assert.strictEqual(TRACKS.composite.register, 'Neutral');
  assert.strictEqual(TRACKS.lifton.register, 'Totalism');
  const young = TRACKS.young.bands.map(b => b.label);
  const comp = TRACKS.composite.bands.map(b => b.label);
  // Young and Composite must not share any label string (the core defect).
  assert.strictEqual(young.some(l => comp.includes(l)), false);
});

test('Young cut-lines: 0-2 Not, 3-5 Kinda, 6+ Super', () => {
  assert.strictEqual(classifyYoung(0).id, 'not');
  assert.strictEqual(classifyYoung(2).id, 'not');
  assert.strictEqual(classifyYoung(3).id, 'kinda');
  assert.strictEqual(classifyYoung(5).id, 'kinda');
  assert.strictEqual(classifyYoung(6).id, 'super');
  assert.strictEqual(classifyYoung(10).id, 'super');
  assert.strictEqual(classifyYoung(null), null);
  assert.strictEqual(classifyYoung(NaN), null);
});

test('Young bands use Cultiness labels', () => {
  assert.strictEqual(classifyYoung(8).label, 'Super Culty');
  assert.strictEqual(classifyYoung(4).label, 'Kinda Culty');
  assert.strictEqual(classifyYoung(1).label, 'Not Culty');
});

test('Composite canonical cut-lines are 30/60 (NOT 41/71)', () => {
  assert.strictEqual(classifyComposite(0).id, 'low');
  assert.strictEqual(classifyComposite(29).id, 'low');
  assert.strictEqual(classifyComposite(30).id, 'moderate');
  assert.strictEqual(classifyComposite(59).id, 'moderate');
  assert.strictEqual(classifyComposite(60).id, 'high');
  assert.strictEqual(classifyComposite(100).id, 'high');
  // Regression guard for the findings bug: 65 must be High (was "Kinda"/moderate under 71 cut).
  assert.strictEqual(classifyComposite(65).id, 'high');
  assert.strictEqual(classifyComposite(null), null);
});

test('Composite bands use neutral labels', () => {
  assert.strictEqual(classifyComposite(70).label, 'High-Control');
  assert.strictEqual(classifyComposite(40).label, 'Moderate-Control');
  assert.strictEqual(classifyComposite(10).label, 'Low-Control');
});

test('compositeBandFromTier maps stored Cultiness strings to neutral bands', () => {
  assert.strictEqual(compositeBandFromTier('Super Culty').label, 'High-Control');
  assert.strictEqual(compositeBandFromTier('Kinda Culty').label, 'Moderate-Control');
  assert.strictEqual(compositeBandFromTier('Not Culty').label, 'Low-Control');
  assert.strictEqual(compositeBandFromTier('garbage'), null);
  assert.strictEqual(compositeBandFromTier(null), null);
});

test('compositeBandFromTier agrees with classifyComposite at representative scores', () => {
  // 65 stored as "Super Culty" (>=60) → High both ways.
  assert.strictEqual(compositeBandFromTier('Super Culty').id, classifyComposite(65).id);
  // 45 stored as "Kinda Culty" (30–59) → Moderate both ways.
  assert.strictEqual(compositeBandFromTier('Kinda Culty').id, classifyComposite(45).id);
});

test('compositeDbTierFromScore maps score to STORED tier string via 30/60', () => {
  assert.strictEqual(compositeDbTierFromScore(0), 'Not Culty');
  assert.strictEqual(compositeDbTierFromScore(29), 'Not Culty');
  assert.strictEqual(compositeDbTierFromScore(30), 'Kinda Culty');
  assert.strictEqual(compositeDbTierFromScore(59), 'Kinda Culty');
  assert.strictEqual(compositeDbTierFromScore(60), 'Super Culty');
  assert.strictEqual(compositeDbTierFromScore(100), 'Super Culty');
  assert.strictEqual(compositeDbTierFromScore(null), null);
  assert.strictEqual(compositeDbTierFromScore(NaN), null);
});
test('compositeDbTierFromScore is the inverse of compositeBandFromTier', () => {
  assert.strictEqual(compositeBandFromTier(compositeDbTierFromScore(65)).id, 'high');
  assert.strictEqual(compositeBandFromTier(compositeDbTierFromScore(45)).id, 'moderate');
  assert.strictEqual(compositeBandFromTier(compositeDbTierFromScore(10)).id, 'low');
});

test('youngBandFromDb keeps Cultiness labels', () => {
  assert.strictEqual(youngBandFromDb('Super Culty').label, 'Super Culty');
  assert.strictEqual(youngBandFromDb('Not Culty').id, 'not');
  assert.strictEqual(youngBandFromDb(null), null);
});

test('Lifton cut-lines: <3 Non, 3-5.99 Moderately, 6+ Psychologically', () => {
  assert.strictEqual(classifyLifton(0).id, 'non');
  assert.strictEqual(classifyLifton(2.9).id, 'non');
  assert.strictEqual(classifyLifton(3).id, 'moderately');
  assert.strictEqual(classifyLifton(5.9).id, 'moderately');
  assert.strictEqual(classifyLifton(6).id, 'psychologically');
  assert.strictEqual(classifyLifton(10).id, 'psychologically');
  assert.strictEqual(classifyLifton(null), null);
});

test('Lifton bands use Totalism labels and short forms', () => {
  assert.strictEqual(classifyLifton(8).label, 'Psychologically Totalizing');
  assert.strictEqual(classifyLifton(8).short, 'Totalizing');
  assert.strictEqual(classifyLifton(4).short, 'Moderate');
  assert.strictEqual(classifyLifton(1).short, 'Non-Totalizing');
});
