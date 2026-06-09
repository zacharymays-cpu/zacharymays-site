// Single source of truth for live dataset counts, read from the Supabase
// `dataset_stats` view. Server-side, cached for an hour. Falls back to a
// conservative rounded number if the fetch fails so prose never breaks.
import { SUPABASE_URL, ANON_KEY } from './supabase/config';

export const FALLBACK_ORG_COUNT = 500;

export async function getDatasetStats() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/dataset_stats?select=*`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}
