'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/client';

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signInWithGitHub() {
    setLoading(true);
    setError('');
    const supabase = createSupabaseBrowserClient();
    const next =
      new URLSearchParams(window.location.search).get('next') || '/admin/review';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Analyst sign-in</h1>
      <p style={{ opacity: 0.7, maxWidth: 420, textAlign: 'center' }}>
        The score-review console is restricted to approved analysts. Sign in with
        GitHub to continue.
      </p>
      <button
        onClick={signInWithGitHub}
        disabled={loading}
        style={{
          padding: '0.75rem 1.25rem',
          borderRadius: 8,
          border: '1px solid #333',
          background: '#111',
          color: '#fff',
          cursor: loading ? 'wait' : 'pointer',
          fontWeight: 600,
        }}
      >
        {loading ? 'Redirecting…' : 'Continue with GitHub'}
      </button>
      {error ? <p style={{ color: '#b00' }}>{error}</p> : null}
    </main>
  );
}
