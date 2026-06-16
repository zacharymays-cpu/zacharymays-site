'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { applyCuratorDecision, modifyCriterionScore } from './actions';

const C = {
  paper: '#f4f0e8', muted: 'rgba(244,240,232,0.62)', faint: 'rgba(244,240,232,0.40)',
  panel: '#2f2a25', panel2: '#26221e', border: 'rgba(244,240,232,0.16)',
  borderStrong: 'rgba(244,240,232,0.30)', inputBg: '#1f1c19',
  gold: '#c9a86a', ok: '#7fbf9b', err: '#e08b8b', warn: '#d4a574',
};
const HC_COLOR = { low: '#2a6b4a', moderate: '#7a8c2a', high: '#9a6a2a', severe: '#8b2020' };

const SIGNAL_LABELS = {
  low_evidence: 'Low evidence', boundary: 'Severe rating', confidence: 'Low confidence',
};

function fmt(n, suffix = '') {
  return n == null ? '—' : `${Math.round(n)}${suffix}`;
}

function Metric({ label, value, scale }) {
  return (
    <div style={{ fontSize: 12 }}>
      <div style={{ color: C.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ color: C.paper, fontWeight: 700, fontSize: 16 }}>
        {value == null ? '—' : `${Math.round(value)}/${scale}`}
      </div>
    </div>
  );
}

function DecisionForm({ orgId, onSaved }) {
  const [decision, setDecision] = useState('approve');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();

  function save() {
    setMsg(null);
    const fd = new FormData();
    fd.set('orgId', orgId); fd.set('decision', decision); fd.set('notes', notes);
    start(async () => {
      const res = await applyCuratorDecision(fd);
      setMsg(res.ok ? { ok: true, t: 'Saved ✓' } : { ok: false, t: res.error });
      if (res.ok) { setNotes(''); onSaved?.(); }
    });
  }

  const input = { background: C.inputBg, color: C.paper, border: `1px solid ${C.borderStrong}`, borderRadius: 6, padding: '6px 8px', fontSize: 14 };

  return (
    <div style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: '12px 14px', background: C.panel }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Decision</label>
      <select value={decision} onChange={(e) => setDecision(e.target.value)} style={{ ...input, width: '100%', marginBottom: 10 }}>
        <option value="approve">Approve (publish if pending)</option>
        <option value="reject">Reject (archive)</option>
        <option value="request_evidence">Request additional evidence</option>
        <option value="modify">Modify score</option>
      </select>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Notes</label>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Rationale (optional)"
        style={{ ...input, width: '100%', minHeight: 60, resize: 'vertical', marginBottom: 10 }} />
      <button onClick={save} disabled={pending}
        style={{ background: C.gold, color: '#1f1c19', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700, cursor: pending ? 'wait' : 'pointer', opacity: pending ? 0.6 : 1 }}>
        {pending ? 'Saving…' : 'Save decision'}
      </button>
      {msg && <p style={{ marginTop: 8, fontSize: 12, color: msg.ok ? C.ok : C.err }}>{msg.t}</p>}
    </div>
  );
}

