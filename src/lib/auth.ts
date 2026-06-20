import 'server-only';
import { createSupabaseServerClient } from './supabase/server';
import { createSupabaseAdminClient } from './supabase/admin';
import { adminEmails, isActiveDecryptor } from './authCore.js';

export { adminEmails, isActiveDecryptor };

// Email allowlist + aal2. Returns the Supabase user (same shape the existing
// per-file requireAdmin copies return). Throws on any failure.
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const allow = adminEmails();
  const email = (user.email || '').toLowerCase();
  if (allow.length === 0) throw new Error('ADMIN_EMAILS is not configured.');
  if (!allow.includes(email)) throw new Error(`${email} is not an approved analyst.`);
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') throw new Error('Two-factor step-up required.');
  return user;
}

export async function logDecryptAttempt(args: {
  actorEmail: string; personId: string | null; field: string; justification?: string; succeeded: boolean;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  await admin.from('decrypt_access_log').insert({
    actor_email: args.actorEmail, person_id: args.personId, field: args.field,
    justification: args.justification ?? null, succeeded: args.succeeded,
  });
}

// requireAdmin + active membership in authorized_decryptors. Logs the denied
// attempt (app-layer denial logging — the DB RPCs only hard-fail).
export async function requireDecryptor() {
  const user = await requireAdmin();
  const email = (user.email || '').toLowerCase();
  const admin = createSupabaseAdminClient();
  if (!(await isActiveDecryptor(admin, email))) {
    await logDecryptAttempt({ actorEmail: email, personId: null, field: 'authz', succeeded: false });
    throw new Error('Not an authorized decryptor.');
  }
  return user;
}
