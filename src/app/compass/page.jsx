import CompassClient from './CompassClient';
import { getFindingsStats } from '../../lib/getFindingsStats';
import ExploreNav from '../../components/ExploreNav';

import { SUPABASE_URL, ANON_KEY } from '../../lib/supabase/config';

export const metadata = {
  title: 'Political Compass — The Cultiness Spectrum',
  description: 'Organizations plotted by economic and authority axes, colored by control tier.',
};

export const revalidate = 3600;

async function getOrgs() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/political_scores?select=economic_axis,authority_axis,political_quadrant,organizations(id,name,category,composite_tier,composite_score,youngs_score,trajectory)&order=economic_axis`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data
    .filter(d => d.organizations)
    .map(d => ({
      ...d.organizations,
      econ: parseFloat(d.economic_axis),
      auth: parseFloat(d.authority_axis),
      quadrant: d.political_quadrant,
    }));
}

async function getReferencePoints() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/compass_reference_points?select=*&order=marker_type,era_start`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export default async function CompassPage() {
  const [orgs, referencePoints, stats] = await Promise.all([getOrgs(), getReferencePoints(), getFindingsStats()]);
  const regimes = referencePoints.filter(r => r.marker_type === 'regime');
  const presidentialEras = referencePoints.filter(r => r.marker_type === 'presidential_era');
  return (<><ExploreNav title="Political Compass" /><CompassClient orgs={orgs} regimes={regimes} presidentialEras={presidentialEras} r={stats?.r ?? 0.67} /></>);
}
