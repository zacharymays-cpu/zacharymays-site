'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import { createSupabaseAdminClient } from '../../lib/supabase/admin';

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const allow = adminEmails();
  const email = (user.email || '').toLowerCase();
  if (allow.length === 0) throw new Error('ADMIN_EMAILS is not configured.');
  if (!allow.includes(email)) throw new Error(`${email} is not an approved analyst.`);
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') throw new Error('Two-factor step-up required.');
  return user;
}

/**
 * Upload a photo to the photos table with metadata.
 *
 * @param formData - Form data with file and metadata fields
 * @returns Inserted photo record with id
 */
export async function uploadPhoto(formData: FormData) {
  const user = await requireAdmin();

  const file = formData.get('file') as File;
  const sourceType = String(formData.get('sourceType') || 'user_upload');
  const orgId = String(formData.get('orgId') || '');
  const source = String(formData.get('source') || '').trim();
  const caption = String(formData.get('caption') || '').trim();

  if (!file) return { ok: false, error: 'No file provided.' };
  if (!orgId) return { ok: false, error: 'Missing orgId.' };
  if (!['user_upload', 'web_scrape', 'archive'].includes(sourceType)) {
    return { ok: false, error: 'Invalid sourceType.' };
  }

  const admin = createSupabaseAdminClient();

  // Insert photo record
  const { data, error } = await admin.from('photos').insert([{
    org_id: orgId,
    filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    source_type: sourceType,
    source_url: source || null,
    caption: caption || null,
    uploaded_by: user.id,
    uploaded_at: new Date().toISOString(),
  }]).select();

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/photos');
  return { ok: true, photoId: data?.[0]?.id };
}

/**
 * Suggest persons to associate with a photo using ML-based matching.
 *
 * @param photoId - UUID of the photo
 * @returns Array of suggested persons with confidence scores
 */
export async function suggestPhotoAssociations(photoId: string) {
  await requireAdmin();

  if (!photoId) return { ok: false, error: 'Missing photoId.' };

  const admin = createSupabaseAdminClient();

  // Fetch photo metadata
  const { data: photo, error: photoErr } = await admin
    .from('photos')
    .select('id, org_id')
    .eq('id', photoId)
    .single();

  if (photoErr || !photo) {
    return { ok: false, error: 'Photo not found.' };
  }

  // Query persons table for the organization
  const { data: persons, error: personsErr } = await admin
    .from('persons')
    .select('id, canonical_name, roles, birth_location')
    .eq('org_id', photo.org_id);

  if (personsErr) {
    return { ok: false, error: personsErr.message };
  }

  // Simple heuristic-based suggestions (placeholder for ML in future)
  // In production, this would call a vision model or ML inference service
  const suggestions = (persons || []).map((p) => ({
    person_id: p.id,
    canonical_name: p.canonical_name,
    roles: p.roles,
    birth_location: p.birth_location,
    confidence: 0.65, // Placeholder: real suggestions would compute this
    reason: 'Heuristic match based on org membership',
  }));

  return { ok: true, suggestions };
}

/**
 * Tag a person in a photo with a confidence score.
 *
 * @param formData - Form data with photoId, personId, confidence
 * @returns Inserted photo_persons record
 */
export async function tagPhotoPerson(formData: FormData) {
  const user = await requireAdmin();

  const photoId = String(formData.get('photoId') || '');
  const personId = String(formData.get('personId') || '');
  const confidenceStr = String(formData.get('confidence') || '');
  const notes = String(formData.get('notes') || '').trim();

  if (!photoId) return { ok: false, error: 'Missing photoId.' };
  if (!personId) return { ok: false, error: 'Missing personId.' };

  const confidence = parseFloat(confidenceStr);
  if (isNaN(confidence) || confidence < 0.5 || confidence > 1.0) {
    return { ok: false, error: 'Confidence must be between 0.5 and 1.0.' };
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.from('photo_persons').insert([{
    photo_id: photoId,
    person_id: personId,
    identified_by: 'user_manual',
    confidence,
    inference_reasoning: notes || null,
    validation_status: 'pending',
    tagged_by: user.id,
    tagged_at: new Date().toISOString(),
  }]).select();

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/photos');
  return { ok: true, photoPersonId: data?.[0]?.id };
}

/**
 * Validate or dispute a photo-person association.
 *
 * @param formData - Form data with photoPersonId, status, notes
 * @returns Updated photo_persons record
 */
export async function validatePhotoAssociation(formData: FormData) {
  const user = await requireAdmin();

  const photoPersonId = String(formData.get('photoPersonId') || '');
  const status = String(formData.get('status') || '');
  const notes = String(formData.get('notes') || '').trim();

  if (!photoPersonId) return { ok: false, error: 'Missing photoPersonId.' };
  if (!['confirmed', 'disputed', 'rejected'].includes(status)) {
    return { ok: false, error: 'Invalid validation status.' };
  }
  if (!notes) return { ok: false, error: 'Validation notes required.' };

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('photo_persons')
    .update({
      validation_status: status,
      validation_notes: notes,
      validated_at: new Date().toISOString(),
      validated_by: user.id,
    })
    .eq('id', photoPersonId)
    .select();

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/photos');
  return { ok: true, validation: data?.[0] };
}