// C1–C10 are the editable Young & Reed criteria; C11 (Lifton) is read-only here.
const EDITABLE = new Set(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']);

// One criterion: code + name, published score, the jury's AI mean + model-split
// flag, the written explanation, and — for C1–C10 — an inline audited edit.
function CriterionRow({ orgId, c }) {
  const split = c.jurySpread != null && c.jurySpread >= 3;
  const editable = EDITABLE.has(c.code);
  const [score, setScore] = useState(c.score == null ? 'NA' : String(c.score));
  const [rationale, setRationale] = useState('');
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();

  function save() {
    setMsg(null);
    const fd = new FormData();
    fd.set('orgId', orgId); fd.set('criterion', c.code);
    fd.set('score', score); fd.set('rationale', rationale);
    start(async () => {
      const res = await modifyCriterionScore(fd);
      setMsg(res.ok ? { ok: true, t: 'Saved ✓ (composite recomputed)' } : { ok: false, t: res.error });
      if (res.ok) setRationale('');
    });
  }

  const input = { background: C.inputBg, color: C.paper, border: `1px solid ${C.borderStrong}`, borderRadius: 6, padding: '5px 8px', fontSize: 13 };

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.paper }}>
          {c.code} <span style={{ color: C.muted, fontWeight: 400 }}>· {c.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
          {split && (
            <span style={{ color: C.gold, border: `1px solid ${C.gold}`, borderRadius: 999, padding: '1px 7px', fontWeight: 700 }}>
              models split · {c.jurySpread}
            </span>
          )}
          {c.juryMean != null && (
            <span style={{ color: C.muted }}>AI <strong style={{ color: C.paper }}>{c.juryMean}</strong></span>
          )}
          <span style={{ color: C.paper, fontWeight: 700 }}>{c.score == null ? 'N/A' : `${c.score}/10`}</span>
        </div>
      </div>
      {c.body ? (
        <p style={{ margin: '6px 0 8px', fontSize: 13, lineHeight: 1.55, color: C.paper, whiteSpace: 'pre-wrap', maxHeight: 150, overflow: 'auto', borderLeft: `2px solid ${C.border}`, paddingLeft: 10 }}>
          {c.body}
        </p>
      ) : (
        <p style={{ margin: '6px 0 8px', fontSize: 12, color: C.faint, fontStyle: 'italic' }}>No explanation on file.</p>
      )}
      {editable ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, color: C.muted }}>new</label>
          <input value={score} onChange={(e) => setScore(e.target.value)}
            style={{ ...input, width: 52, textAlign: 'center' }} aria-label={`New score for ${c.code}`} />
          <input value={rationale} onChange={(e) => setRationale(e.target.value)}
            placeholder="rationale (required to save)"
            style={{ ...input, flex: 1, minWidth: 200 }} />
          <button onClick={save} disabled={pending || !rationale.trim()}
            style={{ background: C.gold, color: '#1f1c19', border: 'none', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: pending || !rationale.trim() ? 'not-allowed' : 'pointer', opacity: pending || !rationale.trim() ? 0.5 : 1 }}>
            {pending ? '…' : 'Save'}
          </button>
          {msg && <span style={{ fontSize: 12, color: msg.ok ? C.ok : C.err }}>{msg.t}</span>}
        </div>
      ) : (
        <p style={{ fontSize: 11, color: C.faint, fontStyle: 'italic' }}>Lifton track — read-only here.</p>
      )}
    </div>
  );
}

// Collapsible list of all scored criteria with their explanations — the evidence
// a curator reads to judge whether the scores are well-founded.
function CriteriaCard({ orgId, criteria }) {
  const [open, setOpen] = useState(true);
  if (!criteria || !criteria.length) {
    return (
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 12, background: C.panel2, opacity: 0.55 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>Criteria &amp; explanations</h3>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>No per-criterion scores on file.</p>
      </div>
    );
  }
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 12, background: C.panel2 }}>
      <button onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: C.paper }}>
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>Criteria &amp; explanations ({criteria.length})</h3>
        <span style={{ color: C.muted, fontSize: 12 }}>{open ? '▴ hide' : '▾ show'}</span>
      </button>
      {open && criteria.map((c) => <CriterionRow key={c.code} orgId={orgId} c={c} />)}
    </div>
  );
}

