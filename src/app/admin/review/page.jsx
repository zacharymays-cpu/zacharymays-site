// Restricted analyst console: prioritized human review of AI-jury scores.
// Access: middleware requires a session; this page additionally requires the
// signed-in email to be in ADMIN_EMAILS. Writes go through the applyDecision
// Server Action (service-role + audited).
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { getReviewQueue } from '../../../lib/reviewQueue';
import ReviewClient from './ReviewClient';
import AdminNav from '../AdminNav';

export const dynamic = 'force-dynamic'; // always live; never cache the console

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminReviewPage() {
  const supabase = await createSupabaseServerClient();
  // Middleware already called getUser() (network-validated) on this request
  // and would have redirected unauthenticated users. Reading the session
  // cookie locally avoids a redundant round-trip to Supabase Auth.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const allow = adminEmails();
  const email = (user?.email || '').toLowerCase();
  const isAdmin = allow.length > 0 && allow.includes(email);

  if (!isAdmin) {
    return (
      <main style={{ padding: '3rem', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Not authorized</h1>
        <p style={{ opacity: 0.75, marginTop: '0.75rem' }}>
          You are signed in as <strong>{email || 'unknown'}</strong>, which is not
          on the analyst allowlist. Ask an admin to add your email to{' '}
          <code>ADMIN_EMAILS</code>.
        </p>
      </main>
    );
  }

  // Enforce TOTP 2FA for admins: must have a verified factor AND a stepped-up
  // (AAL2) session. Otherwise route to enrollment / step-up.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') redirect('/admin/mfa');

  let queue = [];
  let loadError = null;
  try {
    queue = await getReviewQueue({ limit: 40 });
  } catch (e) {
    loadError = e.message;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <AdminNav active="/admin/review" />
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Score review console</h1>
        <p style={{ opacity: 0.7, marginTop: '0.4rem' }}>
          Prioritized worklist &mdash; orgs where the AI jury is most likely wrong (high
          model disagreement and tier-boundary cases). Signed in as {email}.
          Every change is recorded in the immutable <code>score_history</code> audit
          trail with you as the actor.
        </p>
      </header>
      {loadError ? (
        <p style={{ color: '#b00' }}>Failed to load worklist: {loadError}</p>
      ) : (
        <ReviewClient items={queue} />
      )}
    </main>
  );
}
