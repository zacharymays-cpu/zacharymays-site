// Builds the prioritized human-review worklist (server-only; uses the service
// role because the AI-jury tables are not anon-readable). Prioritizes the orgs
// where the jury is most likely wrong: high inter-model disagreement first, then
// tier-boundary cases, then weak consensus.
import { createSupabaseAdminClient } from './supabase/admin';

const CRITERIA = ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'];
export const CRITERIA_NAMES = {
  C1: 'Charismatic Leadership', C2: 'Sacred Assumptions', C3: 'Transcendent Mission',
  C4: 'Sublimation of Individuality', C5: 'Isolation', C6: 'Private Vernacular',
  C7: 'Us-Versus-Them', C8: 'Exploitation of Labor', C9: 'High Exit Costs',
  C10: 'Ends Justify the Means',
};

function priority(composite, spread) {
  if (spread != null && spread > 20) return { rank: 1, reason: 'High model disagreement' };
  const nearBoundary =
    (composite >= 27 && composite <= 33) || (composite >= 57 && composite <= 63);
  if (nearBoundary) return { rank: 2, reason: 'Tier-boundary (small error flips tier)' };
  return { rank: 3, reason: 'Standard' };
}

export async function getReviewQueue({ limit = 40 } = {}) {
  const sb = createSupabaseAdminClient();

  const { data: orgs, error: orgErr } = await sb
    .from('organizations')
    .select('id, record_id, name, composite_score, composite_tier, youngs_score, methodology_version')
    .eq('is_calibration', false)
    .not('composite_score', 'is', null);
  if (orgErr) throw orgErr;

  // Latest jury verdict per org (dedupe newest-first in JS — PostgREST has no DISTINCT ON).
  const { data: verdicts, error: vErr } = await sb
    .from('ai_jury_verdicts')
    .select('org_id, jury_mean, jury_spread, consensus_strong, criterion_means, criterion_spreads, computed_at')
    .order('computed_at', { ascending: false });
  if (vErr) throw vErr;
  const latest = new Map();
  for (const v of verdicts) if (!latest.has(v.org_id)) latest.set(v.org_id, v);

  // Rank, keep those with a verdict, take the top N.
  const ranked = orgs
    .filter((o) => latest.has(o.id))
    .map((o) => {
      const v = latest.get(o.id);
      const p = priority(Number(o.composite_score), v.jury_spread == null ? null : Number(v.jury_spread));
      return { org: o, verdict: v, ...p };
    })
    .filter((r) => r.rank <= 2) // worklist = disagreement + boundary cases
    .sort((a, b) => a.rank - b.rank || (b.verdict.jury_spread || 0) - (a.verdict.jury_spread || 0))
    .slice(0, limit);

  // Current published per-criterion scores for the worklist orgs.
  const ids = ranked.map((r) => r.org.id);
  const scoresByOrg = new Map();
  if (ids.length) {
    const { data: cs, error: csErr } = await sb
      .from('criterion_scores')
      .select('org_id, criterion, score, body_text')
      .in('org_id', ids);
    if (csErr) throw csErr;
    for (const row of cs) {
      if (!scoresByOrg.has(row.org_id)) scoresByOrg.set(row.org_id, {});
      scoresByOrg.get(row.org_id)[row.criterion] = row;
    }
  }

  return ranked.map(({ org, verdict, reason }) => {
    const cs = scoresByOrg.get(org.id) || {};
    const means = verdict.criterion_means || {};
    return {
      orgId: org.id,
      recordId: org.record_id,
      name: org.name,
      composite: org.composite_score == null ? null : Number(org.composite_score),
      tier: org.composite_tier,
      youngs: org.youngs_score,
      methodologyVersion: org.methodology_version,
      jurySpread: verdict.jury_spread == null ? null : Number(verdict.jury_spread),
      reason,
      criteria: CRITERIA.map((c) => ({
        criterion: c,
        name: CRITERIA_NAMES[c],
        score: cs[c]?.score ?? null,
        juryMean: means[c] == null ? null : Number(means[c]),
      })),
    };
  });
}
