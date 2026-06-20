'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  uploadPhoto, tagPhotoPerson, validatePhotoAssociation,
  analyzePhotoWithAI, analyzeBatchPhotos,
} from '../../actions/photos';

const C = {
  paper: '#f4f0e8', muted: 'rgba(244,240,232,0.62)', faint: 'rgba(244,240,232,0.40)',
  panel: '#2f2a25', panel2: '#26221e', border: 'rgba(244,240,232,0.16)',
  borderStrong: 'rgba(244,240,232,0.30)', inputBg: '#1f1c19',
  gold: '#c9a86a', ok: '#7fbf9b', err: '#e08b8b', warn: '#d4a574',
  ai: '#8bb8e0',
};

const input = {
  background: C.inputBg, color: C.paper,
  border: `1px solid ${C.borderStrong}`, borderRadius: 6,
  padding: '6px 10px', fontSize: 14, width: '100%', boxSizing: 'border-box',
};
const btn = (color = C.gold, textColor = '#1f1c19') => ({
  background: color, color: textColor, border: 'none',
  borderRadius: 6, padding: '5px 12px', fontWeight: 700,
  cursor: 'pointer', fontSize: 13,
});

const STATUS_COLORS = { confirmed: C.ok, disputed: C.warn, rejected: C.err, pending: C.muted };
const AI_STATUS_COLORS = { complete: C.ok, error: C.err, processing: C.ai, pending: C.faint, skipped: C.faint };

function Msg({ msg }) {
  if (!msg) return null;
  return <p style={{ marginTop: 6, fontSize: 12, color: msg.ok ? C.ok : C.err }}>{msg.t}</p>;
}

// ─── Org picker ──────────────────────────────────────────────────────────────
function OrgPicker({ orgs, selectedOrgId }) {
  const router = useRouter();
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.muted }}>
        ORGANIZATION
      </label>
      <select
        value={selectedOrgId}
        onChange={(e) => router.replace(`/admin/photos${e.target.value ? `?org=${e.target.value}` : ''}`)}
        style={{ ...input, maxWidth: 420 }}
      >
        <option value="">— select an organization —</option>
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}{o.photo_count ? ` (${o.photo_count} photos)` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Bulk upload form ─────────────────────────────────────────────────────────
function UploadForm({ orgId }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [sourceType, setSourceType] = useState('xfamily');
  const [sourceUrl, setSourceUrl] = useState('');
  const [progress, setProgress] = useState(null); // { done, total, errors }
  const [pending, start] = useTransition();

  function submit() {
    const files = Array.from(fileRef.current?.files || []);
    if (!files.length) return;
    setProgress({ done: 0, total: files.length, errors: [] });

    start(async () => {
      let done = 0;
      const errors = [];
      for (const file of files) {
        const fd = new FormData();
        fd.set('file', file);
        fd.set('orgId', orgId);
        fd.set('sourceType', sourceType);
        fd.set('sourceUrl', sourceUrl);
        const res = await uploadPhoto(fd);
        done++;
        if (!res.ok) errors.push(`${file.name}: ${res.error}`);
        setProgress({ done, total: files.length, errors: [...errors] });
      }
      if (fileRef.current) fileRef.current.value = '';
      setSourceUrl('');
      router.refresh();
    });
  }

  return (
    <div style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: '14px 16px', background: C.panel, marginBottom: '1.5rem' }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Bulk upload photos</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '0 0 auto' }}>
          <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>
            FILES (JPEG/PNG/WebP, max 50 MB each — select multiple)
          </label>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
            style={{ color: C.paper, fontSize: 13 }} />
        </div>
        <div style={{ flex: '0 0 160px' }}>
          <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>SOURCE TYPE</label>
          <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} style={{ ...input }}>
            <option value="xfamily">xFamily</option>
            <option value="archive">Archive</option>
            <option value="user_upload">User upload</option>
            <option value="research_scan">Research scan</option>
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>SOURCE URL (optional)</label>
          <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://…" style={{ ...input }} />
        </div>
        <button onClick={submit} disabled={pending}
          style={{ ...btn(), opacity: pending ? 0.6 : 1, cursor: pending ? 'wait' : 'pointer', flexShrink: 0 }}>
          {pending ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      {progress && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <div style={{ flex: 1, height: 6, background: C.panel2, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: progress.errors.length ? C.warn : C.ok,
                width: `${(progress.done / progress.total) * 100}%`,
                transition: 'width 0.2s',
              }} />
            </div>
            <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>
              {progress.done}/{progress.total}
            </span>
          </div>
          {progress.errors.map((e, i) => (
            <p key={i} style={{ fontSize: 11, color: C.err, margin: 0 }}>{e}</p>
          ))}
          {progress.done === progress.total && progress.errors.length === 0 && (
            <p style={{ fontSize: 12, color: C.ok, margin: 0 }}>All uploaded ✓</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tag form (inside photo detail panel) ────────────────────────────────────
function TagForm({ photoId, orgPersons, onSaved }) {
  const [personId, setPersonId] = useState('');
  const [confidence, setConfidence] = useState('0.8');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();

  function submit() {
    if (!personId) { setMsg({ ok: false, t: 'Select a person.' }); return; }
    setMsg(null);
    const fd = new FormData();
    fd.set('photoId', photoId);
    fd.set('personId', personId);
    fd.set('confidence', confidence);
    fd.set('notes', notes);
    start(async () => {
      const res = await tagPhotoPerson(fd);
      if (res.ok) {
        setMsg({ ok: true, t: 'Tagged ✓' });
        setPersonId(''); setNotes('');
        onSaved?.();
      } else {
        setMsg({ ok: false, t: res.error });
      }
    });
  }

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 12px', background: C.panel2, marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: C.muted }}>TAG A PERSON</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 3 }}>PERSON</label>
          <select value={personId} onChange={(e) => setPersonId(e.target.value)} style={{ ...input }}>
            <option value="">— select —</option>
            {orgPersons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.canonical_name}{p.birth_year ? ` (b. ${p.birth_year})` : ''} · {p.role_type}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: '0 0 90px' }}>
          <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 3 }}>CONFIDENCE</label>
          <input type="number" min="0" max="1" step="0.05" value={confidence}
            onChange={(e) => setConfidence(e.target.value)} style={{ ...input }} />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 3 }}>NOTES (optional)</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Rationale…" style={{ ...input }} />
        </div>
        <button onClick={submit} disabled={pending || !orgPersons.length}
          style={{ ...btn(), opacity: (pending || !orgPersons.length) ? 0.5 : 1, cursor: pending ? 'wait' : 'pointer', flexShrink: 0 }}>
          {pending ? 'Saving…' : 'Tag'}
        </button>
      </div>
      {!orgPersons.length && (
        <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>No persons linked to this org yet.</p>
      )}
      <Msg msg={msg} />
    </div>
  );
}

