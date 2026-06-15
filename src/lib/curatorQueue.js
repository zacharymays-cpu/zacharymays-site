// src/lib/curatorQueue.js
// Server-only. Builds the curator worklist: HC metrics + dual-track scores per
// org, with computed review signals, sorted by priority. Uses the service role
// because hc_* are not anon-readable.
// Dual-track is derived from the HC columns: CIS == young_reed composite (0–100),
// and CLA == lifton C11 × 10, so liftonC11 = leadershipAuthority / 10. (The
// ai_jury_verdicts lifton rows have NULL jury_mean, so we do NOT read them here.)
import { createSupabaseAdminClient } from './supabase/admin';
import { computeSignals, priorityScore } from './curatorSignals';

function numOrNull(x) {
  return x == null ? null : Number(x);
}

export async function getCuratorQueue({ limit = 40 } = {}) {
  const sb = createSupabaseAdminClient();

  const { data: orgs, error: orgErr } = await sb
    .from('organizations')
    .select('id, name, category, summary_text, hc_rating, hc_control_index_score, hc_leadership_authority_score, hc_member_dependency_index, hc_exit_cost_assessment, hc_composite_risk_level, hc_confidence_overall, reviewed_at')
    .eq('is_calibration', false)
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
    };
  });

  rows.sort((a, b) => b.priorityScore - a.priorityScore);
  return rows.slice(0, limit);
}
