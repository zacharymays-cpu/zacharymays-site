'use client';

import { useMemo, useState, useTransition } from 'react';
import { applyCuratorDecision } from './actions';

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
        <option value="approve">Approve</option>
        <option value="request_evidence">Request additional evidence</option>
        <option value="modify">Modify score</option>
        <option value="reject">Flag for review</option>
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

function Detail({ item, onSaved }) {
  const hc = item.hc;
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px', background: C.panel }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{item.name}</h2>
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{item.category || 'Uncategorized'}</p>

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
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 2 }}>Young &amp; Reed (C1–C10)</div>
          <div style={{ color: C.paper, fontWeight: 700, fontSize: 18 }}>{fmt(item.dualTrack.youngReed, '/100')}</div>
        </div>
        <div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 2 }}>Lifton C11 (totalism)</div>
          <div style={{ color: C.paper, fontWeight: 700, fontSize: 18 }}>{item.dualTrack.liftonC11 == null ? '—' : `${item.dualTrack.liftonC11.toFixed(1)}/10`}</div>
        </div>
      </div>

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

export default function CuratorClient({ items }) {
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(items[0]?.orgId || null);
  const [done, setDone] = useState(() => new Set());

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((it) => it.signals.some((s) => s.type === filter));
  }, [items, filter]);

  const selected = filtered.find((it) => it.orgId === selectedId) || filtered[0] || null;

  const filterBtn = (key, label) => (
    <button key={key} onClick={() => setFilter(key)}
      style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        border: `1px solid ${filter === key ? C.gold : C.border}`,
        background: filter === key ? C.gold : 'transparent', color: filter === key ? '#1f1c19' : C.muted }}>
      {label}
    </button>
  );

  if (!items.length) return <p style={{ color: C.muted }}>No organizations to review.</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {filterBtn('all', `All (${items.length})`)}
        {filterBtn('low_evidence', 'Low evidence')}
        {filterBtn('boundary', 'Severe rating')}
        {filterBtn('confidence', 'Low confidence')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '70vh', overflowY: 'auto' }}>
          {filtered.map((it) => {
            const isSel = selected && it.orgId === selected.orgId;
            return (
              <button key={it.orgId} onClick={() => setSelectedId(it.orgId)}
                style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${isSel ? C.gold : C.border}`, background: isSel ? C.panel : C.panel2,
                  color: C.paper, opacity: done.has(it.orgId) ? 0.5 : 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{it.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  <span style={{ textTransform: 'capitalize' }}>{it.hc.rating || 'unrated'}</span>
                  {it.signals.length ? ` · ${it.signals.length} signal${it.signals.length > 1 ? 's' : ''}` : ''}
                  {done.has(it.orgId) ? ' · reviewed ✓' : ''}
                </div>
              </button>
            );
          })}
        </div>
        {selected ? (
          <Detail item={selected} onSaved={() => setDone((d) => new Set(d).add(selected.orgId))} />
        ) : (
          <p style={{ color: C.muted }}>No items match this filter.</p>
        )}
      </div>
    </div>
  );
}
