// Restricted curator console: prioritized human review of HC + dual-track scores.
// Same gate as /admin/review: session (middleware) + ADMIN_EMAILS + verified TOTP/AAL2.
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { getCuratorOrgs } from '../../../lib/curatorQueue';
import CuratorClient from './CuratorClient';

export const dynamic = 'force-dynamic';

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export default async function AdminCuratorPage({ searchParams }) {
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

  const sp = await searchParams;
  const mode = ['worklist', 'browse', 'pending'].includes(sp?.mode) ? sp.mode : 'worklist';
  const search = typeof sp?.q === 'string' ? sp.q : '';
  const page = Number.isFinite(Number(sp?.page)) ? Math.max(0, parseInt(sp.page, 10) || 0) : 0;
  const filters = {
    rating: sp?.rating || '',
    reviewed: sp?.reviewed || '',
    category: sp?.category || '',
  };

  let result = { items: [], total: 0, page, pageSize: 25 };
  let loadError = null;
  try {
    result = await getCuratorOrgs({ mode, search, filters, page, pageSize: 25 });
  } catch (e) {
    loadError = e.message;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Curator console</h1>
        <p style={{ opacity: 0.7, marginTop: '0.4rem' }}>
          Signed in as {email}. Decisions recorded in <code>curator_decisions</code>; approve publishes a
          pending org, reject archives it.
        </p>
      </header>
      {loadError ? (
        <p style={{ color: '#b00' }}>Failed to load: {loadError}</p>
      ) : (
        <CuratorClient
          items={result.items}
          mode={mode}
          search={search}
          filters={filters}
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
        />
      )}
    </main>
  );
}
