// src/lib/intakeProposals.js
// Server-only. Lists intake proposals and finds likely-duplicate orgs/proposals
// for a candidate name. Service role (org_intake_proposals is not anon-readable).
import { createSupabaseAdminClient } from './supabase/admin';
import { rankDuplicates } from './intakeDedup';

const OPEN_PROPOSAL_STATUSES = ['PROPOSED', 'APPROVED'];

export async function getIntakeProposals({ limit = 100 } = {}) {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from('org_intake_proposals')
    .select('id, name, category, proposed_by, justification, status, reviewed_by, reviewed_at, rejection_reason, org_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((p) => ({
    id: p.id, name: p.name, category: p.category, proposedBy: p.proposed_by,
    justification: p.justification || '', status: p.status,
    reviewedBy: p.reviewed_by || null, rejectionReason: p.rejection_reason || null,
    orgId: p.org_id || null, createdAt: p.created_at,
  }));
}

// Distinct org categories currently in use (for the intake form dropdown), sorted.
export async function getCategories() {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from('organizations')
    .select('category')
    .not('category', 'is', null);
  if (error) return [];
  const set = new Set();
  for (const r of data || []) {
    const c = (r.category || '').trim();
    if (c) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

// Returns { orgs: [...ranked], proposals: [...ranked] } likely duplicates for `name`.
export async function findIntakeDuplicates(name) {
  const sb = createSupabaseAdminClient();
  const [{ data: orgs }, { data: props }] = await Promise.all([
    sb.from('organizations').select('id, name, slug, scoring_status').neq('scoring_status', 'ARCHIVED'),
    sb.from('org_intake_proposals').select('id, name, status').in('status', OPEN_PROPOSAL_STATUSES),
  ]);
  const orgCands = (orgs || []).map((o) => ({ id: o.id, name: o.name, slug: o.slug || null, kind: 'org' }));
  const propCands = (props || []).map((p) => ({ id: p.id, name: p.name, kind: 'proposal' }));
  return {
    orgs: rankDuplicates(name, orgCands, { threshold: 0.6 }).slice(0, 5),
    proposals: rankDuplicates(name, propCands, { threshold: 0.6 }).slice(0, 5),
  };
}
