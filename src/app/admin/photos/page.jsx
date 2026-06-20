import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { createSupabaseAdminClient } from '../../../lib/supabase/admin';
import AdminNav from '../AdminNav';
import PhotosClient from './PhotosClient';

export const dynamic = 'force-dynamic';

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
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
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasVerifiedTotp = (factors?.totp || []).some((f) => f.status === 'verified');
  if (!hasVerifiedTotp || aal?.currentLevel !== 'aal2') redirect('/admin/mfa');

  const sp = await searchParams;
  const selectedOrgId = typeof sp?.org === 'string' ? sp.org : '';

  const admin = createSupabaseAdminClient();

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
        processing_status, uploaded_at, created_at,
        photo_persons (
          id, person_id, confidence, identified_by, inference_reasoning,
          validation_status, validation_notes, validated_at,
          persons ( canonical_name, display_name )
        )
      `)
      .eq('org_id', selectedOrgId)
      .order('uploaded_at', { ascending: false });
    photos = photoData || [];

    const { data: roleData } = await admin
      .from('person_org_roles')
      .select('person_id, role_type, persons ( id, canonical_name, display_name, birth_year )')
      .eq('org_id', selectedOrgId);
    orgPersons = (roleData || [])
      .map((r) => ({
        id: r.person_id,
        canonical_name: r.persons?.canonical_name ?? '',
        display_name: r.persons?.display_name ?? null,
        birth_year: r.persons?.birth_year ?? null,
        role_type: r.role_type,
      }))
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
