'use client';

import { useState, useTransition } from 'react';
import { applyDecision, approveOrg } from './actions';

// Site palette (dark theme): paper text on ink. Panels sit just above ink.
const C = {
  paper: '#f4f0e8',
  muted: 'rgba(244,240,232,0.62)',
  faint: 'rgba(244,240,232,0.40)',
  panel: '#2f2a25',
  panel2: '#26221e',
  border: 'rgba(244,240,232,0.16)',
  borderStrong: 'rgba(244,240,232,0.30)',
  inputBg: '#1f1c19',
  gold: '#c9a86a',
  ok: '#7fbf9b',
  err: '#e08b8b',
};
const TIER_COLOR = { 'Super Culty': '#8b2020', 'Kinda Culty': '#9a6a2a', 'Not Culty': '#2a6b4a' };

const inputStyle = {
  background: C.inputBg, color: C.paper, border: `1px solid ${C.borderStrong}`,
  borderRadius: 6, padding: '6px 8px', fontSize: 14,
};
const btnStyle = {
  background: C.gold, color: '#1f1c19', border: 'none', borderRadius: 6,
  padding: '6px 12px', fontWeight: 700, cursor: 'pointer',
};

function Criterion({ orgId, c }) {
  const [score, setScore] = useState(c.score == null ? 'NA' : String(c.score));
  const [rationale, setRationale] = useState('');
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();

  const drift = c.juryMean != null && c.score != null && Math.abs(c.juryMean - c.score) >= 1;

  function save() {
    setMsg(null);
    const fd = new FormData();
    fd.set('orgId', orgId); fd.set('criterion', c.criterion);
    fd.set('score', score); fd.set('rationale', rationale);
    start(async () => {
      const res = await applyDecision(fd);
      setMsg(res.ok ? { ok: true, t: 'Saved ✓' } : { ok: false, t: res.error });
      if (res.ok) setRationale('');
    });
  }

  return (
    <div style={{
      border: `1px solid ${drift ? C.gold : C.border}`, borderRadius: 8,
      padding: '12px 14px', marginBottom: 10, background: C.panel2,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: C.paper }}>
          {c.criterion} <span style={{ color: C.muted, fontWeight: 400 }}>· {c.name}</span>
        </div>
        <div style={{ fontSize: 13, color: C.muted, display: 'flex', gap: 14 }}>
          <span>current <strong style={{ color: C.paper }}>{c.score ?? 'N/A'}</strong></span>
          <span>jury <strong style={{ color: C.paper }}>{c.juryMean ?? '—'}</strong>
            {c.jurySpread != null ? <span style={{ color: c.jurySpread > 20 ? C.gold : C.faint }}> · spread {c.jurySpread}</span> : null}
          </span>
        </div>
      </div>

      {/* Per-model scores for this criterion — so the spread is explainable */}
      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: C.muted, margin: '8px 0 2px' }}>
        {['claude', 'gpt4o', 'gemini'].map((k) => {
          const label = k === 'gpt4o' ? 'GPT-4o' : k === 'claude' ? 'Claude' : 'Gemini';
          const v = c.modelScores?.[k];
          return (
            <span key={k}>{label}:{' '}
              <strong style={{ color: v == null ? C.faint : C.paper }}>{v == null ? 'N/A' : v}</strong>
            </span>
          );
        })}
      </div>

      {/* Evidence — what you judge against */}
      <p style={{
        margin: '8px 0 10px', fontSize: 13.5, lineHeight: 1.6, color: C.paper,
        whiteSpace: 'pre-wrap', maxHeight: 220, overflow: 'auto',
        borderLeft: `2px solid ${C.border}`, paddingLeft: 12,
      }}>
        {c.body ? c.body : <em style={{ color: C.faint }}>No evidence text on file.</em>}
      </p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12, color: C.muted }}>new</label>
        <input value={score} onChange={(e) => setScore(e.target.value)}
          style={{ ...inputStyle, width: 56, textAlign: 'center' }} aria-label={`New score for ${c.criterion}`} />
        <input value={rationale} onChange={(e) => setRationale(e.target.value)}
          placeholder="rationale (required to save)"
          style={{ ...inputStyle, flex: 1, minWidth: 220 }} />
        <button onClick={save} disabled={pending || !rationale.trim()}
          style={{ ...btnStyle, opacity: pending || !rationale.trim() ? 0.5 : 1 }}>
          {pending ? '…' : 'Save'}
        </button>
        {msg ? <span style={{ color: msg.ok ? C.ok : C.err, fontSize: 13 }}>{msg.t}</span> : null}
      </div>
    </div>
  );
}

