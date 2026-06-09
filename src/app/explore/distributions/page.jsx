import DistributionsClient from './DistributionsClient';
import ExploreNav from '../../../components/ExploreNav';

import { SUPABASE_URL, ANON_KEY } from '../../../lib/supabase/config';
export const metadata = { title: 'Category Distributions — The Cultiness Spectrum' };
export const revalidate = 3600;

export default async function DistributionsPage() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations?select=name,category,composite_tier,composite_score,trajectory&active=eq.true&scoring_status=eq.ACCEPTED&order=composite_score.desc`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
  );
  const orgs = await res.json();
  return (<><ExploreNav title="Category Distributions" /><DistributionsClient orgs={orgs} /></>);
}
