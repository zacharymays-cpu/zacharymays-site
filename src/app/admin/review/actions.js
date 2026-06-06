'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { createSupabaseAdminClient } from '../../../lib/supabase/admin';

// Comma-separated allowlist of admin emails, e.g. ADMIN_EMAILS="you@example.com".
function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const allow = adminEmails();
  const email = (user.email || '').toLowerCase();
  if (allow.length === 0) {
    throw new Error('ADMIN_EMAILS is not configured — refusing all writes.');
  }
  if (!allow.includes(email)) {
    throw new Error(`${email} is not an approved analyst.`);
  }
  // Require a stepped-up (2FA) session for any write — defense-in-depth beyond
  // the page-level gate.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') {
    throw new Error('Two-factor step-up required before writing.');
  }
  return user;
}

const CRITERIA = new Set(['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10']);

// Apply one accepted criterion change. Score-only by default; pass updateBody to
// also rewrite body_text. score === null means N/A. The DB trigger writes the
// immutable score_history row; we record the real user id as the actor.
export async function applyDecision(formData) {
  const user = await requireAdmin();

  const orgId = String(formData.get('orgId') || '');
  const criterion = String(formData.get('criterion') || '');
  const rationale = String(formData.get('rationale') || '').trim();
  const scoreRaw = String(formData.get('score') ?? '').trim();

  if (!orgId) return { ok: false, error: 'Missing orgId.' };
  if (!CRITERIA.has(criterion)) return { ok: false, error: 'Invalid criterion.' };
  if (!rationale) return { ok: false, error: 'A rationale is required (no silent edits).' };

  let score = null;
  if (scoreRaw && !['NA', 'N/A', 'NULL'].includes(scoreRaw.toUpperCase())) {
    const n = Number(scoreRaw);
    if (Number.isNaN(n) || n < 1 || n > 10) {
      return { ok: false, error: 'Score must be N/A or a number 1–10.' };
    }
    score = n;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc('record_criterion_change', {
    p_org_id: orgId,
    p_criterion: criterion,
    p_new_score: score,
    p_new_body: null,
    p_rationale: rationale,
    p_changed_by: user.id, // real actor — resolves the zero-UUID placeholder
    p_source_session: 'admin-review',
    p_update_body: false,
  });

  if (error) return { ok: false, error: error.message };

  // Recompute the org composite/tier from current criteria after the change.
  await recomputeComposite(admin, orgId);

  revalidatePath('/admin/review');
  return { ok: true, scoreHistoryId: data };
}

// Mirror of post_accept_hook.recalculate_composite (Young-proportional 30/60).
async function recomputeComposite(admin, orgId) {
  const { data: rows } = await admin
    .from('criterion_scores')
    .select('score')
    .eq('org_id', orgId);
  const active = (rows || [])
    .map((r) => r.score)
    .filter((s) => s !== null && s !== undefined)
    .map(Number);
  let composite = 0;
  let tier = 'Not Culty';
  if (active.length) {
    const breadth = active.length;
    const mean = active.reduce((a, b) => a + b, 0) / breadth;
    composite = Math.round((breadth / 10) * (mean / 10) * 100 * 100) / 100;
    tier = composite >= 60 ? 'Super Culty' : composite >= 30 ? 'Kinda Culty' : 'Not Culty';
  }
  await admin
    .from('organizations')
    .update({ composite_score: composite, composite_tier: tier, updated_at: new Date().toISOString() })
    .eq('id', orgId);
}
