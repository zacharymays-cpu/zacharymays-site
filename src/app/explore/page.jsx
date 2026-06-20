import ExploreClient from './ExploreClient';
import ExploreNav from '../../components/ExploreNav';

import { SUPABASE_URL, ANON_KEY } from '../../lib/supabase/config';

export const metadata = {
  title: 'Dataset Explorer — The Cultiness Spectrum',
  description: 'Browse and filter the Cultiness Spectrum dataset. Search by organization, filter by tier, trajectory, and composite score.',
};

export const revalidate = 3600;

async function getOrgs() {
  const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
  try {
    // Two parallel fetches: the org rows, and the Lifton (C11) scores which live
    // in criterion_scores (one row per org). Merged by org_id below.
    const [orgRes, liftonRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/organizations?select=id,name,slug,category,composite_score,youngs_score,youngs_band,composite_tier,trajectory,summary_text&order=composite_score.desc`,
        { headers, next: { revalidate: 3600 } }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/criterion_scores?select=org_id,score&criterion=eq.C11`,
        { headers, next: { revalidate: 3600 } }
      ),
    ]);
    if (!orgRes.ok) return [];
    const orgs = await orgRes.json();
    // Lifton merge is best-effort: if the C11 fetch fails, orgs still render
    // (every lifton_score stays null → "—" in the UI).
    let liftonMap = {};
    if (liftonRes.ok) {
      const rows = await liftonRes.json();
      liftonMap = Object.fromEntries(rows.map(r => [r.org_id, r.score]));
    }
    return orgs.map(o => ({ ...o, lifton_score: liftonMap[o.id] ?? null }));
  } catch { return []; }
}

export default async function ExplorePage() {
  const orgs = await getOrgs();
  return (<><ExploreNav title="Dataset Explorer" /><ExploreClient initialOrgs={orgs} /></>);
}
