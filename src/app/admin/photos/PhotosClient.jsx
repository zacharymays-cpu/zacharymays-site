'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadPhoto, tagPhotoPerson, validatePhotoAssociation } from '../../actions/photos';

const C = {
  paper: '#f4f0e8', muted: 'rgba(244,240,232,0.62)', faint: 'rgba(244,240,232,0.40)',
  panel: '#2f2a25', panel2: '#26221e', border: 'rgba(244,240,232,0.16)',
  borderStrong: 'rgba(244,240,232,0.30)', inputBg: '#1f1c19',
  gold: '#c9a86a', ok: '#7fbf9b', err: '#e08b8b', warn: '#d4a574',
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

// ─── Upload form ─────────────────────────────────────────────────────────────
function UploadForm({ orgId }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [sourceType, setSourceType] = useState('user_upload');
  const [sourceUrl, setSourceUrl] = useState('');
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();

  function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setMsg({ ok: false, t: 'Select a file first.' }); return; }
    setMsg(null);
    const fd = new FormData();
    fd.set('file', file);
    fd.set('orgId', orgId);
    fd.set('sourceType', sourceType);
    fd.set('sourceUrl', sourceUrl);
    start(async () => {
      const res = await uploadPhoto(fd);
      if (res.ok) {
        setMsg({ ok: true, t: 'Uploaded ✓' });
        if (fileRef.current) fileRef.current.value = '';
        setSourceUrl('');
        router.refresh();
      } else {
        setMsg({ ok: false, t: res.error });
      }
    });
  }

  return (
    <div style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: '14px 16px', background: C.panel, marginBottom: '1.5rem' }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Upload photo</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '0 0 auto' }}>
          <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>FILE (JPEG/PNG/WebP, max 50 MB)</label>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
            style={{ color: C.paper, fontSize: 13 }} />
        </div>
        <div style={{ flex: '0 0 160px' }}>
          <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>SOURCE TYPE</label>
          <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} style={{ ...input }}>
            <option value="user_upload">User upload</option>
            <option value="archive">Archive</option>
            <option value="xfamily">xFamily</option>
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
      <Msg msg={msg} />
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
          <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>
            {tag.identified_by} · {Math.round(tag.confidence * 100)}%
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

        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
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

  if (photos.length === 0) {
    return <p style={{ color: C.muted, fontSize: 14 }}>No photos uploaded for this organization yet.</p>;
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {photos.map((photo) => {
          const tags = photo.photo_persons || [];
          const pending = tags.filter((t) => t.validation_status === 'pending').length;
          return (
            <button key={photo.id} onClick={() => setSelected(photo)}
              style={{
                background: C.panel, border: `1px solid ${pending ? C.warn : C.border}`,
                borderRadius: 8, overflow: 'hidden', cursor: 'pointer', padding: 0, textAlign: 'left',
              }}>
              <div style={{ height: 120, background: '#111', overflow: 'hidden' }}>
                <img src={photo.url} alt={photo.filename}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
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
