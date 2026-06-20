'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/client';

export default function AdminLoginPage() {
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  function nextPath() {
    return new URLSearchParams(window.location.search).get('next') || '/admin/review';
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
        Restricted to approved analysts. Sign in with your registered passkey.
      </p>

      {/* Passkey is the only sign-in method. Magic-link and GitHub OAuth were
          removed to minimize the admin login attack surface. NOTE: they must also
          be disabled at the Supabase project level — removing the UI does not
          disable the auth API. */}
      <button onClick={signInWithPasskey} disabled={!!loading} style={btn}>
        {loading === 'passkey' ? 'Waiting for passkey…' : 'Sign in with passkey'}
      </button>

      {error ? <p style={{ color: '#b00' }}>{error}</p> : null}
    </main>
  );
}
