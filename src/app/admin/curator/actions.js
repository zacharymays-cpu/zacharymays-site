'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { createSupabaseAdminClient } from '../../../lib/supabase/admin';
import { nextStatusFor } from '../../../lib/curatorLifecycle';

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

// Same gate the analyst console uses: signed in + allowlisted + AAL2 step-up.
async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const allow = adminEmails();
  const email = (user.email || '').toLowerCase();
  if (allow.length === 0) throw new Error('ADMIN_EMAILS is not configured — refusing all writes.');
  if (!allow.includes(email)) throw new Error(`${email} is not an approved analyst.`);
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') throw new Error('Two-factor step-up required before writing.');
  return user;
}

const DECISIONS = new Set(['approve', 'modify', 'reject', 'request_evidence']);

export async function applyCuratorDecision(formData) {
  const user = await requireAdmin();
  const orgId = String(formData.get('orgId') || '');
  const decision = String(formData.get('decision') || '');
  const notes = String(formData.get('notes') || '').trim();

  if (!orgId) return { ok: false, error: 'Missing orgId.' };
  if (!DECISIONS.has(decision)) return { ok: false, error: 'Invalid decision.' };

  const admin = createSupabaseAdminClient();

  // Read current status so we apply the correct lifecycle transition.
  const { data: org, error: readErr } = await admin
    .from('organizations').select('scoring_status').eq('id', orgId).single();
  if (readErr) return { ok: false, error: readErr.message };

  const { error: logErr } = await admin.from('curator_decisions').insert({
    org_id: orgId,
    curator_email: (user.email || '').toLowerCase(),
    decision,
    notes: notes || null,
    reviewed_at: new Date().toISOString(),
  });
  if (logErr) return { ok: false, error: logErr.message };

  const newStatus = nextStatusFor(decision, org.scoring_status);
  const patch = {};
  if (newStatus) patch.scoring_status = newStatus;
  if (decision === 'approve') { patch.reviewed_by = user.id; patch.reviewed_at = new Date().toISOString(); }
  if (Object.keys(patch).length) {
    patch.updated_at = new Date().toISOString();
    const { error: updErr } = await admin.from('organizations').update(patch).eq('id', orgId);
    if (updErr) return { ok: false, error: updErr.message };
  }

  revalidatePath('/admin/curator');
  return { ok: true, newStatus: newStatus || org.scoring_status };
}

const EDITABLE_CRITERIA = new Set(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']);

// Edit one published criterion score (C1–C10) with a required rationale. Mirrors
// the /admin/review write path: goes through the audited record_criterion_change
// RPC (immutable score_history, real actor) then recomputes composite/tier.
// C11 (Lifton track) is read-only here.
export async function modifyCriterionScore(formData) {
  const user = await requireAdmin();
  const orgId = String(formData.get('orgId') || '');
  const criterion = String(formData.get('criterion') || '');
  const rationale = String(formData.get('rationale') || '').trim();
  const scoreRaw = String(formData.get('score') ?? '').trim();

  if (!orgId) return { ok: false, error: 'Missing orgId.' };
  if (!EDITABLE_CRITERIA.has(criterion)) return { ok: false, error: 'Only C1–C10 are editable here.' };
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
    p_changed_by: user.id,
    p_source_session: 'admin-curator',
    p_update_body: false,
  });
  if (error) return { ok: false, error: error.message };

  await recomputeComposite(admin, orgId);
  revalidatePath('/admin/curator');
  return { ok: true, scoreHistoryId: data };
}

// Young-proportional composite (breadth/10 × mean/10 × 100), tiered 30/60 — mirrors
// /admin/review, but explicitly restricted to C1–C10 so the Lifton C11 row can't
// inflate breadth past 10.
async function recomputeComposite(admin, orgId) {
  const { data: rows } = await admin
    .from('criterion_scores')
    .select('score, criterion')
    .eq('org_id', orgId)
    .in('criterion', ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']);
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

// PHASE II SCAFFOLDING — not yet wired to the UI. The curator dropdown's
// "request_evidence" choice currently logs a curator_decisions row via
// applyCuratorDecision; the dedicated evidence_requests workflow (a criteria
// picker that calls this action) lands in a later phase. Kept here so the
// table contract and the action are ready. Safe to leave unused.
export async function requestEvidence(formData) {
  const user = await requireAdmin();
  const orgId = String(formData.get('orgId') || '');
  const reasoning = String(formData.get('reasoning') || '').trim();
  const criteria = String(formData.get('criteria') || '')
    .split(',').map((s) => s.trim()).filter(Boolean);

  if (!orgId) return { ok: false, error: 'Missing orgId.' };

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('evidence_requests').insert({
    org_id: orgId,
    criteria_needed: criteria,
    reasoning: reasoning || null,
    requested_by: (user.email || '').toLowerCase(),
    status: 'pending',
    requested_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/curator');
  return { ok: true };
}
