import CompassClient from './CompassClient';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const metadata = {
  title: 'Political Compass — The Cultiness Spectrum',
  description: 'Organizations plotted by economic and authority axes, colored by composite cultiness tier.',
};

export const revalidate = 3600;

async function getCompassData() {
  try {
    // Join political_scores with organizations
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/political_scores?select=economic_axis,authority_axis,political_quadrant,organizations(id,name,category,composite_tier,composite_score,youngs_score,trajectory)&order=economic_axis`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    // Flatten the join
    return data
      .filter(d => d.organizations)
      .map(d => ({
        ...d.organizations,
        econ: parseFloat(d.economic_axis),
        auth: parseFloat(d.authority_axis),
        quadrant: d.political_quadrant,
      }));
  } catch (e) {
    console.error('Compass fetch error:', e);
    return [];
  }
}

export default async function CompassPage() {
  const orgs = await getCompassData();
  return <CompassClient orgs={orgs} />;
}
