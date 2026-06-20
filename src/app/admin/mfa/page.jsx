'use client';

// TOTP enrollment + step-up, with passkey registration offer after successful verify.
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/client';

export default function MfaPage() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [phase, setPhase] = useState('loading'); // loading|enroll|verify|passkey_offer|error
  const [factorId, setFactorId] = useState(null);
  const [qr, setQr] = useState(null);
  const [secret, setSecret] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
      if (fErr) return fail(fErr.message);
      const verified = factors?.totp?.find((f) => f.status === 'verified');
      if (verified) {
        setFactorId(verified.id);
        setPhase('verify');
        return;
      }
      for (const f of factors?.totp || []) {
        if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error: eErr } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (eErr) return fail(eErr.message);
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setPhase('enroll');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fail(msg) {
    setError(msg);
    setPhase('error');
  }

  async function submit() {
    setBusy(true);
    setError('');
    const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr) { setBusy(false); return setError(cErr.message); }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: ch.id,
      code: code.trim(),
    });
    setBusy(false);
    if (vErr) return setError(vErr.message);
    // Check if user already has a passkey registered; if not, offer enrollment.
    const { data: passkeys } = await supabase.auth.passkey.list();
    if (!passkeys || passkeys.length === 0) {
      setPhase('passkey_offer');
    } else {
      window.location.href = '/admin/review';
    }
  }

  async function registerPasskey() {
    setBusy(true);
    setError('');
    const { error: pkErr } = await supabase.auth.registerPasskey();
    setBusy(false);
    if (pkErr) {
      setError(pkErr.message);
      return;
    }
    window.location.href = '/admin/review';
  }

  const btn = {
    padding: '0.6rem 1.2rem', borderRadius: 8, border: '1px solid #333',
    background: '#111', color: '#fff', cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
  };

  return (
    <main style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Two-factor authentication</h1>

      {phase === 'loading' ? <p style={{ opacity: 0.7 }}>Loading…</p> : null}

      {phase === 'enroll' ? (
        <>
          <p style={{ opacity: 0.75, maxWidth: 440, textAlign: 'center' }}>
            Scan this with Google Authenticator (or Authy / 1Password), then enter
            the 6-digit code to finish enrollment.
          </p>
          {qr ? <img src={qr} alt="TOTP QR code" width={200} height={200} /> : null}
          {secret ? (
            <p style={{ fontSize: 12, opacity: 0.6 }}>
              Or enter manually: <code>{secret}</code>
            </p>
          ) : null}
        </>
      ) : null}

      {phase === 'verify' ? (
        <p style={{ opacity: 0.75, maxWidth: 440, textAlign: 'center' }}>
          Enter the current 6-digit code from your authenticator app.
        </p>
      ) : null}

      {phase === 'enroll' || phase === 'verify' ? (
        <>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            placeholder="123456"
            style={{ width: 160, padding: '0.5rem', textAlign: 'center', fontSize: 18, letterSpacing: 4 }}
          />
          <button onClick={submit} disabled={busy || code.trim().length < 6} style={btn}>
            {busy ? 'Verifying…' : 'Verify'}
          </button>
        </>
      ) : null}

      {phase === 'passkey_offer' ? (
        <>
          <p style={{ opacity: 0.75, maxWidth: 440, textAlign: 'center' }}>
            You&apos;re verified. Register a passkey so you can sign in with Face ID
            or Touch ID next time — no authenticator app needed.
          </p>
          <button onClick={registerPasskey} disabled={busy} style={btn}>
            {busy ? 'Registering…' : 'Register passkey'}
          </button>
          <button
            onClick={() => { window.location.href = '/admin/review'; }}
            style={{ ...btn, background: 'transparent', border: '1px solid #555', color: '#aaa' }}
          >
            Skip for now
          </button>
        </>
      ) : null}

      {phase === 'error' ? <p style={{ color: '#b00' }}>{error}</p> : null}
      {error && phase !== 'error' ? <p style={{ color: '#b00' }}>{error}</p> : null}
    </main>
  );
}
