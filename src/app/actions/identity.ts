'use server';
import { createSupabaseAdminClient } from '../../lib/supabase/admin';
import { requireAdmin, requireDecryptor, logDecryptAttempt } from '../../lib/auth';
import { decryptField } from '../../lib/identity/decrypt';
import { blindIndex, pLabel, searchMode } from '../../lib/identity/blindIndex.js';

const FIELD = 'canonical_name';
const SAFE_COLS = 'id, identity_public, nationality, birth_year, status';

export async function searchPersons(query: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  // Support comma-separated batch search: "Faith Jones, Rose McGowan, P-1a2b3c4d".
  // Each term is resolved independently; results are unioned and de-duplicated by id.
  const terms = query.split(',').map((s) => s.trim()).filter(Boolean);
  if (terms.length === 0) return [];
  const MAX_RESULTS = 100;
  const byId = new Map<string, any>();
  for (const term of terms) {
    if (byId.size >= MAX_RESULTS) break;
    const { mode, value } = searchMode(term);
    let rows: any[] | null = null;
    if (mode === 'id') {
      ({ data: rows } = await admin.from('persons').select(SAFE_COLS).ilike('id', `${value}%`).limit(25));
    } else {
      const bidx = blindIndex(value, process.env.PERSON_BIDX_HMAC_KEY as string);
      ({ data: rows } = await admin.from('persons').select(SAFE_COLS).eq('canonical_name_bidx', bidx).limit(25));
    }
    for (const r of rows || []) if (!byId.has(r.id)) byId.set(r.id, r);
  }
  return Array.from(byId.values()).slice(0, MAX_RESULTS).map((r) => ({
    id: r.id, label: pLabel(r.id), identity_public: r.identity_public,
    nationality: r.nationality, birth_year: r.birth_year, status: r.status,
  }));
}

async function decryptName(admin: any, personId: string, actorEmail: string): Promise<string> {
  const { data, error } = await admin.from('persons').select('canonical_name_enc').eq('id', personId).single();
  if (error || !data?.canonical_name_enc) {
    await logDecryptAttempt({ actorEmail, personId, field: FIELD, succeeded: false });
    throw new Error('No encrypted name for this person.');
  }
  const raw: string = data.canonical_name_enc;
  const hex = raw.startsWith('\\x') ? raw.slice(2) : raw;
  return decryptField(Buffer.from(hex, 'hex'), personId, FIELD);
}

export async function revealPerson(personId: string) {
  const user = await requireDecryptor();
  const email = (user.email || '').toLowerCase();
  const admin = createSupabaseAdminClient();
  const name = await decryptName(admin, personId, email);
  await logDecryptAttempt({ actorEmail: email, personId, field: FIELD, succeeded: true });
  return { name };
}

// Decrypt a person's alternate names (legal/birth/maiden/family) from person_aliases.
// alias plaintext was dropped; names live only as alias_enc (encryption context field='alias').
export async function revealAliases(personId: string) {
  const user = await requireDecryptor();
  const email = (user.email || '').toLowerCase();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('person_aliases')
    .select('id, alias_type, alias_enc')
    .eq('person_id', personId);
  if (error) throw new Error(error.message);
  const aliases = await Promise.all((data || []).map(async (r) => {
    const raw: string | null = r.alias_enc;
    if (!raw) return { id: r.id, alias_type: r.alias_type, alias: '' };
    const hex = raw.startsWith('\\x') ? raw.slice(2) : raw;
    const alias = await decryptField(Buffer.from(hex, 'hex'), personId, 'alias');
    return { id: r.id, alias_type: r.alias_type, alias };
  }));
  await logDecryptAttempt({ actorEmail: email, personId, field: 'alias', succeeded: true });
  return { aliases };
}

// Visibility changes go through the set_person_visibility RPC, which records a
// txn-local justification reason BEFORE the update so the audit + enforcement
// triggers see it. Direct UPDATEs to identity_public are rejected by the
// require-justification trigger (no silent/back-channel flips).
export async function publishPerson(personId: string, justificationType: string, sourceNote: string | null) {
  const user = await requireDecryptor();
  const email = (user.email || '').toLowerCase();
  const admin = createSupabaseAdminClient();
  const name = await decryptName(admin, personId, email);
  const reason = sourceNote && sourceNote.trim() ? sourceNote.trim() : `published: ${justificationType}`;
  const { error } = await admin.rpc('set_person_visibility', {
    p_person_id: personId, p_make_public: true, p_reason: reason,
    p_justification_type: justificationType, p_public_name: name, p_actor: email,
  });
  if (error) throw new Error(error.message);
  await logDecryptAttempt({ actorEmail: email, personId, field: FIELD, justification: justificationType, succeeded: true });
  return { ok: true as const };
}

export async function anonymizePerson(personId: string, reason: string) {
  const user = await requireDecryptor();
  const email = (user.email || '').toLowerCase();
  const admin = createSupabaseAdminClient();
  const justReason = reason && reason.trim() ? reason.trim() : 'anonymized via admin console';
  const { error } = await admin.rpc('set_person_visibility', {
    p_person_id: personId, p_make_public: false, p_reason: justReason, p_actor: email,
  });
  if (error) throw new Error(error.message);
  await logDecryptAttempt({ actorEmail: email, personId, field: FIELD, justification: `anonymize: ${reason}`, succeeded: true });
  return { ok: true as const };
}
