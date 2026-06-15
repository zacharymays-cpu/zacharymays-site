// src/lib/curatorSignals.js
// Pure curator review signals. No I/O — unit-tested with node --test.
// A "signal" is a reason an org needs human eyes, with a 0–1 severity.

const EVIDENCE_COMPLETENESS_LOW = 0.4; // <40% of criteria with 3+ sources
const CONFIDENCE_LOW = 0.6;            // overall HC confidence floor

function computeSignals(org) {
  const signals = [];
  const brief = org.brief || null;

  if (brief && typeof brief.evidenceCompleteness === 'number' && brief.evidenceCompleteness < EVIDENCE_COMPLETENESS_LOW) {
    signals.push({
      type: 'low_evidence',
      severity: 0.7,
      reason: `Evidence completeness ${(brief.evidenceCompleteness * 100).toFixed(0)}% below threshold`,
      recommendation: 'Flag under-sourced criteria for additional research',
    });
  }

  if (org.hcRating === 'severe') {
    signals.push({
      type: 'boundary',
      severity: 0.6,
      reason: 'Severe HC rating warrants human verification',
      recommendation: 'Verify extreme control indicators are well-supported',
    });
  }

  if (typeof org.confidenceOverall === 'number' && org.confidenceOverall < CONFIDENCE_LOW) {
    signals.push({
      type: 'confidence',
      severity: 0.5,
      reason: `Low overall confidence (${(org.confidenceOverall * 100).toFixed(0)}%)`,
      recommendation: 'Request additional sources for low-confidence criteria',
    });
  }

  return signals;
}

function priorityScore(signals) {
  if (!signals || signals.length === 0) return 0;
  const avg = signals.reduce((a, s) => a + s.severity, 0) / signals.length;
  return Math.min(1, Math.round(avg * 100) / 100);
}

module.exports = { computeSignals, priorityScore, EVIDENCE_COMPLETENESS_LOW, CONFIDENCE_LOW };
