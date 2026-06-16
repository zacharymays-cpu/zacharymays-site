// src/lib/curatorLifecycle.js
// Pure curator lifecycle + dedup helpers. CommonJS so it loads under both
// Next/webpack and bare `node --test` (see curatorSignals.js for the same choice).

// Dedup key: lowercase, strip every non-alphanumeric. Matches the SQL used for
// the 2026-06-15 dedup (regexp_replace(name,'[^a-zA-Z0-9]','','g')).
function normalizeName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Lifecycle transition for a curator decision. Returns the new scoring_status,
// or null when the decision should NOT change status (status-only audit / score edit).
//   approve: PENDING|SOURCES_INSUFFICIENT -> ACCEPTED (publish); ACCEPTED -> null (just mark reviewed)
//   reject:  any -> ARCHIVED
//   modify / request_evidence: never change status
function nextStatusFor(decision, currentStatus) {
  if (decision === 'reject') return 'ARCHIVED';
  if (decision === 'approve') {
    if (currentStatus === 'PENDING' || currentStatus === 'SOURCES_INSUFFICIENT') return 'ACCEPTED';
    return null;
  }
  return null;
}

module.exports = { normalizeName, nextStatusFor };
