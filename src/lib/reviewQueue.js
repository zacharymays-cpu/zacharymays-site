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
    .select('id, record_id, name, category, summary_text, composite_score, composite_tier, youngs_score, methodology_version, reviewed_at')
    .eq('is_calibration', false)
    .not('composite_score', 'is', null);
  if (orgErr) throw orgErr;

  // Latest jury verdict per org (dedupe newest-first in JS — PostgREST has no DISTINCT ON).
  const { data: verdicts, error: vErr } = await sb
    .from('ai_jury_verdicts')
    .select('org_id, run_id, jury_mean, jury_spread, consensus_strong, model_count, score_claude, score_gpt4o, score_gemini, criterion_means, criterion_spreads, computed_at')
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

  // Per-model, per-criterion scores from the latest jury run (so the spread is
  // explainable — you can see which model scored what, and which abstained).
  const modelKey = (m) =>
    m?.startsWith('claude') ? 'claude' : m?.startsWith('gpt') ? 'gpt4o' : m?.startsWith('gemini') ? 'gemini' : m;
  const perCritModels = new Map(); // org_id -> { criterion -> {claude,gpt4o,gemini} }
  const coverage = new Map(); // org_id -> { claude:n, gpt4o:n, gemini:n }
  if (ids.length) {
    const runByOrg = new Map(ranked.map((r) => [r.org.id, r.verdict.run_id]));
    const { data: ms, error: msErr } = await sb
      .from('ai_model_scores')
      .select('org_id, run_id, model, criterion, score')
      .in('org_id', ids);
    if (msErr) throw msErr;
    for (const row of ms) {
      if (row.run_id !== runByOrg.get(row.org_id)) continue; // latest run only
      const k = modelKey(row.model);
      if (!perCritModels.has(row.org_id)) perCritModels.set(row.org_id, {});
      const byCrit = perCritModels.get(row.org_id);
      if (!byCrit[row.criterion]) byCrit[row.criterion] = {};
      byCrit[row.criterion][k] = row.score;
      if (!coverage.has(row.org_id)) coverage.set(row.org_id, { claude: 0, gpt4o: 0, gemini: 0 });
      if (row.score != null) coverage.get(row.org_id)[k] = (coverage.get(row.org_id)[k] || 0) + 1;
    }
  }

  return ranked.map(({ org, verdict, reason }) => {
    const cs = scoresByOrg.get(org.id) || {};
    const means = verdict.criterion_means || {};
    const spreads = verdict.criterion_spreads || {};
    const cov = coverage.get(org.id) || { claude: 0, gpt4o: 0, gemini: 0 };
    const byCrit = perCritModels.get(org.id) || {};
    const models = [
      { key: 'claude', label: 'Claude', composite: verdict.score_claude == null ? null : Number(verdict.score_claude), scored: cov.claude },
      { key: 'gpt4o', label: 'GPT-4o', composite: verdict.score_gpt4o == null ? null : Number(verdict.score_gpt4o), scored: cov.gpt4o },
      { key: 'gemini', label: 'Gemini', composite: verdict.score_gemini == null ? null : Number(verdict.score_gemini), scored: cov.gemini },
    ].map((m) => ({ ...m, abstained: m.scored === 0, lowCoverage: m.scored > 0 && m.scored < 5 }))
     .filter((m) => m.composite != null || m.scored > 0);
    return {
      orgId: org.id,
      recordId: org.record_id,
      name: org.name,
      category: org.category,
      summary: org.summary_text || '',
      composite: org.composite_score == null ? null : Number(org.composite_score),
      tier: org.composite_tier,
      youngs: org.youngs_score,
      methodologyVersion: org.methodology_version,
      // AI jury's overall composite (same 0–100 Young-proportional scale as the
      // published composite) — lets the header show how far a human has moved it.
      juryComposite: verdict.jury_mean == null ? null : Number(verdict.jury_mean),
      jurySpread: verdict.jury_spread == null ? null : Number(verdict.jury_spread),
      modelCount: verdict.model_count ?? null,
      models,
      reviewedAt: org.reviewed_at || null,
      reason,
      criteria: CRITERIA.map((c) => ({
        criterion: c,
        name: CRITERIA_NAMES[c],
        score: cs[c]?.score ?? null,
        body: cs[c]?.body_text || '',
        juryMean: means[c] == null ? null : Number(means[c]),
        jurySpread: spreads[c] == null ? null : Number(spreads[c]),
        modelScores: byCrit[c] || {},
      })),
    };
  });
}