// ─── Validate row ─────────────────────────────────────────────────────────────
function ValidateRow({ tag, onSaved }) {
  const [status, setStatus] = useState('confirmed');
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();

  const person = tag.persons;
  const name = person?.canonical_name || tag.person_id.slice(0, 8);
  const statusColor = STATUS_COLORS[tag.validation_status] || C.muted;
  const isAi = tag.identified_by === 'ai_vision';

  function submit() {
    if (!notes) { setMsg({ ok: false, t: 'Notes required.' }); return; }
    setMsg(null);
    const fd = new FormData();
    fd.set('photoPersonId', tag.id);
    fd.set('status', status);
    fd.set('notes', notes);
    start(async () => {
      const res = await validatePhotoAssociation(fd);
      if (res.ok) {
        setMsg({ ok: true, t: 'Saved ✓' });
        setOpen(false); setNotes('');
        onSaved?.();
      } else {
        setMsg({ ok: false, t: res.error });
      }
    });
  }

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>{name}</span>
          <span style={{ fontSize: 12, color: isAi ? C.ai : C.muted, marginLeft: 8 }}>
            {isAi ? '🤖 AI' : tag.identified_by} · {Math.round(tag.confidence * 100)}%
          </span>
          {tag.inference_reasoning && (
            <span style={{ fontSize: 11, color: C.faint, marginLeft: 8 }}>"{tag.inference_reasoning}"</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: statusColor, fontWeight: 700, textTransform: 'uppercase' }}>
            {tag.validation_status}
          </span>
          {tag.validation_status === 'pending' && (
            <button onClick={() => setOpen((v) => !v)} style={{ ...btn(C.panel, C.paper), border: `1px solid ${C.borderStrong}`, fontSize: 12 }}>
              {open ? 'Cancel' : 'Validate'}
            </button>
          )}
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            style={{ ...input, flex: '0 0 130px', width: 'auto' }}>
            <option value="confirmed">Confirmed</option>
            <option value="disputed">Disputed</option>
            <option value="rejected">Rejected</option>
          </select>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (required)…" style={{ ...input, flex: '1 1 180px' }} />
          <button onClick={submit} disabled={pending}
            style={{ ...btn(), opacity: pending ? 0.6 : 1, cursor: pending ? 'wait' : 'pointer', flexShrink: 0 }}>
            {pending ? 'Saving…' : 'Save'}
          </button>
          <Msg msg={msg} />
        </div>
      )}
    </div>
  );
}

