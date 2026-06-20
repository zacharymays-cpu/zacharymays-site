'use server';

import { put } from '@vercel/blob';
import * as exifParser from 'exif-parser';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import { createSupabaseAdminClient } from '../../lib/supabase/admin';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const VISION_MODEL = 'google/gemini-2.5-flash';

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const allow = adminEmails();
  const email = (user?.email || '').toLowerCase();
  if (!user || allow.length === 0 || !allow.includes(email))
    throw new Error('Not authorized.');
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') throw new Error('Two-factor step-up required.');
  return user;
}

export async function uploadPhoto(formData: FormData) {
  const user = await requireAdmin();

  const file = formData.get('file') as File;
  const orgId = String(formData.get('orgId') || '');
  const sourceType = String(formData.get('sourceType') || 'user_upload');
  const sourceUrl = String(formData.get('sourceUrl') || '').trim() || null;
  const sourceAttribution = String(formData.get('sourceAttribution') || '').trim() || null;

  if (!file || !file.size) return { ok: false, error: 'No file provided.' };
  if (!orgId) return { ok: false, error: 'Missing orgId.' };
  if (!['xfamily', 'archive', 'user_upload', 'research_scan'].includes(sourceType))
    return { ok: false, error: 'Invalid sourceType.' };
  if (file.size > 50 * 1024 * 1024) return { ok: false, error: 'File exceeds 50 MB.' };
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return { ok: false, error: 'Only JPEG, PNG, WebP supported.' };

  const blob = await put(file.name, file, { access: 'public' });

  const buffer = await file.arrayBuffer();
  let exifData: Record<string, unknown> = {};
  try {
    const parser = exifParser.create(Buffer.from(buffer));
    const result = parser.parse();
    if (result.tags) {
      exifData = {
        exif_date: result.tags.DateTime
          ? new Date(result.tags.DateTime * 1000).toISOString().split('T')[0]
          : null,
        exif_latitude: result.tags.GPSLatitude ?? null,
        exif_longitude: result.tags.GPSLongitude ?? null,
        exif_camera_model: result.tags.Model ?? null,
        exif_confidence: result.tags.GPSLatitude ? 'high' : 'low',
      };
    }
  } catch {
    exifData = { exif_confidence: 'low' };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from('photos').insert([{
    org_id: orgId,
    url: blob.url,
    filename: file.name,
    file_size_bytes: file.size,
    mime_type: file.type,
    ...exifData,
    source_type: sourceType,
    source_url: sourceUrl,
    source_attribution: sourceAttribution,
    uploaded_by: user.id,
    uploaded_at: new Date().toISOString(),
    processing_status: 'extracted',
    ai_analysis_status: 'pending',
  }]).select().single();

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/photos');
  return { ok: true, photo: data };
}

// ─── AI analysis ──────────────────────────────────────────────────────────────

type PersonRow = { id: string; canonical_name: string; display_name: string | null; birth_year: number | null };

interface AiPerson {
  matched_name: string | null;
  confidence: number;
  description: string;
  reasoning: string;
}

interface AiLocation {
  name: string | null;
  description: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  lat: number | null;
  lng: number | null;
}

interface AiResponse {
  persons: AiPerson[];
  location: AiLocation;
  scene_description: string;
}

async function callVisionAPI(imageUrl: string, prompt: string): Promise<AiResponse> {
  const key = process.env.OPENROUTER_KEY_RESEARCH;
  if (!key) throw new Error('OPENROUTER_KEY_RESEARCH not configured.');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://zacharymays.com',
      'X-Title': 'Cultiness Spectrum Research',
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response from vision model.');

  try {
    return JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw)) as AiResponse;
  } catch {
    throw new Error('Vision model returned non-JSON response.');
  }
}

