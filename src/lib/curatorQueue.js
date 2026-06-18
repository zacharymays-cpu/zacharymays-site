// src/lib/curatorQueue.js
// Server-only. Builds the curator worklist: HC metrics + dual-track scores per
// org, PLUS the per-criterion C1–C11 scores and the jury's written explanations
// (so the curator can actually judge, not just see aggregates), with computed
// review signals, sorted by priority. Uses the service role because the hc_* and
// jury tables are not anon-readable.
// Only surfaces ACCEPTED orgs that have NOT yet been curator-reviewed
// (reviewed_at IS NULL); approving an org stamps reviewed_at, so it drops off the
// worklist. (Browse mode still lists every ACCEPTED org — see getCuratorOrgs.)
// Dual-track is derived from the HC columns: CIS == young_reed composite (0–100),
// and CLA == lifton C11 × 10, so liftonC11 = leadershipAuthority / 10. (The
// ai_jury_verdicts lifton rows have NULL jury_mean, so we do NOT read them for
// the headline scores.)
import { createSupabaseAdminClient } from './supabase/admin';
import { computeSignals, priorityScore } from './curatorSignals';
import { normalizeName } from './curatorLifecycle';

// C1–C10 are the Young & Reed criteria; C11 is Lifton ideological totalism.
const CRITERIA = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11'];
const CRITERIA_NAMES = {
  C1: 'Charismatic Leadership', C2: 'Sacred Assumptions', C3: 'Transcendent Mission',
  C4: 'Sublimation of Individuality', C5: 'Isolation', C6: 'Private Vernacular',
  C7: 'Us-Versus-Them', C8: 'Exploitation of Labor', C9: 'High Exit Costs',
  C10: 'Ends Justify the Means', C11: 'Ideological Totalism (Lifton)',
};

function numOrNull(x) {
  return x == null ? null : Number(x);
}

export async function getCuratorQueue({ limit = 40 } = {}) {
  const sb = createSupabaseAdminClient();

  const { data: orgs, error: orgErr } = await sb
    .from('organizations')
    .select('id, name, category, summary_text, hc_rating, hc_control_index_score, hc_leadership_authority_score, hc_member_dependency_index, hc_exit_cost_assessment, hc_composite_risk_level, hc_confidence_overall, reviewed_at')
    .eq('is_calibration', false)
    .eq('scoring_status', 'ACCEPTED') // only live orgs — keeps ARCHIVED dupes + PENDING stubs out of the console
    .is('reviewed_at', null)          // drop curator-approved orgs — once reviewed they no longer need human eyes
    .not('hc_rating', 'is', null);
  if (orgErr) throw orgErr;

  // Optional research briefs — table may not exist yet. Never let this block the queue.
  const briefByOrg = new Map();
  try {
    const { data: briefs, error: bErr } = await sb
      .from('research_briefs')
      .select('org_id, summary, evidence_completeness, credibility_score, total_sources');
    if (bErr) throw bErr;
    for (const b of briefs || []) briefByOrg.set(b.org_id, b);
  } catch {
    // research_briefs not present (or unreadable) — briefs stay empty; UI shows "no brief".
  }

  const rows = (orgs || []).map((o) => {
    const brief = briefByOrg.get(o.id) || null;
    const cis = numOrNull(o.hc_control_index_score);
    const cla = numOrNull(o.hc_leadership_authority_score);
    const signals = computeSignals({
      hcRating: o.hc_rating,
      confidenceOverall: numOrNull(o.hc_confidence_overall),
      brief: brief ? { evidenceCompleteness: numOrNull(brief.evidence_completeness) } : null,
    });
    return {
      orgId: o.id,
      name: o.name,
      category: o.category,
      summary: o.summary_text || '',
      reviewedAt: o.reviewed_at || null,
      hc: {
        rating: o.hc_rating,
        controlIndex: cis,
        leadershipAuthority: cla,
        memberDependency: numOrNull(o.hc_member_dependency_index),
        exitCost: numOrNull(o.hc_exit_cost_assessment),
        compositeRisk: numOrNull(o.hc_composite_risk_level),
        confidenceOverall: numOrNull(o.hc_confidence_overall),
      },
      dualTrack: {
        youngReed: cis,                                  // 0–100 (CIS == young_reed composite)
        liftonC11: cla == null ? null : cla / 10,        // 0–10  (CLA == lifton × 10)
      },
      brief: brief
        ? {
            summary: brief.summary || '',
            totalSources: brief.total_sources ?? 0,
            evidenceCompleteness: numOrNull(brief.evidence_completeness),
            credibilityScore: numOrNull(brief.credibility_score),
          }
        : null,
      signals,
      priorityScore: priorityScore(signals),
      criteria: [], // filled (for the returned slice only) by attachCriteria()
    };
  });

  rows.sort((a, b) => b.priorityScore - a.priorityScore);
  const top = rows.slice(0, limit);

  // Per-criterion scores + jury explanations — only for the orgs actually shown.
  await attachCriteria(sb, top);
  return top;
}

