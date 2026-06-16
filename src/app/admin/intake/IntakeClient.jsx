'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitProposal, decideProposal } from './actions';

const C = {
  paper: '#f4f0e8', muted: 'rgba(244,240,232,0.62)', faint: 'rgba(244,240,232,0.40)',
  panel: '#2f2a25', panel2: '#26221e', border: 'rgba(244,240,232,0.16)',
  borderStrong: 'rgba(244,240,232,0.30)', inputBg: '#1f1c19', gold: '#c9a86a',
  ok: '#7fbf9b', err: '#e08b8b', warn: '#d4a574',
};
const input = { background: C.inputBg, color: C.paper, border: `1px solid ${C.borderStrong}`, borderRadius: 6, padding: '7px 9px', fontSize: 14, width: '100%' };
const STATUS_COLOR = { PROPOSED: C.gold, APPROVED: C.ok, REJECTED: C.err, PIPELINE_RUNNING: C.warn, COMPLETED: C.muted };

function DupWarning({ duplicates }) {
  const all = [...(duplicates?.orgs || []).map((d) => ({ ...d, t: 'org' })), ...(duplicates?.proposals || []).map((d) => ({ ...d, t: 'proposal' }))];
  if (!all.length) return null;
  return (
    <div style={{ border: `1px solid ${C.err}`, borderRadius: 8, padding: '10px 12px', margin: '10px 0', background: C.panel2 }}>
      <strong style={{ color: C.err, fontSize: 13 }}>⚠ Possible duplicates:</strong>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: C.muted, fontSize: 13 }}>
        {all.map((d) => <li key={`${d.t}-${d.id}`}>{d.name} <span style={{ color: C.faint }}>({d.t}, {d.exact ? 'exact' : `${Math.round(d.score * 100)}%`})</span></li>)}
      </ul>
    </div>
  );
}

function ProposalForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: '', category: '', justification: '', category_fit: '', public_interest: '', source_pre_assessment: '' });
  const [dups, setDups] = useState(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function submit(confirm) {
    setMsg(null);
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.set(k, v));
    if (confirm) fd.set('confirm', 'true');
    start(async () => {
      const res = await submitProposal(fd);
      if (res.needsConfirm) { setDups(res.duplicates); setNeedsConfirm(true); setMsg({ ok: false, t: 'Possible duplicate — confirm to submit anyway.' }); return; }
      if (res.ok) { setMsg({ ok: true, t: 'Proposal submitted ✓' }); setF({ name: '', category: '', justification: '', category_fit: '', public_interest: '', source_pre_assessment: '' }); setDups(null); setNeedsConfirm(false); router.refresh(); }
      else setMsg({ ok: false, t: res.error });
    });
  }

  return (
    <div style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 10, padding: '16px 18px', background: C.panel, marginBottom: 24 }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Propose an organization</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={{ fontSize: 12, color: C.muted }}>Name *</label><input style={input} value={f.name} onChange={set('name')} /></div>
        <div><label style={{ fontSize: 12, color: C.muted }}>Category *</label><input style={input} value={f.category} onChange={set('category')} /></div>
      </div>
      {[['justification', 'Justification'], ['category_fit', 'Category fit'], ['public_interest', 'Public interest'], ['source_pre_assessment', 'Source pre-assessment']].map(([k, label]) => (
        <div key={k} style={{ marginTop: 10 }}>
          <label style={{ fontSize: 12, color: C.muted }}>{label}</label>
          <textarea style={{ ...input, minHeight: 48, resize: 'vertical' }} value={f[k]} onChange={set(k)} />
        </div>
      ))}
      {needsConfirm && <DupWarning duplicates={dups} />}
      <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
        <button onClick={() => submit(false)} disabled={pending || !f.name.trim() || !f.category.trim()}
          style={{ background: C.gold, color: '#1f1c19', border: 'none', borderRadius: 6, padding: '7px 14px', fontWeight: 700, cursor: 'pointer', opacity: pending ? 0.6 : 1 }}>
          {pending ? 'Submitting…' : 'Submit proposal'}
        </button>
        {needsConfirm && (
          <button onClick={() => submit(true)} disabled={pending}
            style={{ background: 'transparent', color: C.err, border: `1px solid ${C.err}`, borderRadius: 6, padding: '7px 14px', fontWeight: 700, cursor: 'pointer' }}>
            Submit anyway (not a duplicate)
          </button>
        )}
        {msg && <span style={{ fontSize: 13, color: msg.ok ? C.ok : C.err }}>{msg.t}</span>}
      </div>
    </div>
  );
}

function ProposalRow({ p }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();
  const open = p.status === 'PROPOSED';

  function decide(decision) {
    setMsg(null);
    const fd = new FormData();
    fd.set('proposalId', p.id); fd.set('decision', decision); fd.set('reason', reason);
    start(async () => {
      const res = await decideProposal(fd);
      setMsg(res.ok ? { ok: true, t: 'Saved ✓' } : { ok: false, t: res.error });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 8, background: C.panel2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{p.name} <span style={{ color: C.muted, fontWeight: 400, fontSize: 12 }}>· {p.category}</span></div>
          <div style={{ fontSize: 12, color: C.muted }}>by {p.proposedBy || '—'}{p.reviewedBy ? ` · reviewed by ${p.reviewedBy}` : ''}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1f1c19', background: STATUS_COLOR[p.status] || C.muted, padding: '3px 9px', borderRadius: 999, height: 'fit-content' }}>{p.status}</span>
      </div>
      {p.justification && <p style={{ fontSize: 13, color: C.paper, marginTop: 6, whiteSpace: 'pre-wrap' }}>{p.justification}</p>}
      {p.rejectionReason && <p style={{ fontSize: 12, color: C.err, marginTop: 4 }}>Rejected: {p.rejectionReason}</p>}
      {open && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input style={{ ...input, width: 'auto', flex: 1, minWidth: 180 }} placeholder="reject reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button onClick={() => decide('approve')} disabled={pending} style={{ background: C.ok, color: '#1f1c19', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
          <button onClick={() => decide('reject')} disabled={pending} style={{ background: 'transparent', color: C.err, border: `1px solid ${C.err}`, borderRadius: 6, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
          {msg && <span style={{ fontSize: 12, color: msg.ok ? C.ok : C.err }}>{msg.t}</span>}
        </div>
      )}
    </div>
  );
}

export default function IntakeClient({ proposals }) {
  return (
    <div>
      <ProposalForm />
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 }}>Proposals ({proposals.length})</h2>
      {proposals.length ? proposals.map((p) => <ProposalRow key={p.id} p={p} />) : <p style={{ color: C.muted }}>No proposals yet.</p>}
    </div>
  );
}