export async function analyzePhotoWithAI(photoId: string) {
  await requireAdmin();
  if (!photoId) return { ok: false, error: 'Missing photoId.' };

  const admin = createSupabaseAdminClient();

  // Fetch photo + org persons
  const { data: photo, error: photoErr } = await admin
    .from('photos')
    .select('id, url, filename, org_id, exif_date, exif_latitude, exif_longitude, ai_analysis_status')
    .eq('id', photoId)
    .single();

  if (photoErr || !photo) return { ok: false, error: 'Photo not found.' };

  const { data: roles } = await admin
    .from('person_org_roles')
    .select('person_id, role_type, persons (id, canonical_name, display_name, birth_year)')
    .eq('org_id', photo.org_id);

  const persons: (PersonRow & { role_type: string })[] = (roles || [])
    .map((r) => {
      const p = r.persons as unknown as PersonRow | null;
      return p ? { ...p, role_type: r.role_type ?? '' } : null;
    })
    .filter(Boolean) as (PersonRow & { role_type: string })[];

  // Mark as processing
  await admin.from('photos').update({ ai_analysis_status: 'processing' }).eq('id', photoId);

  const personList = persons.length
    ? persons.map((p) =>
        `- ${p.canonical_name}${p.birth_year ? ` (born ${p.birth_year})` : ''}${p.role_type ? `, ${p.role_type}` : ''}`
      ).join('\n')
    : '(no known persons for this organization yet)';

  const exifHint = photo.exif_latitude && photo.exif_longitude
    ? `\nEXIF GPS: ${photo.exif_latitude}, ${photo.exif_longitude} — use this as ground-truth location.`
    : '';

  const prompt = `You are analyzing a photograph for a religious-organization research database.

Known persons associated with this organization:
${personList}
${exifHint}

Analyze the photo and respond with a JSON object exactly matching this schema:
{
  "persons": [
    {
      "matched_name": "<canonical name from the list above, or null if no match>",
      "confidence": <0.0–1.0>,
      "description": "<physical description of this person>",
      "reasoning": "<why you matched or didn't match>"
    }
  ],
  "location": {
    "name": "<location name if identifiable, else null>",
    "description": "<visible location clues: landmarks, architecture, signage, vegetation, geography>",
    "confidence": "<high|medium|low|none>",
    "lat": <latitude number if determinable from landmarks, else null>,
    "lng": <longitude number if determinable from landmarks, else null>
  },
  "scene_description": "<1–2 sentence summary of what is happening in the photo>"
}

Only match a person if you have genuine confidence. Null is better than a wrong match.`;

  let aiResult: AiResponse;
  try {
    aiResult = await callVisionAPI(photo.url, prompt);
  } catch (err) {
    await admin.from('photos').update({
      ai_analysis_status: 'error',
      ai_analysis_error: String(err),
      ai_analysis_at: new Date().toISOString(),
    }).eq('id', photoId);
    return { ok: false, error: String(err) };
  }

  // Write location back to photo
  const loc = aiResult.location ?? {};
  await admin.from('photos').update({
    ai_analysis_status: 'complete',
    ai_analysis_at: new Date().toISOString(),
    ai_analysis_error: null,
    ai_location_name: loc.name ?? null,
    ai_location_description: loc.description ?? null,
    ai_location_confidence: loc.confidence ?? 'none',
    ai_location_lat: loc.lat ?? null,
    ai_location_lng: loc.lng ?? null,
    ai_scene_description: aiResult.scene_description ?? null,
    processing_status: 'analyzed',
  }).eq('id', photoId);

  // Build a lookup map: canonical_name (lowercase) → person record
  const personByName = new Map(persons.map((p) => [p.canonical_name.toLowerCase(), p]));

  // Insert photo_persons for AI-identified persons (skip duplicates)
  const { data: existingTags } = await admin
    .from('photo_persons')
    .select('person_id')
    .eq('photo_id', photoId);
  const alreadyTagged = new Set((existingTags || []).map((t) => t.person_id));

  const newTags = (aiResult.persons ?? [])
    .filter((ap) => ap.matched_name && ap.confidence >= 0.4)
    .map((ap) => {
      const p = personByName.get(ap.matched_name!.toLowerCase());
      if (!p || alreadyTagged.has(p.id)) return null;
      return {
        photo_id: photoId,
        person_id: p.id,
        identified_by: 'ai_vision',
        confidence: Math.min(1, Math.max(0, ap.confidence)),
        inference_reasoning: ap.reasoning ?? null,
        validation_status: 'pending',
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  if (newTags.length > 0) {
    await admin.from('photo_persons').insert(newTags);
  }

  revalidatePath('/admin/photos');
  return { ok: true, aiResult, newTagCount: newTags.length };
}

export async function analyzeBatchPhotos(photoIds: string[]) {
  await requireAdmin();
  if (!photoIds.length) return { ok: false, error: 'No photo IDs provided.' };

  const results = await Promise.allSettled(
    photoIds.map((id) => analyzePhotoWithAI(id))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled' && (r.value as { ok: boolean }).ok).length;
  const failed = results.length - succeeded;
  revalidatePath('/admin/photos');
  return { ok: true, succeeded, failed, total: results.length };
}

// ─── Existing actions ─────────────────────────────────────────────────────────

export async function suggestPhotoAssociations(photoId: string) {
  await requireAdmin();
  if (!photoId) return { ok: false, error: 'Missing photoId.' };

  const admin = createSupabaseAdminClient();
  const { data: photo, error: photoErr } = await admin
    .from('photos').select('org_id').eq('id', photoId).single();
  if (photoErr || !photo) return { ok: false, error: 'Photo not found.' };

  const { data: roles, error: rolesErr } = await admin
    .from('person_org_roles')
    .select('person_id, role_type, persons (id, canonical_name, display_name, birth_year)')
    .eq('org_id', photo.org_id);
  if (rolesErr) return { ok: false, error: rolesErr.message };

  const suggestions = (roles || []).map((r) => {
    const p = r.persons as unknown as PersonRow | null;
    return {
      person_id: r.person_id,
      canonical_name: p?.canonical_name ?? '',
      display_name: p?.display_name ?? null,
      birth_year: p?.birth_year ?? null,
      role_type: r.role_type,
      confidence: 0.6,
    };
  }).filter((s) => s.canonical_name);

  return { ok: true, suggestions };
}

export async function tagPhotoPerson(formData: FormData) {
  await requireAdmin();

  const photoId = String(formData.get('photoId') || '');
  const personId = String(formData.get('personId') || '');
  const confidence = parseFloat(String(formData.get('confidence') || '0.8'));
  const notes = String(formData.get('notes') || '').trim();

  if (!photoId) return { ok: false, error: 'Missing photoId.' };
  if (!personId) return { ok: false, error: 'Missing personId.' };
  if (isNaN(confidence) || confidence < 0 || confidence > 1)
    return { ok: false, error: 'Confidence must be 0–1.' };

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from('photo_persons').insert([{
    photo_id: photoId,
    person_id: personId,
    identified_by: 'user_manual',
    confidence,
    inference_reasoning: notes || null,
    validation_status: 'pending',
  }]).select().single();

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/photos');
  return { ok: true, tag: data };
}

export async function validatePhotoAssociation(formData: FormData) {
  const user = await requireAdmin();

  const photoPersonId = String(formData.get('photoPersonId') || '');
  const status = String(formData.get('status') || '');
  const notes = String(formData.get('notes') || '').trim();

  if (!photoPersonId) return { ok: false, error: 'Missing photoPersonId.' };
  if (!['confirmed', 'disputed', 'rejected'].includes(status))
    return { ok: false, error: 'Invalid status.' };
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
    .select().single();

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/photos');
  return { ok: true, validation: data };
}
