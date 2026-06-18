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

// Worklist eligibility. An org belongs on the curator priority worklist only if
// it is live (ACCEPTED), not a calibration anchor, has an HC rating to prioritize
// on, and has NOT yet been curator-reviewed — approving an org stamps reviewed_at
// (see applyCuratorDecision), which is what drops it off the worklist. This is the
// pure mirror of the getCuratorQueue() query filters so the rule can be unit-tested
// and applied as an in-memory guard against the DB query drifting.
function isWorklistEligible(org) {
  if (!org) return false;
  return org.scoring_status === 'ACCEPTED'
    && org.is_calibration === false
    && org.hc_rating != null
    && org.reviewed_at == null;
}

module.exports = { normalizeName, nextStatusFor, isWorklistEligible };
