// Restricted intake console. Same gate as /admin/curator: session + ADMIN_EMAILS + verified TOTP/AAL2.
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { getIntakeProposals, getCategories } from '../../../lib/intakeProposals';
import IntakeClient from './IntakeClient';
import AdminNav from '../AdminNav';

export const dynamic = 'force-dynamic';

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export default async function AdminIntakePage() {
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
          Signed in as <strong>{email || 'unknown'}</strong>, not on the analyst allowlist.
        </p>
      </main>
    );
  }
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasVerifiedTotp = (factors?.totp || []).some((f) => f.status === 'verified');
  if (!hasVerifiedTotp || aal?.currentLevel !== 'aal2') redirect('/admin/mfa');

  let proposals = [];
  let categories = [];
  let loadError = null;
  try {
    proposals = await getIntakeProposals({ limit: 100 });
    categories = await getCategories();
  } catch (e) { loadError = e.message; }

  return (
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <AdminNav active="/admin/intake" />
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Org intake</h1>
        <p style={{ opacity: 0.7, marginTop: '0.4rem' }}>
          Propose a new organization (creates a <code>PROPOSED</code> intake record after a duplicate check),
          and approve/reject pending proposals. Signed in as {email}.
        </p>
      </header>
      {loadError ? <p style={{ color: '#b00' }}>Failed to load: {loadError}</p> : <IntakeClient proposals={proposals} categories={categories} />}
    </main>
  );
}