function OrgCard({ item }) {
  const [open, setOpen] = useState(false);
  const [reviewed, setReviewed] = useState(!!item.reviewedAt);
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();

  function approve() {
    setMsg(null);
    const fd = new FormData();
    fd.set('orgId', item.orgId);
    start(async () => {
      const res = await approveOrg(fd);
      if (res.ok) { setReviewed(true); setMsg({ ok: true, t: 'Approved ✓' }); }
      else setMsg({ ok: false, t: res.error });
    });
  }

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 14, background: C.panel }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
        textAlign: 'left', color: C.paper,
      }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{item.name}</span>
          {reviewed ? <span style={{ marginLeft: 10, fontSize: 11, color: C.ok }}>✓ reviewed</span> : null}
          <span style={{ display: 'block', fontSize: 12, color: C.muted, marginTop: 2 }}>
            {item.recordId}{item.category ? ` · ${item.category}` : ''} · {item.reason}
          </span>
        </span>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
          {item.jurySpread != null ? (
            <span style={{ fontSize: 12, color: item.jurySpread > 20 ? C.gold : C.muted }}>spread {item.jurySpread}</span>
          ) : null}
          <span style={{ fontSize: 13, color: C.paper, padding: '3px 10px', borderRadius: 999, background: TIER_COLOR[item.tier] || '#555' }}>
            {item.composite}% · {item.tier}
          </span>
          <span style={{ color: C.muted }}>{open ? '▲' : '▼'}</span>
        </span>
      </button>

      {open ? (
        <div style={{ padding: '0 16px 16px' }}>
          {item.summary ? (
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: C.paper, opacity: 0.92, margin: '0 0 14px' }}>
              {item.summary}
            </p>
          ) : null}

          {/* Model breakdown — explains the spread (range of these composites) */}
          {item.models?.length ? (
            <div style={{
              display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
              fontSize: 13, color: C.paper, background: C.panel2, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '10px 14px', marginBottom: 14,
            }}>
              <span style={{ color: C.muted, fontSize: 12 }}>Jury composites:</span>
              {item.models.map((m) => (
                <span key={m.key} title={`${m.scored}/10 criteria scored`}>
                  {m.label}{' '}
                  <strong>{m.composite == null ? '—' : `${m.composite}%`}</strong>
                  {m.abstained ? <span style={{ color: C.err }}> · abstained (0/10)</span>
                    : m.lowCoverage ? <span style={{ color: C.gold }}> · only {m.scored}/10</span>
                    : <span style={{ color: C.faint }}> · {m.scored}/10</span>}
                </span>
              ))}
              <span style={{ color: C.muted, fontSize: 12, width: '100%', marginTop: 2 }}>
                Spread {item.jurySpread} = range of these. A model marked “abstained” scored everything N/A —
                it’s counted as 0% and inflates the spread, so weight it accordingly.
              </span>
            </div>
          ) : null}

          {item.criteria.map((c) => <Criterion key={c.criterion} orgId={item.orgId} c={c} />)}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6,
            paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <button onClick={approve} disabled={pending}
              style={{ ...btnStyle, background: reviewed ? 'transparent' : C.gold,
                color: reviewed ? C.ok : '#1f1c19', border: reviewed ? `1px solid ${C.border}` : 'none' }}>
              {pending ? '…' : reviewed ? 'Reviewed — approve again' : 'Approve org (mark reviewed)'}
            </button>
            <span style={{ fontSize: 12, color: C.muted }}>
              Approving records you + the time on this org. Score edits above are saved & audited separately.
            </span>
            {msg ? <span style={{ color: msg.ok ? C.ok : C.err, fontSize: 13 }}>{msg.t}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ReviewClient({ items }) {
  if (!items?.length) return <p style={{ color: C.muted }}>No orgs currently flagged for review.</p>;
  return (
    <div>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
        {items.length} orgs flagged (high model disagreement + tier-boundary cases). Expand an org to read
        the per-criterion evidence, adjust scores (rationale required — each save is audited), then
        <strong style={{ color: C.paper }}> Approve</strong> when you've signed off. Criteria outlined in gold
        differ from the jury mean by ≥1.
      </p>
      {items.map((item) => <OrgCard key={item.orgId} item={item} />)}
    </div>
  );
}
