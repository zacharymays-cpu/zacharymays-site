'use client';

import { useState, useTransition } from 'react';
import { applyDecision } from './actions';

const TIER_COLOR = {
  'Super Culty': '#6b1010',
  'Kinda Culty': '#7a4a1a',
  'Not Culty': '#2a6b4a',
};

function CriterionRow({ orgId, c }) {
  const [score, setScore] = useState(c.score == null ? 'NA' : String(c.score));
  const [rationale, setRationale] = useState('');
  const [msg, setMsg] = useState(null);
  const [pending, startTransition] = useTransition();

  const drifted =
    c.juryMean != null && c.score != null && Math.abs(c.juryMean - c.score) >= 1;

  function submit() {
    setMsg(null);
    const fd = new FormData();
    fd.set('orgId', orgId);
    fd.set('criterion', c.criterion);
    fd.set('score', score);
    fd.set('rationale', rationale);
    startTransition(async () => {
      const res = await applyDecision(fd);
      setMsg(res.ok ? { ok: true, text: 'Saved ✓' } : { ok: false, text: res.error });
      if (res.ok) setRationale('');
    });
  }

  return (
    <tr style={{ background: drifted ? '#fff7ed' : 'transparent' }}>
      <td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
        <strong>{c.criterion}</strong> <span style={{ opacity: 0.6 }}>{c.name}</span>
      </td>
      <td style={{ padding: '4px 8px', textAlign: 'center' }}>{c.score ?? 'N/A'}</td>
      <td style={{ padding: '4px 8px', textAlign: 'center', opacity: 0.8 }}>
        {c.juryMean ?? '—'}
      </td>
      <td style={{ padding: '4px 8px' }}>
        <input
          value={score}
          onChange={(e) => setScore(e.target.value)}
          style={{ width: 52, padding: '2px 4px', textAlign: 'center' }}
          aria-label={`New score for ${c.criterion}`}
        />
      </td>
      <td style={{ padding: '4px 8px' }}>
        <input
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="rationale (required)"
          style={{ width: '100%', minWidth: 240, padding: '2px 6px' }}
        />
      </td>
      <td style={{ padding: '4px 8px' }}>
        <button onClick={submit} disabled={pending || !rationale.trim()}>
          {pending ? '…' : 'Save'}
        </button>
        {msg ? (
          <span style={{ marginLeft: 8, color: msg.ok ? '#2a6b4a' : '#b00' }}>
            {msg.text}
          </span>
        ) : null}
      </td>
    </tr>
  );
}

function OrgCard({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid #e2e2e2', borderRadius: 10, marginBottom: 12 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span>
          <strong>{item.name}</strong>{' '}
          <span style={{ opacity: 0.5, fontSize: 12 }}>{item.recordId}</span>
        </span>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#b45309' }}>{item.reason}</span>
          {item.jurySpread != null ? (
            <span style={{ fontSize: 12, opacity: 0.7 }}>spread {item.jurySpread}</span>
          ) : null}
          <span
            style={{
              fontSize: 12, color: '#fff', padding: '2px 8px', borderRadius: 999,
              background: TIER_COLOR[item.tier] || '#555',
            }}
          >
            {item.composite}% {item.tier}
          </span>
          <span>{open ? '▲' : '▼'}</span>
        </span>
      </button>
      {open ? (
        <div style={{ padding: '0 16px 16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', opacity: 0.6, fontSize: 12 }}>
                <th style={{ padding: '4px 8px' }}>Criterion</th>
                <th style={{ padding: '4px 8px' }}>Current</th>
                <th style={{ padding: '4px 8px' }}>Jury</th>
                <th style={{ padding: '4px 8px' }}>New</th>
                <th style={{ padding: '4px 8px' }}>Rationale</th>
                <th style={{ padding: '4px 8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {item.criteria.map((c) => (
                <CriterionRow key={c.criterion} orgId={item.orgId} c={c} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default function ReviewClient({ items }) {
  if (!items?.length) {
    return <p style={{ opacity: 0.7 }}>No orgs currently flagged for review.</p>;
  }
  return (
    <div>
      <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
        {items.length} orgs flagged. Rows shaded amber where the current score
        differs from the jury mean by ≥1. Changes recompute the composite/tier and
        append an immutable audit row.
      </p>
      {items.map((item) => (
        <OrgCard key={item.orgId} item={item} />
      ))}
    </div>
  );
}
