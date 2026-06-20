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

// Review thresholds. DRIFT_HI: |published − AI| at/above which a criterion needs a
// look (also where Δ goes gold). DRIFT_BIG: large divergence → red. SPREAD_HI: per-
// criterion model disagreement worth flagging. NOTE: per-criterion spreads run 0–10
// (max ~8 in the data), NOT the 0–100 org scale — the old `> 20` test never fired.
const DRIFT_HI = 1;
const DRIFT_BIG = 3;
const SPREAD_HI = 3;
// Org-composite scale (0–100). ORG_SPREAD_HI keeps the existing >20 org threshold —
// org spreads reach ~48, so unlike the per-criterion scale it fires correctly.
const ORG_DRIFT_HI = 3;
const ORG_DRIFT_BIG = 8;
const ORG_SPREAD_HI = 20;

const inputStyle = {
  background: C.inputBg, color: C.paper, border: `1px solid ${C.borderStrong}`,
  borderRadius: 6, padding: '6px 8px', fontSize: 14,
};
const btnStyle = {
  background: C.gold, color: '#1f1c19', border: 'none', borderRadius: 6,
  padding: '6px 12px', fontWeight: 700, cursor: 'pointer',
};

function Criterion({ orgId, c, stale }) {
  const [score, setScore] = useState(c.score == null ? 'NA' : String(c.score));
  const [rationale, setRationale] = useState('');
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();

  // The review signal: how far the published score has moved from the AI jury's
  // original, and whether the models disagreed with each other. ai = the jury's
  // number (what you're calling the "old" score); cur = the published/current one.
  const ai = c.juryMean;
  const cur = c.score;
  const delta = ai != null && cur != null ? Math.round((cur - ai) * 10) / 10 : null;
  const mag = delta == null ? 0 : Math.abs(delta);
  const drift = mag >= DRIFT_HI;
  const split = c.jurySpread != null && c.jurySpread >= SPREAD_HI;
  const attention = drift || split;
  const deltaColor = mag >= DRIFT_BIG ? C.err : mag >= DRIFT_HI ? C.gold : C.faint;
  const borderColor = mag >= DRIFT_BIG ? C.err : attention ? C.gold : C.border;

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
      border: `1px solid ${borderColor}`, borderRadius: 8,
      padding: '12px 14px', marginBottom: 10, background: C.panel2,
      // Dim the criteria with nothing to review so the ones that need eyes pop.
      opacity: attention ? 1 : 0.58,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: C.paper }}>
          {c.criterion} <span style={{ color: C.muted, fontWeight: 400 }}>· {c.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {split ? (
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.gold,
              border: `1px solid ${C.gold}`, borderRadius: 999, padding: '2px 8px',
            }}>
              models split · {c.jurySpread}
            </span>
          ) : null}
          {/* The comparison is the subject: AI's original → what's published, and the gap. */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 14 }}>
            <span style={{ color: C.muted }}>AI <strong style={{ color: C.paper, fontWeight: 600 }}>{ai ?? '—'}</strong></span>
            <span style={{ color: C.faint }}>→</span>
            <span style={{ color: C.muted }}>published <strong style={{ color: C.paper, fontWeight: 600 }}>{cur ?? 'N/A'}</strong></span>
            {delta != null && mag >= 0.05 ? (
              <span style={{ marginLeft: 4, fontWeight: 700, color: deltaColor }}>
                Δ {delta > 0 ? '+' : ''}{delta}
              </span>
            ) : delta != null ? (
              <span style={{ marginLeft: 4, fontSize: 12, color: C.faint }}>match</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Per-model scores for this criterion — so the spread is explainable. Hidden
          during a rescore gap (no model rows yet) so it doesn't show false N/A. */}
      {!stale ? (
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
      ) : null}

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

  // Org-level review signal: how far the published composite has moved from the
  // AI jury's, and whether the models disagreed badly (high spread).
  const aiComp = item.juryComposite;
  const pubComp = item.composite;
  const orgDelta = aiComp != null && pubComp != null ? Math.round((pubComp - aiComp) * 10) / 10 : null;
  const orgMag = orgDelta == null ? 0 : Math.abs(orgDelta);
  const orgDeltaColor = orgMag >= ORG_DRIFT_BIG ? C.err : orgMag >= ORG_DRIFT_HI ? C.gold : C.faint;
  const highSpread = item.jurySpread != null && item.jurySpread >= ORG_SPREAD_HI;

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
          {/* AI jury's composite + how far the published one moved (badge shows where it landed). */}
          {aiComp != null ? (
            <span style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>
              AI <strong style={{ color: C.paper, fontWeight: 600 }}>{aiComp}</strong>
              {orgDelta != null && orgMag >= 0.05 ? (
                <strong style={{ marginLeft: 6, fontWeight: 700, color: orgDeltaColor }}>
                  Δ {orgDelta > 0 ? '+' : ''}{orgDelta}
                </strong>
              ) : orgDelta != null ? (
                <span style={{ marginLeft: 6, color: C.faint }}>· match</span>
              ) : null}
            </span>
          ) : null}
          {item.declineToScore ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: C.paper, background: C.err, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>⚠ models declined</span>
          ) : item.jurySpread != null ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: highSpread ? C.gold : C.muted, whiteSpace: 'nowrap' }}>spread {item.jurySpread}</span>
          ) : null}
          <span style={{ fontSize: 13, color: C.paper, padding: '3px 10px', borderRadius: 999, background: TIER_COLOR[item.tier] || '#555', whiteSpace: 'nowrap' }}>
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
              <span style={{ color: C.muted, fontSize: 12 }}>Jury YM Composites:</span>
              {item.models.map((m) => (
                <span key={m.key} title={item.modelScoresMissing ? 'coverage updating' : `${m.scored}/10 criteria scored`}>
                  {m.label}{' '}
                  <strong>{m.composite == null ? '—' : `${m.composite}%`}</strong>
                  {/* Suppress coverage annotations during a rescore gap — coverage reads
                      0 for everything then, which would falsely look like abstention. */}
                  {item.modelScoresMissing ? null
                    : m.abstained ? <span style={{ color: C.err }}> · abstained (0/10)</span>
                    : m.lowCoverage ? <span style={{ color: C.gold }}> · only {m.scored}/10</span>
                    : <span style={{ color: C.faint }}> · {m.scored}/10</span>}
                </span>
              ))}
              <span style={{ color: C.muted, fontSize: 12, width: '100%', marginTop: 2 }}>
                {item.modelScoresMissing
                  ? 'Per-model coverage is updating (rescore in progress) — the spread may be temporarily inflated; recheck shortly.'
                  : <>Spread {item.jurySpread ?? '—'} = range across the models that scored.
                      {item.anyAbstained
                        ? ' A model marked “abstained” scored every criterion N/A (it declined to rate this org); it is excluded from the AI YM Composite and the spread above.'
                        : ''}</>}
              </span>
            </div>
          ) : null}

          {item.criteria.map((c) => <Criterion key={c.criterion} orgId={item.orgId} c={c} stale={item.modelScoresMissing} />)}

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