// ─── AI analysis panel (inside photo detail) ──────────────────────────────────
function AiAnalysisPanel({ photo, onSaved }) {
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();

  const status = photo.ai_analysis_status;
  const statusColor = AI_STATUS_COLORS[status] || C.faint;

  function runAnalysis() {
    setMsg(null);
    start(async () => {
      const res = await analyzePhotoWithAI(photo.id);
      if (res.ok) {
        setMsg({ ok: true, t: `Analysis complete — ${res.newTagCount} new person tag(s) added.` });
        onSaved?.();
      } else {
        setMsg({ ok: false, t: res.error });
      }
    });
  }

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 12px', background: C.panel2, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ai }}>AI ANALYSIS</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: statusColor, fontWeight: 700, textTransform: 'uppercase' }}>{status}</span>
          <button
            onClick={runAnalysis}
            disabled={pending || status === 'processing'}
            style={{ ...btn(C.ai, '#1f1c19'), opacity: (pending || status === 'processing') ? 0.6 : 1, cursor: pending ? 'wait' : 'pointer', fontSize: 12 }}>
            {pending ? 'Analyzing…' : status === 'complete' ? 'Re-analyze' : 'Analyze'}
          </button>
        </div>
      </div>

      {photo.ai_scene_description && (
        <p style={{ fontSize: 13, color: C.paper, marginBottom: 8 }}>{photo.ai_scene_description}</p>
      )}

      {(photo.ai_location_name || photo.ai_location_description) && (
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
          <strong style={{ color: C.paper }}>Location:</strong>{' '}
          {photo.ai_location_name && <span style={{ color: C.gold }}>{photo.ai_location_name} · </span>}
          <span style={{ color: `${AI_STATUS_COLORS[photo.ai_location_confidence] || C.faint}` }}>
            {photo.ai_location_confidence} confidence
          </span>
          {photo.ai_location_description && (
            <p style={{ fontSize: 11, color: C.faint, marginTop: 4, marginBottom: 0 }}>{photo.ai_location_description}</p>
          )}
          {(photo.ai_location_lat || photo.exif_latitude) && (
            <p style={{ fontSize: 11, color: C.faint, marginTop: 2, marginBottom: 0 }}>
              GPS: {photo.ai_location_lat ?? photo.exif_latitude}, {photo.ai_location_lng ?? photo.exif_longitude}
            </p>
          )}
        </div>
      )}

      {photo.ai_analysis_error && (
        <p style={{ fontSize: 11, color: C.err, marginTop: 4 }}>{photo.ai_analysis_error}</p>
      )}

      <Msg msg={msg} />
    </div>
  );
}

// ─── Photo detail panel ───────────────────────────────────────────────────────
function PhotoDetail({ photo, orgPersons, onClose, onSaved }) {
  const tags = photo.photo_persons || [];
  const pendingCount = tags.filter((t) => t.validation_status === 'pending').length;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#1f1c19', borderRadius: 10, border: `1px solid ${C.borderStrong}`,
        maxWidth: 760, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 20,
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{photo.filename}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <img
          src={photo.url}
          alt={photo.filename}
          style={{ width: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 6, background: '#111', marginBottom: 12 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span>Source: <strong style={{ color: C.paper }}>{photo.source_type}</strong></span>
          {photo.exif_date && <span>EXIF date: <strong style={{ color: C.paper }}>{photo.exif_date}</strong></span>}
          {photo.source_url && (
            <span>
              <a href={photo.source_url} target="_blank" rel="noopener noreferrer"
                style={{ color: C.gold }}>Source link ↗</a>
            </span>
          )}
          <span>Status: <strong style={{ color: C.paper }}>{photo.processing_status}</strong></span>
        </div>

        <AiAnalysisPanel photo={photo} onSaved={onSaved} />

        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, marginTop: 16 }}>
          Person tags{tags.length > 0 && ` (${tags.length}${pendingCount ? `, ${pendingCount} pending` : ''})`}
        </div>
        {tags.length === 0 && (
          <p style={{ fontSize: 13, color: C.muted }}>No tags yet.</p>
        )}
        {tags.map((tag) => (
          <ValidateRow key={tag.id} tag={tag} onSaved={onSaved} />
        ))}

        <TagForm photoId={photo.id} orgPersons={orgPersons} onSaved={onSaved} />
      </div>
    </div>
  );
}