function Detail({ item, onSaved }) {
  const hc = item.hc;
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px', background: C.panel }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{item.name}</h2>
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{item.category || 'Uncategorized'}</p>

      {item.status && item.status !== 'ACCEPTED' && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.paper, background: C.panel2, border: `1px solid ${C.borderStrong}`, borderRadius: 999, padding: '2px 8px' }}>
            status: {item.status}
          </span>
        </div>
      )}
      {item.dupCandidates && item.dupCandidates.length > 0 && (
        <div style={{ marginBottom: 10, border: `1px solid ${C.err}`, borderRadius: 8, padding: '8px 10px', background: C.panel2 }}>
          <strong style={{ color: C.err, fontSize: 12 }}>⚠ Possible duplicate of:</strong>
          <span style={{ color: C.muted, fontSize: 12 }}> {item.dupCandidates.map((d) => d.name).join(', ')}</span>
        </div>
      )}

      <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 12, background: C.panel2 }}>
        <span style={{ display: 'inline-block', background: HC_COLOR[hc.rating] || C.panel, color: C.paper, padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700, textTransform: 'capitalize', marginBottom: 12 }}>
          {hc.rating || 'unrated'}
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Metric label="Control Index" value={hc.controlIndex} scale={100} />
          <Metric label="Leadership Authority" value={hc.leadershipAuthority} scale={100} />
          <Metric label="Member Dependency" value={hc.memberDependency} scale={100} />
          <Metric label="Exit Cost" value={hc.exitCost} scale={100} />
        </div>
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.muted }}>
          Composite risk: <strong style={{ color: C.paper }}>{hc.compositeRisk == null ? '—' : hc.compositeRisk.toFixed(1)}/10</strong>
        </div>
      </div>

      <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 12, background: C.panel2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 2 }}>Composite (C1–C10)</div>
          <div style={{ color: C.paper, fontWeight: 700, fontSize: 18 }}>{fmt(item.dualTrack.youngReed, '/100')}</div>
        </div>
        <div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 2 }}>Lifton C11 (totalism)</div>
          <div style={{ color: C.paper, fontWeight: 700, fontSize: 18 }}>{item.dualTrack.liftonC11 == null ? '—' : `${item.dualTrack.liftonC11.toFixed(1)}/10`}</div>
        </div>
      </div>

      <CriteriaCard orgId={item.orgId} criteria={item.criteria} />

      <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 12, background: C.panel2, opacity: item.brief ? 1 : 0.55 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Research brief</h3>
        {item.brief ? (
          <div style={{ fontSize: 12, color: C.muted }}>
            {item.brief.totalSources} sources · completeness{' '}
            <strong style={{ color: item.brief.evidenceCompleteness >= 0.6 ? C.ok : item.brief.evidenceCompleteness >= 0.4 ? C.warn : C.err }}>
              {item.brief.evidenceCompleteness == null ? '—' : `${Math.round(item.brief.evidenceCompleteness * 100)}%`}
            </strong>
          </div>
        ) : <p style={{ fontSize: 12, color: C.muted }}>No research brief.</p>}
      </div>

      <div style={{ border: `1px solid ${item.signals.length ? C.gold : C.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 12, background: C.panel2 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: item.signals.length ? C.gold : C.paper, marginBottom: item.signals.length ? 10 : 0 }}>
          Review signals ({item.signals.length})
        </h3>
        {item.signals.map((s, i) => (
          <div key={i} style={{ fontSize: 12, marginTop: i ? 8 : 0 }}>
            <div style={{ fontWeight: 700, color: C.paper }}>{SIGNAL_LABELS[s.type] || s.type}</div>
            <div style={{ color: C.muted }}>{s.reason}</div>
            <div style={{ color: C.faint, fontStyle: 'italic', marginTop: 2 }}>→ {s.recommendation}</div>
          </div>
        ))}
      </div>

      <DecisionForm orgId={item.orgId} onSaved={onSaved} />
    </div>
  );
}

export default function CuratorClient({ items, mode = 'worklist', search = '', filters = {}, page = 0, pageSize = 25, total = 0 }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(items[0]?.orgId || null);
  const [q, setQ] = useState(search);

  function go(next) {
    const params = new URLSearchParams();
    params.set('mode', next.mode ?? mode);
    if ((next.q ?? q)) params.set('q', next.q ?? q);
    if ((next.rating ?? filters.rating)) params.set('rating', next.rating ?? filters.rating);
    if ((next.reviewed ?? filters.reviewed)) params.set('reviewed', next.reviewed ?? filters.reviewed);
    if (next.page != null) params.set('page', String(next.page));
    router.push(`/admin/curator?${params.toString()}`);
  }

  const tab = (key, label) => (
    <button key={key} onClick={() => go({ mode: key, page: 0 })}
      style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        border: `1px solid ${mode === key ? C.gold : C.border}`,
        background: mode === key ? C.gold : 'transparent', color: mode === key ? '#1f1c19' : C.muted }}>
      {label}
    </button>
  );

  const selected = items.find((it) => it.orgId === selectedId) || items[0] || null;
  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {tab('worklist', 'Worklist (top 40)')}
        {tab('browse', 'Browse all')}
        {tab('pending', 'Pending intake')}
      </div>

      {mode !== 'worklist' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search name…"
            onKeyDown={(e) => { if (e.key === 'Enter') go({ page: 0 }); }}
            style={{ background: C.inputBg, color: C.paper, border: `1px solid ${C.borderStrong}`, borderRadius: 6, padding: '6px 10px', fontSize: 14, minWidth: 220 }} />
          {mode === 'browse' && (
            <>
              <select value={filters.rating || ''} onChange={(e) => go({ rating: e.target.value, page: 0 })}
                style={{ background: C.inputBg, color: C.paper, border: `1px solid ${C.borderStrong}`, borderRadius: 6, padding: '6px 8px' }}>
                <option value="">any rating</option><option value="low">low</option><option value="moderate">moderate</option><option value="high">high</option><option value="severe">severe</option>
              </select>
              <select value={filters.reviewed || ''} onChange={(e) => go({ reviewed: e.target.value, page: 0 })}
                style={{ background: C.inputBg, color: C.paper, border: `1px solid ${C.borderStrong}`, borderRadius: 6, padding: '6px 8px' }}>
                <option value="">reviewed: any</option><option value="no">unreviewed</option><option value="yes">reviewed</option>
              </select>
            </>
          )}
          <button onClick={() => go({ page: 0 })}
            style={{ background: C.gold, color: '#1f1c19', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Search</button>
          <span style={{ color: C.muted, fontSize: 12 }}>{total} orgs</span>
        </div>
      )}

      {!items.length ? (
        <p style={{ color: C.muted }}>No organizations match.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '70vh', overflowY: 'auto' }}>
            {items.map((it) => {
              const isSel = selected && it.orgId === selected.orgId;
              return (
                <button key={it.orgId} onClick={() => setSelectedId(it.orgId)}
                  style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${isSel ? C.gold : C.border}`, background: isSel ? C.panel : C.panel2, color: C.paper }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{it.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    <span style={{ textTransform: 'capitalize' }}>{it.hc.rating || 'unrated'}</span>
                    {it.status && it.status !== 'ACCEPTED' ? ` · ${it.status}` : ''}
                    {it.reviewedAt ? ' · reviewed ✓' : ''}
                    {it.dupCandidates && it.dupCandidates.length ? ' · ⚠ possible dup' : ''}
                  </div>
                </button>
              );
            })}
          </div>
          {selected ? <Detail item={selected} onSaved={() => router.refresh()} /> : <p style={{ color: C.muted }}>Select an org.</p>}
        </div>
      )}

      {mode !== 'worklist' && total > pageSize && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          <button disabled={page <= 0} onClick={() => go({ page: page - 1 })}
            style={{ padding: '6px 12px', borderRadius: 6, border: 'none', fontWeight: 700, cursor: page <= 0 ? 'not-allowed' : 'pointer', background: page <= 0 ? C.panel : C.gold, color: page <= 0 ? C.muted : '#1f1c19' }}>← Prev</button>
          <span style={{ color: C.muted, fontSize: 13, alignSelf: 'center' }}>page {page + 1} / {lastPage + 1}</span>
          <button disabled={page >= lastPage} onClick={() => go({ page: page + 1 })}
            style={{ padding: '6px 12px', borderRadius: 6, border: 'none', fontWeight: 700, cursor: page >= lastPage ? 'not-allowed' : 'pointer', background: page >= lastPage ? C.panel : C.gold, color: page >= lastPage ? C.muted : '#1f1c19' }}>Next →</button>
        </div>
      )}
    </div>
  );
}