// Attaches `item.criteria` = [{ code, name, score, body, juryMean, jurySpread }]
// for each org in `items`. Pulls the published per-criterion score + the jury's
// written explanation from criterion_scores, and the per-criterion jury mean +
// model spread from the latest verdict per track (C1–C10 from young_reed, C11
// from lifton). Scoped to the worklist org ids so it stays cheap.
async function attachCriteria(sb, items) {
  const ids = items.map((i) => i.orgId);
  if (!ids.length) return;

  // Published per-criterion score + the jury's written explanation.
  const scoreByOrg = new Map(); // org_id -> { Cx: { score, body } }
  {
    const { data, error } = await sb
      .from('criterion_scores')
      .select('org_id, criterion, score, body_text')
      .in('org_id', ids);
    if (error) throw error;
    for (const r of data || []) {
      if (!scoreByOrg.has(r.org_id)) scoreByOrg.set(r.org_id, {});
      scoreByOrg.get(r.org_id)[r.criterion] = { score: r.score, body: r.body_text || '' };
    }
  }

  // Per-criterion jury mean + model spread from the latest verdict of each track.
  const meansByOrg = new Map(); // org_id -> { Cx: { mean, spread } }
  {
    const { data, error } = await sb
      .from('ai_jury_verdicts')
      .select('org_id, track, criterion_means, criterion_spreads, computed_at')
      .in('org_id', ids)
      .order('computed_at', { ascending: false });
    if (error) throw error;
    const seenTrack = new Set(); // `${org_id}:${track}` — keep newest verdict per track only
    for (const v of data || []) {
      const key = `${v.org_id}:${v.track}`;
      if (seenTrack.has(key)) continue;
      seenTrack.add(key);
      if (!meansByOrg.has(v.org_id)) meansByOrg.set(v.org_id, {});
      const dst = meansByOrg.get(v.org_id);
      const means = v.criterion_means || {};
      const spreads = v.criterion_spreads || {};
      for (const c of Object.keys(means)) {
        // Don't let an older/other track overwrite a criterion already set by a newer one.
        if (dst[c]) continue;
        dst[c] = { mean: numOrNull(means[c]), spread: numOrNull(spreads[c]) };
      }
    }
  }

  for (const item of items) {
    const sc = scoreByOrg.get(item.orgId) || {};
    const mn = meansByOrg.get(item.orgId) || {};
    item.criteria = CRITERIA
      .map((c) => ({
        code: c,
        name: CRITERIA_NAMES[c],
        score: sc[c] ? numOrNull(sc[c].score) : null,
        body: sc[c] ? sc[c].body : '',
        juryMean: mn[c] ? mn[c].mean : null,
        jurySpread: mn[c] ? mn[c].spread : null,
      }))
      // Drop criteria with nothing to show (no score, no explanation, no jury data).
      .filter((c) => c.score != null || (c.body && c.body.length > 0) || c.juryMean != null);
  }
}

