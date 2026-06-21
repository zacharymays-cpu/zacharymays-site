import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { createSupabaseAdminClient } from '../../../lib/supabase/admin';
import AdminNav from '../AdminNav';
import PhotosClient from './PhotosClient';
import { isActiveDecryptor } from '../../../lib/authCore.js';
import { decryptField } from '../../../lib/identity/decrypt';

export const dynamic = 'force-dynamic';

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

const pLabel = (id) => 'P-' + String(id ?? '').slice(0, 8);

// Real names live only as canonical_name_enc. Decryptors see the decrypted name;
// other admins see the P-<uuid8> label. Never throws — falls back to the label.
async function nameFor(encHex, personId, canDecrypt) {
  if (!canDecrypt || !encHex) return pLabel(personId);
  const hex = String(encHex).startsWith('\\x') ? String(encHex).slice(2) : String(encHex);
  try { return await decryptField(Buffer.from(hex, 'hex'), personId, 'canonical_name'); }
  catch { return pLabel(personId); }
}

export default async function AdminPhotosPage({ searchParams }) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const allow = adminEmails();
  const email = (user?.email || '').toLowerCase();
  const isAdmin = allow.length > 0 && allow.includes(email);

  if (!isAdmin) {
    return (
      <main style={{ padding: '3rem', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Not authorized</h1>
        <p style={{ opacity: 0.75, marginTop: '0.75rem' }}>
          You are signed in as <strong>{email || 'unknown'}</strong>, which is not
          on the analyst allowlist. Ask an admin to add your email to{' '}
          <code>ADMIN_EMAILS</code>.
        </p>
      </main>
    );
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') redirect('/admin/mfa');

  const sp = await searchParams;
  const selectedOrgId = typeof sp?.org === 'string' ? sp.org : '';

  const admin = createSupabaseAdminClient();
  const canDecrypt = await isActiveDecryptor(admin, email);

  const { data: orgs } = await admin
    .from('organizations')
    .select('id, name, slug, photo_count')
    .eq('scoring_status', 'ACCEPTED')
    .order('name')
    .limit(500);

  let photos = [];
  let orgPersons = [];

  if (selectedOrgId) {
    const { data: photoData } = await admin
      .from('photos')
      .select(`
        id, url, filename, source_type, source_url, exif_date,
        exif_latitude, exif_longitude,
        processing_status, uploaded_at, created_at,
        ai_analysis_status, ai_analysis_at, ai_analysis_error,
        ai_location_name, ai_location_description, ai_location_confidence,
        ai_location_lat, ai_location_lng, ai_scene_description,
        photo_persons (
          id, person_id, confidence, identified_by, inference_reasoning,
          validation_status, validation_notes, validated_at,
          persons ( id, canonical_name_enc )
        )
      `)
      .eq('org_id', selectedOrgId)
      .order('uploaded_at', { ascending: false });
    photos = photoData || [];
    // Replace each tag's nested person with a decrypted name / P-label (no plaintext in DB).
    for (const photo of photos) {
      for (const pp of (photo.photo_persons || [])) {
        const pid = pp.persons?.id ?? pp.person_id;
        pp.persons = { canonical_name: await nameFor(pp.persons?.canonical_name_enc, pid, canDecrypt) };
      }
    }

    const { data: roleData } = await admin
      .from('person_org_roles')
      .select('person_id, role_type, persons ( id, canonical_name_enc, birth_year )')
      .eq('org_id', selectedOrgId);
    orgPersons = (await Promise.all((roleData || []).map(async (r) => ({
      id: r.person_id,
      canonical_name: await nameFor(r.persons?.canonical_name_enc, r.person_id, canDecrypt),
      birth_year: r.persons?.birth_year ?? null,
      role_type: r.role_type,
    }))))
      .filter((p) => p.canonical_name)
      .sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <AdminNav active="/admin/photos" />
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Photo management</h1>
        <p style={{ opacity: 0.7, marginTop: '0.4rem' }}>
          Upload, tag, and validate photos linked to organizations. Signed in as {email}.
        </p>
      </header>
      <PhotosClient
        orgs={orgs || []}
        selectedOrgId={selectedOrgId}
        photos={photos}
        orgPersons={orgPersons}
      />
    </main>
  );
}
