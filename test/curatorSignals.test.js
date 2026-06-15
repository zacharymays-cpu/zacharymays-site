// test/curatorSignals.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { computeSignals, priorityScore } = require('../src/lib/curatorSignals');

test('flags low evidence completeness', () => {
  const signals = computeSignals({ hcRating: 'moderate', confidenceOverall: 0.8, brief: { evidenceCompleteness: 0.3 } });
  assert.ok(signals.some((s) => s.type === 'low_evidence'));
});

test('flags severe HC rating as boundary case', () => {
  const signals = computeSignals({ hcRating: 'severe', confidenceOverall: 0.9, brief: null });
  assert.ok(signals.some((s) => s.type === 'boundary'));
});

test('flags low overall confidence', () => {
  const signals = computeSignals({ hcRating: 'low', confidenceOverall: 0.4, brief: null });
  assert.ok(signals.some((s) => s.type === 'confidence'));
});

test('no signals when all clear', () => {
  const signals = computeSignals({ hcRating: 'low', confidenceOverall: 0.9, brief: { evidenceCompleteness: 0.8 } });
  assert.strictEqual(signals.length, 0);
});

test('priorityScore averages severities and caps at 1', () => {
  assert.strictEqual(priorityScore([]), 0);
  assert.strictEqual(priorityScore([{ severity: 0.8 }, { severity: 0.6 }]), 0.7);
  assert.ok(priorityScore([{ severity: 1 }, { severity: 1 }]) <= 1);
});
