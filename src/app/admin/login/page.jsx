'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/client';

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

  async function signInWithPasskey() {
    setLoading('passkey');
    setError('');
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPasskey();
    if (error) {
      setError(error.message);
      setLoading('');
      return;
    }
    window.location.href = nextPath();
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

  const divider = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 300, opacity: 0.5, margin: '0.25rem 0' }}>
      <hr style={{ flex: 1, border: 0, borderTop: '1px solid #ccc' }} />
      <span style={{ fontSize: 12 }}>or</span>
      <hr style={{ flex: 1, border: 0, borderTop: '1px solid #ccc' }} />
    </div>
  );

  return (
    <main
      style={{
        minHeight: '70vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Analyst sign-in</h1>
      <p style={{ opacity: 0.7, maxWidth: 440, textAlign: 'center', marginBottom: '0.5rem' }}>
        Restricted to approved analysts.
      </p>

      {/* Passkey — fastest path for enrolled devices */}
      <button onClick={signInWithPasskey} disabled={!!loading} style={btn}>
        {loading === 'passkey' ? 'Waiting for passkey…' : 'Sign in with passkey'}
      </button>

      {divider}

      {/* OAuth */}
      {PROVIDERS.map((p) => (
        <button key={p.id} onClick={() => signIn(p.id)} disabled={!!loading} style={btn}>
          {loading === p.id ? 'Redirecting…' : p.label}
        </button>
      ))}

      {divider}

      {/* Email magic link */}
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
