import MapClient from './MapClient';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const metadata = {
  title: 'Geographic Map — The Cultiness Spectrum',
  description: 'US map showing organizational headquarters plotted by location, colored by cultiness tier, sized by membership. Zoom, filter, and click to explore.',
};
export const revalidate = 3600;

export default async function MapPage() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations` +
    `?select=id,name,slug,category,composite_tier,composite_score,trajectory,` +
    `hq_city,hq_state,hq_lat,hq_lng,geo_scope,membership_count,size_tier` +
    `&active=eq.true&order=composite_score.desc`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
  );
  const orgs = await res.json();

  const withGeo  = orgs.filter(o => o.hq_lat && o.hq_lng).length;
  const withSize = orgs.filter(o => o.membership_count || o.size_tier).length;

  return (
    <MapClient
      orgs={orgs}
      withGeo={withGeo}
      withSize={withSize}
    />
  );
}
