'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { createSupabaseAdminClient } from '../../../lib/supabase/admin';

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
  const { error } = await admin.from('curator_decisions').insert({
    org_id: orgId,
    curator_email: (user.email || '').toLowerCase(),
    decision,
    notes: notes || null,
    reviewed_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };

  if (decision === 'approve') {
    await admin.from('organizations')
      .update({ reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', orgId);
  }

  revalidatePath('/admin/curator');
  return { ok: true };
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
