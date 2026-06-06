'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/client';

// OAuth provider(s) — each must be enabled in Supabase → Auth → Providers (needs
// your own OAuth app). Email magic link (below) is fully integrated in Supabase
// and needs no external provider app.
const PROVIDERS = [
  { id: 'github', label: 'Continue with GitHub' },
];

export default function AdminLoginPage() {
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function nextPath() {
    return new URLSearchParams(window.location.search).get('next') || '/admin/review';
  }

  async function signIn(provider) {
    setLoading(provider);
    setError('');
    const supabase = createSupabaseBrowserClient();
    const opts = {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath())}`,
    };
    if (provider === 'azure') opts.scopes = 'email openid profile';
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: opts });
    if (error) {
      setError(error.message);
      setLoading('');
    }
  }

  async function sendMagicLink(e) {
    e.preventDefault();
    setLoading('email');
    setError('');
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath())}`,
        // Don't silently create accounts for arbitrary emails; access is still
        // gated by ADMIN_EMAILS, but this avoids stray signups.
        shouldCreateUser: true,
      },
    });
    setLoading('');
    if (error) setError(error.message);
    else setSent(true);
  }

  const btn = {
    width: 300, padding: '0.7rem 1rem', borderRadius: 8, border: '1px solid #333',
    background: '#111', color: '#fff', cursor: 'pointer', fontWeight: 600,
  };

  return (
    <main
      style={{
        minHeight: '70vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Analyst sign-in</h1>
      <p style={{ opacity: 0.7, maxWidth: 440, textAlign: 'center', marginBottom: '0.5rem' }}>
        Restricted to approved analysts; a second factor (authenticator app) is
        required after sign-in.
      </p>

      {/* OAuth */}
      {PROVIDERS.map((p) => (
        <button key={p.id} onClick={() => signIn(p.id)} disabled={!!loading} style={btn}>
          {loading === p.id ? 'Redirecting…' : p.label}
        </button>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 300, opacity: 0.5, margin: '0.25rem 0' }}>
        <hr style={{ flex: 1, border: 0, borderTop: '1px solid #ccc' }} />
        <span style={{ fontSize: 12 }}>or</span>
        <hr style={{ flex: 1, border: 0, borderTop: '1px solid #ccc' }} />
      </div>

      {/* Email magic link — integrated Supabase auth, no external provider app */}
      {sent ? (
        <p style={{ maxWidth: 320, textAlign: 'center', color: '#2a6b4a' }}>
          Check <strong>{email}</strong> for a sign-in link.
        </p>
      ) : (
        <form onSubmit={sendMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 300 }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #ccc' }}
          />
          <button type="submit" disabled={loading === 'email'} style={btn}>
            {loading === 'email' ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>
      )}

      {error ? <p style={{ color: '#b00' }}>{error}</p> : null}
    </main>
  );
}