const PENDING_STATUSES = ['PENDING', 'SOURCES_INSUFFICIENT'];

// Build a single org row in the same shape as getCuratorQueue items, minus the
// heavy per-criterion join (worklist mode keeps that via getCuratorQueue).
function baseRow(o) {
  const cis = numOrNull(o.hc_control_index_score);
  const cla = numOrNull(o.hc_leadership_authority_score);
  const signals = computeSignals({
    hcRating: o.hc_rating,
    confidenceOverall: numOrNull(o.hc_confidence_overall),
    brief: null,
  });
  return {
    orgId: o.id, name: o.name, slug: o.slug || null, category: o.category,
    summary: o.summary_text || '', status: o.scoring_status,
    reviewedAt: o.reviewed_at || null,
    hc: {
      rating: o.hc_rating, controlIndex: cis, leadershipAuthority: cla,
      memberDependency: numOrNull(o.hc_member_dependency_index),
      exitCost: numOrNull(o.hc_exit_cost_assessment),
      compositeRisk: numOrNull(o.hc_composite_risk_level),
      confidenceOverall: numOrNull(o.hc_confidence_overall),
    },
    dualTrack: { youngReed: cis, liftonC11: cla == null ? null : cla / 10 },
    signals, priorityScore: priorityScore(signals),
    dupCandidates: [],
    criteria: [],
  };
}

// Unified org fetch for the curator console.
//   mode: 'worklist' (delegates to getCuratorQueue), 'browse' (ACCEPTED, searchable+filterable),
//         'pending' (PENDING + SOURCES_INSUFFICIENT, with dedup warnings)
//   search: case-insensitive name substring
//   filters: { rating?, reviewed?: 'yes'|'no', category? }
//   page (0-based), pageSize. Returns { items, total, page, pageSize }.
export async function getCuratorOrgs({ mode = 'browse', search = '', filters = {}, page = 0, pageSize = 25 } = {}) {
  if (mode === 'worklist') {
    const items = await getCuratorQueue({ limit: 40 });
    return { items, total: items.length, page: 0, pageSize: items.length };
  }

  const sb = createSupabaseAdminClient();
  const cols = 'id, name, slug, category, summary_text, scoring_status, reviewed_at, hc_rating, hc_control_index_score, hc_leadership_authority_score, hc_member_dependency_index, hc_exit_cost_assessment, hc_composite_risk_level, hc_confidence_overall';

  let q = sb.from('organizations').select(cols, { count: 'exact' }).eq('is_calibration', false);

  if (mode === 'pending') {
    q = q.in('scoring_status', PENDING_STATUSES);
  } else {
    q = q.eq('scoring_status', 'ACCEPTED');
    if (filters.rating) q = q.eq('hc_rating', filters.rating);
    if (filters.category) q = q.eq('category', filters.category);
    if (filters.reviewed === 'yes') q = q.not('reviewed_at', 'is', null);
    if (filters.reviewed === 'no') q = q.is('reviewed_at', null);
  }
  if (search && search.trim()) q = q.ilike('name', `%${search.trim()}%`);

  q = q.order('name', { ascending: true }).range(page * pageSize, page * pageSize + pageSize - 1);

  const { data, error, count } = await q;
  if (error) throw error;

  const items = (data || []).map((o) => baseRow(o));

  // Pending mode: flag likely duplicates against the live (ACCEPTED) set by normalized name.
  if (mode === 'pending' && items.length) {
    const { data: accepted, error: dupErr } = await sb
      .from('organizations')
      .select('id, name, slug')
      .eq('scoring_status', 'ACCEPTED');
    if (dupErr) console.error('curator dup-check failed:', dupErr.message);
    const byKey = new Map();
    for (const a of accepted || []) {
      const k = normalizeName(a.name);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push({ name: a.name, slug: a.slug || null });
    }
    for (const it of items) {
      it.dupCandidates = byKey.get(normalizeName(it.name)) || [];
    }
  }

  return { items, total: count ?? items.length, page, pageSize };
}
