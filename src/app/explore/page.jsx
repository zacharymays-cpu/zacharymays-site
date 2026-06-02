import ExploreClient from './ExploreClient';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const metadata = {
  title: 'Dataset Explorer — The Cultiness Spectrum',
  description: 'Browse and filter the Cultiness Spectrum dataset. Search by organization, filter by tier, trajectory, and composite score.',
};

export const revalidate = 3600;

async function getOrgs() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?select=id,name,category,composite_score,youngs_score,composite_tier,trajectory,membership_scope,summary_text&active=eq.true&order=composite_score.desc`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function ExplorePage() {
  const orgs = await getOrgs();
  return <ExploreClient initialOrgs={orgs} />;
}
