'use server';

import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';
import * as exifParser from 'exif-parser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function uploadPhoto(
  file: File,
  metadata: {
    sourceType: 'xfamily' | 'archive' | 'user_upload' | 'research_scan',
    sourceUrl?: string,
    sourceAttribution?: string,
    orgId: string
  }
) {
  // Validate file size
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('File exceeds 50 MB limit');
  }

  // Validate mime type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Only JPEG, PNG, WebP supported');
  }

  // Upload to Vercel Blob
  const blob = await put(file.name, file, { access: 'public' });

  // Extract EXIF
  const buffer = await file.arrayBuffer();
  let exifData: any = {};
  try {
    const parser = exifParser.create(Buffer.from(buffer));
    const result = parser.parse();
    if (result.tags) {
      exifData = {
        exif_date: result.tags.DateTime ? new Date(result.tags.DateTime).toISOString().split('T')[0] : null,
        exif_latitude: result.tags.GPSLatitude,
        exif_longitude: result.tags.GPSLongitude,
        exif_camera_model: result.tags.Model,
        exif_confidence: result.tags.GPSLatitude ? 'high' : 'low'
      };
    }
  } catch (e) {
    exifData = { exif_confidence: 'low' };
  }

  // Create photo record
  const { data, error } = await supabase
    .from('photos')
    .insert([{
      org_id: metadata.orgId,
      url: blob.url,
      filename: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      ...exifData,
      source_type: metadata.sourceType,
      source_url: metadata.sourceUrl,
      source_attribution: metadata.sourceAttribution,
      processing_status: 'extracted'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface PhotoAssociation {
  person_id: string;
  person_name: string;
  confidence: number;
  reasoning: string;
  identified_by: 'contextual_inference';
}

export async function suggestPhotoAssociations(photoId: string): Promise<PhotoAssociation[]> {
  // Fetch photo with EXIF data
  const { data: photo, error: photoError } = await supabase
    .from('photos')
    .select('*')
    .eq('id', photoId)
    .single();

  if (photoError || !photo?.exif_date || !photo?.exif_latitude) {
    return [];
  }

  // Call RPC function to find co-located persons
  const { data: potentialPersons, error } = await supabase.rpc(
    'find_colocated_persons',
    {
      p_org_id: photo.org_id,
      p_photo_date: photo.exif_date,
      p_latitude: photo.exif_latitude,
      p_longitude: photo.exif_longitude
    }
  );

  if (error) {
    console.error('Error in find_colocated_persons RPC:', error);
    throw error;
  }

  if (!potentialPersons || potentialPersons.length === 0) {
    return [];
  }

  // Transform results and compute confidence scores
  return potentialPersons
    .map((p: any) => ({
      person_id: p.person_id,
      person_name: p.canonical_name,
      confidence: computeConfidence(
        new Date(photo.exif_date).getFullYear(),
        p.year_from,
        p.year_to,
        photo.exif_confidence
      ),
      reasoning: `Located in ${p.location_name} during ${p.year_from}–${p.year_to}`,
      identified_by: 'contextual_inference' as const
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
}

function computeConfidence(
  photoYear: number,
  journeyStart: number,
  journeyEnd: number,
  exifConfidence: string
): number {
  // Base confidence depends on temporal overlap
  const base = journeyStart <= photoYear && photoYear <= journeyEnd ? 0.8 : 0.5;

  // Add boost based on EXIF confidence
  const exifBoost =
    exifConfidence === 'high' ? 0.15 :
    exifConfidence === 'medium' ? 0.05 : 0;

  return Math.min(1.0, base + exifBoost);
}
