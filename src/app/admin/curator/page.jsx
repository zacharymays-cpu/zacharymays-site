// Restricted curator console: prioritized human review of HC + dual-track scores.
// Same gate as /admin/review: session (middleware) + ADMIN_EMAILS + verified TOTP/AAL2.
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { getCuratorQueue } from '../../../lib/curatorQueue';
import CuratorClient from './CuratorClient';

export const dynamic = 'force-dynamic';

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export default async function AdminCuratorPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const allow = adminEmails();
  const email = (user?.email || '').toLowerCase();
  const isAdmin = allow.length > 0 && allow.includes(email);

  if (!isAdmin) {
    return (
      <main style={{ padding: '3rem', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Not authorized</h1>
        <p style={{ opacity: 0.75, marginTop: '0.75rem' }}>
          You are signed in as <strong>{email || 'unknown'}</strong>, which is not on the
          analyst allowlist. Ask an admin to add your email to <code>ADMIN_EMAILS</code>.
        </p>
      </main>
    );
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasVerifiedTotp = (factors?.totp || []).some((f) => f.status === 'verified');
  if (!hasVerifiedTotp || aal?.currentLevel !== 'aal2') redirect('/admin/mfa');

  let queue = [];
  let loadError = null;
  try {
    queue = await getCuratorQueue({ limit: 40 });
  } catch (e) {
    loadError = e.message;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Curator console</h1>
        <p style={{ opacity: 0.7, marginTop: '0.4rem' }}>
          HC metrics + dual-track jury scores, prioritized by review signal. Signed in as {email}.
          Decisions are recorded in <code>curator_decisions</code> with you as the actor.
        </p>
      </header>
      {loadError ? (
        <p style={{ color: '#b00' }}>Failed to load worklist: {loadError}</p>
      ) : (
        <CuratorClient items={queue} />
      )}
    </main>
  );
}
