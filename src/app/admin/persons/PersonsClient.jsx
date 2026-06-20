'use client';
import { useState } from 'react';
import {
  searchPersons, revealPerson, publishPerson, anonymizePerson,
} from '../../actions/identity';

const JUSTIFICATIONS = [
  'memoir_author', 'public_self_disclosure', 'adjudicated_public_figure',
  'named_under_real_name_in_source', 'deanonymization_request_granted', 'other',
];

export default function PersonsClient() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [revealed, setRevealed] = useState({}); // id -> name
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(fn) {
    setErr(''); setBusy(true);
    try { return await fn(); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function doSearch(e) {
    e.preventDefault();
    const r = await run(() => searchPersons(q));
    if (r) setRows(r);
  }

  async function doReveal(id) {
    const x = await run(() => revealPerson(id));
    if (x) setRevealed((m) => ({ ...m, [id]: x.name }));
  }

  async function doPublish(id) {
    const t = window.prompt(`Justification type:\n${JUSTIFICATIONS.join(' / ')}`);
    if (!t) return;
    if (!JUSTIFICATIONS.includes(t)) { setErr(`Invalid justification type: ${t}`); return; }
    const note = window.prompt('Source note (optional):');
    const x = await run(() => publishPerson(id, t, note || null));
    if (x) setRows((rr) => rr.map((z) => (z.id === id ? { ...z, identity_public: true } : z)));
  }

  async function doAnonymize(id) {
    const reason = window.prompt('Reason for re-anonymizing:');
    if (!reason) return;
    const x = await run(() => anonymizePerson(id, reason));
    if (x) {
      setRows((rr) => rr.map((z) => (z.id === id ? { ...z, identity_public: false } : z)));
      setRevealed((m) => { const c = { ...m }; delete c[id]; return c; });
    }
  }

  const td = { padding: '6px 10px', borderBottom: '1px solid #eee', fontSize: 14 };

  return (
    <div>
      <form onSubmit={doSearch} style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="P-xxxxxxxx or name"
               style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #ccc', width: 320 }} />
        <button type="submit" disabled={busy}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', cursor: 'pointer' }}>
          {busy ? '…' : 'Search'}
        </button>
      </form>
      {err && <p style={{ color: '#b00' }}>{err}</p>}
      {rows.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 760 }}>
          <thead>
            <tr><th style={td}>Label / Name</th><th style={td}>Status</th><th style={td}>Nat.</th><th style={td}>Birth yr</th><th style={td}>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={td}>{revealed[r.id] ? <strong>{revealed[r.id]}</strong> : r.label}</td>
                <td style={td}>{r.identity_public ? 'public' : 'anonymized'}</td>
                <td style={td}>{r.nationality || ''}</td>
                <td style={td}>{r.birth_year || ''}</td>
                <td style={td}>
                  <button onClick={() => doReveal(r.id)} disabled={busy}>Reveal</button>{' '}
                  {!r.identity_public
                    ? <button onClick={() => doPublish(r.id)} disabled={busy}>Publish</button>
                    : <button onClick={() => doAnonymize(r.id)} disabled={busy}>Anonymize</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
