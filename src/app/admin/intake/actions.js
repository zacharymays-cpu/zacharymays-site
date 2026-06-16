'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { createSupabaseAdminClient } from '../../../lib/supabase/admin';
import { findIntakeDuplicates } from '../../../lib/intakeProposals';

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}
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

// Create a PROPOSED intake row. If strong duplicates exist and the caller did not
// set confirm=true, return them WITHOUT inserting so the UI can warn first.
export async function submitProposal(formData) {
  const user = await requireAdmin();
  const name = String(formData.get('name') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const justification = String(formData.get('justification') || '').trim();
  const categoryFit = String(formData.get('category_fit') || '').trim();
  const publicInterest = String(formData.get('public_interest') || '').trim();
  const sourcePre = String(formData.get('source_pre_assessment') || '').trim();
  const confirm = String(formData.get('confirm') || '') === 'true';

  if (!name) return { ok: false, error: 'Name is required.' };
  if (!category) return { ok: false, error: 'Category is required.' };

  const dups = await findIntakeDuplicates(name);
  const hasStrong = dups.orgs.some((d) => d.exact || d.score >= 0.8) || dups.proposals.some((d) => d.exact || d.score >= 0.8);
  if (hasStrong && !confirm) {
    return { ok: false, needsConfirm: true, duplicates: dups };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from('org_intake_proposals').insert({
    name, category,
    proposed_by: (user.email || '').toLowerCase(),
    justification: justification || null,
    category_fit: categoryFit || null,
    public_interest: publicInterest || null,
    source_pre_assessment: sourcePre || null,
    status: 'PROPOSED',
  }).select('id').single();
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/intake');
  return { ok: true, proposalId: data.id, duplicates: dups };
}

// Approve or reject an open proposal.
export async function decideProposal(formData) {
  const user = await requireAdmin();
  const id = String(formData.get('proposalId') || '');
  const decision = String(formData.get('decision') || '');
  const reason = String(formData.get('reason') || '').trim();
  if (!id) return { ok: false, error: 'Missing proposalId.' };
  if (!['approve', 'reject'].includes(decision)) return { ok: false, error: 'Invalid decision.' };

  const patch = {
    status: decision === 'approve' ? 'APPROVED' : 'REJECTED',
    reviewed_by: (user.email || '').toLowerCase(),
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (decision === 'reject') patch.rejection_reason = reason || null;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('org_intake_proposals').update(patch).eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/intake');
  return { ok: true };
}
