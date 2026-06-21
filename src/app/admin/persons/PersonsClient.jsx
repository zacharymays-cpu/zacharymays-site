'use client';
import { Fragment, useState } from 'react';
import {
  searchPersons, revealPerson, publishPerson, anonymizePerson,
} from '../../actions/identity';

const JUSTIFICATIONS = [
  'memoir_author', 'public_self_disclosure', 'adjudicated_public_figure',
  'named_under_real_name_in_source', 'deanonymization_request_granted', 'other',
];

const JUSTIFICATION_LABELS = {
  memoir_author: 'Memoir author',
  public_self_disclosure: 'Public self-disclosure',
  adjudicated_public_figure: 'Adjudicated public figure',
  named_under_real_name_in_source: 'Named under real name in source',
  deanonymization_request_granted: 'De-anonymization request granted',
  other: 'Other',
};

export default function PersonsClient() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [revealed, setRevealed] = useState({}); // id -> name
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [publishId, setPublishId] = useState(null); // id with the publish form open
  const [justification, setJustification] = useState(JUSTIFICATIONS[0]);
  const [note, setNote] = useState('');
  const [anonymizeId, setAnonymizeId] = useState(null); // id with the anonymize form open
  const [reason, setReason] = useState('');

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

  function startPublish(id) {
    setErr('');
    setAnonymizeId(null);
    setPublishId(id);
    setJustification(JUSTIFICATIONS[0]);
    setNote('');
  }

  function cancelPublish() {
    setPublishId(null);
    setNote('');
  }

  function startAnonymize(id) {
    setErr('');
    setPublishId(null);
    setAnonymizeId(id);
    setReason('');
  }

  function cancelAnonymize() {
    setAnonymizeId(null);
    setReason('');
  }

  async function confirmPublish(id) {
    const x = await run(() => publishPerson(id, justification, note.trim() || null));
    if (x) {
      setRows((rr) => rr.map((z) => (z.id === id ? { ...z, identity_public: true } : z)));
      cancelPublish();
    }
  }

  async function confirmAnonymize(id) {
    if (!reason.trim()) { setErr('A reason is required to re-anonymize.'); return; }
    const x = await run(() => anonymizePerson(id, reason.trim()));
    if (x) {
      setRows((rr) => rr.map((z) => (z.id === id ? { ...z, identity_public: false } : z)));
      setRevealed((m) => { const c = { ...m }; delete c[id]; return c; });
      cancelAnonymize();
    }
  }

  const td = { padding: '6px 10px', borderBottom: '1px solid #eee', fontSize: 14 };
  const ctrl = { padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 };

  return (
    <div>
      <form onSubmit={doSearch} style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input value={q} onChange={(e) => setQ(e.target.value)}
               placeholder="P-xxxxxxxx or name — separate multiple with commas"
               style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #ccc', width: 440 }} />
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
              <Fragment key={r.id}>
                <tr>
                  <td style={td}>{revealed[r.id] ? <strong>{revealed[r.id]}</strong> : r.label}</td>
                  <td style={td}>{r.identity_public ? 'public' : 'anonymized'}</td>
                  <td style={td}>{r.nationality || ''}</td>
                  <td style={td}>{r.birth_year || ''}</td>
                  <td style={td}>
                    <button onClick={() => doReveal(r.id)} disabled={busy}>Reveal</button>{' '}
                    {!r.identity_public
                      ? <button onClick={() => startPublish(r.id)} disabled={busy || publishId === r.id}>Publish</button>
                      : <button onClick={() => startAnonymize(r.id)} disabled={busy || anonymizeId === r.id}>Anonymize</button>}
                  </td>
                </tr>
                {publishId === r.id && (
                  <tr>
                    <td style={{ ...td, background: '#fafafa' }} colSpan={5}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#555' }}>Justification</span>
                          <select value={justification} onChange={(e) => setJustification(e.target.value)} style={ctrl}>
                            {JUSTIFICATIONS.map((j) => (
                              <option key={j} value={j}>{JUSTIFICATION_LABELS[j]}</option>
                            ))}
                          </select>
                        </label>
                        <input value={note} onChange={(e) => setNote(e.target.value)}
                               placeholder="Source note (optional)"
                               style={{ ...ctrl, flex: '1 1 240px', minWidth: 200 }} />
                        <button onClick={() => confirmPublish(r.id)} disabled={busy}
                                style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', cursor: 'pointer' }}>
                          {busy ? '…' : 'Confirm publish'}
                        </button>
                        <button onClick={cancelPublish} disabled={busy}
                                style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {anonymizeId === r.id && (
                  <tr>
                    <td style={{ ...td, background: '#fafafa' }} colSpan={5}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                        <input value={reason} onChange={(e) => setReason(e.target.value)}
                               placeholder="Reason for re-anonymizing (required)" autoFocus
                               onKeyDown={(e) => { if (e.key === 'Enter') confirmAnonymize(r.id); }}
                               style={{ ...ctrl, flex: '1 1 280px', minWidth: 220 }} />
                        <button onClick={() => confirmAnonymize(r.id)} disabled={busy}
                                style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: '1px solid #8a1f1f', background: '#a12626', color: '#fff', cursor: 'pointer' }}>
                          {busy ? '…' : 'Confirm anonymize'}
                        </button>
                        <button onClick={cancelAnonymize} disabled={busy}
                                style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
