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
  const { mode, value } = searchMode(query);
  let rows: any[] | null = null;
  if (mode === 'id') {
    ({ data: rows } = await admin.from('persons').select(SAFE_COLS).ilike('id', `${value}%`).limit(25));
  } else {
    const bidx = blindIndex(value, process.env.PERSON_BIDX_HMAC_KEY as string);
    ({ data: rows } = await admin.from('persons').select(SAFE_COLS).eq('canonical_name_bidx', bidx).limit(25));
  }
  return (rows || []).map((r) => ({
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

export async function publishPerson(personId: string, justificationType: string, sourceNote: string | null) {
  const user = await requireDecryptor();
  const email = (user.email || '').toLowerCase();
  const admin = createSupabaseAdminClient();
  const name = await decryptName(admin, personId, email);
  await admin.from('person_visibility_justifications').insert({
    person_id: personId, justification_type: justificationType, source_note: sourceNote, created_by: email,
  });
  const { error } = await admin.from('persons')
    .update({ identity_public: true, public_display_name: name }).eq('id', personId);
  if (error) throw new Error(error.message);
  await logDecryptAttempt({ actorEmail: email, personId, field: FIELD, justification: justificationType, succeeded: true });
  return { ok: true as const };
}

export async function anonymizePerson(personId: string, reason: string) {
  const user = await requireDecryptor();
  const email = (user.email || '').toLowerCase();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('persons')
    .update({ identity_public: false, public_display_name: null }).eq('id', personId);
  if (error) throw new Error(error.message);
  await logDecryptAttempt({ actorEmail: email, personId, field: FIELD, justification: `anonymize: ${reason}`, succeeded: true });
  return { ok: true as const };
}
