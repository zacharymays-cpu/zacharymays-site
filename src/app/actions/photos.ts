'use server';

import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';
import * as exifParser from 'exif-parser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
