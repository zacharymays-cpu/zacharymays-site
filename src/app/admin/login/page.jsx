'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/client';

// Enable the matching providers in Supabase → Auth → Providers. GitHub/Google are
// the lightest to set up; Microsoft (azure) needs an Entra app; Apple needs a paid
// Apple Developer account. Remove any you don't enable.
const PROVIDERS = [
  { id: 'google', label: 'Continue with Google' },
  { id: 'github', label: 'Continue with GitHub' },
  { id: 'azure', label: 'Continue with Microsoft' },
  { id: 'apple', label: 'Continue with Apple' },
];

export default function AdminLoginPage() {
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  async function signIn(provider) {
    setLoading(provider);
    setError('');
    const supabase = createSupabaseBrowserClient();
    const next =
      new URLSearchParams(window.location.search).get('next') || '/admin/review';
    const opts = {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    };
    // Microsoft (Azure) needs the email scope to populate user.email for the allowlist.
    if (provider === 'azure') opts.scopes = 'email openid profile';
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: opts });
    if (error) {
      setError(error.message);
      setLoading('');
    }
  }

  return (
    <main
      style={{
        minHeight: '70vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Analyst sign-in</h1>
      <p style={{ opacity: 0.7, maxWidth: 420, textAlign: 'center', marginBottom: '0.5rem' }}>
        The score-review console is restricted to approved analysts and requires a
        second factor (authenticator app).
      </p>
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          onClick={() => signIn(p.id)}
          disabled={!!loading}
          style={{
            width: 280, padding: '0.7rem 1rem', borderRadius: 8, border: '1px solid #333',
            background: '#111', color: '#fff', cursor: loading ? 'wait' : 'pointer', fontWeight: 600,
          }}
        >
          {loading === p.id ? 'Redirecting…' : p.label}
        </button>
      ))}
      {error ? <p style={{ color: '#b00' }}>{error}</p> : null}
    </main>
  );
}
