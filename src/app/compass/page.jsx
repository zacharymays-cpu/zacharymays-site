import CompassClient from './CompassClient';
import { getFindingsStats } from '../../lib/getFindingsStats';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const metadata = {
  title: 'Political Compass — The Cultiness Spectrum',
  description: 'Organizations plotted by economic and authority axes, colored by composite cultiness tier.',
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
  return <CompassClient orgs={orgs} regimes={regimes} presidentialEras={presidentialEras} r={stats?.r ?? 0.67} />;
}