// ─── Photo grid ───────────────────────────────────────────────────────────────
function PhotoGrid({ photos, orgPersons, onRefresh }) {
  const [selected, setSelected] = useState(null);
  const [batchMsg, setBatchMsg] = useState(null);
  const [pending, start] = useTransition();

  const unanalyzed = photos.filter((p) => p.ai_analysis_status === 'pending' || p.ai_analysis_status === 'error');

  function analyzeAll() {
    setBatchMsg(null);
    const ids = unanalyzed.map((p) => p.id);
    start(async () => {
      const res = await analyzeBatchPhotos(ids);
      if (res.ok) {
        setBatchMsg({ ok: true, t: `Analyzed ${res.succeeded}/${res.total} photos. ${res.failed ? `${res.failed} failed.` : ''}` });
        onRefresh();
      } else {
        setBatchMsg({ ok: false, t: res.error });
      }
    });
  }

  if (photos.length === 0) {
    return <p style={{ color: C.muted, fontSize: 14 }}>No photos uploaded for this organization yet.</p>;
  }

  return (
    <>
      {unanalyzed.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button
            onClick={analyzeAll}
            disabled={pending}
            style={{ ...btn(C.ai, '#1f1c19'), opacity: pending ? 0.6 : 1, cursor: pending ? 'wait' : 'pointer' }}>
            {pending ? 'Analyzing…' : `Analyze all (${unanalyzed.length} pending)`}
          </button>
          <Msg msg={batchMsg} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {photos.map((photo) => {
          const tags = photo.photo_persons || [];
          const pending = tags.filter((t) => t.validation_status === 'pending').length;
          const aiStatus = photo.ai_analysis_status;
          const aiBadgeColor = AI_STATUS_COLORS[aiStatus] || C.faint;
          return (
            <button key={photo.id} onClick={() => setSelected(photo)}
              style={{
                background: C.panel, border: `1px solid ${pending ? C.warn : C.border}`,
                borderRadius: 8, overflow: 'hidden', cursor: 'pointer', padding: 0, textAlign: 'left',
              }}>
              <div style={{ height: 120, background: '#111', overflow: 'hidden', position: 'relative' }}>
                <img src={photo.url} alt={photo.filename}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
                {aiStatus !== 'complete' && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4, fontSize: 9, fontWeight: 700,
                    background: 'rgba(0,0,0,0.7)', color: aiBadgeColor,
                    padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase',
                  }}>{aiStatus}</span>
                )}
              </div>
              <div style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: 11, color: C.paper, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {photo.filename}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {tags.length} tag{tags.length !== 1 ? 's' : ''}
                  {pending > 0 && <span style={{ color: C.warn }}> · {pending} pending</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <PhotoDetail
          photo={selected}
          orgPersons={orgPersons}
          onClose={() => setSelected(null)}
          onSaved={() => { onRefresh(); setSelected(null); }}
        />
      )}
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function PhotosClient({ orgs, selectedOrgId, photos, orgPersons }) {
  const router = useRouter();
  const selectedOrg = orgs.find((o) => o.id === selectedOrgId);

  return (
    <div>
      <OrgPicker orgs={orgs} selectedOrgId={selectedOrgId} />

      {selectedOrgId ? (
        <>
          <div style={{ marginBottom: '1rem', fontSize: 14, color: C.muted }}>
            Showing photos for <strong style={{ color: C.paper }}>{selectedOrg?.name ?? selectedOrgId}</strong>
            {' — '}{photos.length} photo{photos.length !== 1 ? 's' : ''}
          </div>
          <UploadForm orgId={selectedOrgId} />
          <PhotoGrid photos={photos} orgPersons={orgPersons} onRefresh={() => router.refresh()} />
        </>
      ) : (
        <p style={{ color: C.muted, fontSize: 14 }}>Select an organization above to manage its photos.</p>
      )}
    </div>
  );
}
