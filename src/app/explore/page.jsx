import ExploreClient from './ExploreClient';
import ExploreNav from '../../components/ExploreNav';

import { SUPABASE_URL, ANON_KEY } from '../../lib/supabase/config';

export const metadata = {
  title: 'Dataset Explorer — The Cultiness Spectrum',
  description: 'Browse and filter the Cultiness Spectrum dataset. Search by organization, filter by tier, trajectory, and composite score.',
};

export const revalidate = 3600;

async function getOrgs() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?select=id,name,slug,category,composite_score,youngs_score,youngs_band,composite_tier,trajectory,summary_text&active=eq.true&order=composite_score.desc`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function ExplorePage() {
  const orgs = await getOrgs();
  return (<><ExploreNav title="Dataset Explorer" /><ExploreClient initialOrgs={orgs} /></>);
}
