import SunburstClient from './SunburstClient';
import ExploreNav from '../../../components/ExploreNav';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const metadata = {
  title: 'Tier Distribution — The Cultiness Spectrum',
  description: 'Sunburst chart showing the distribution of 401 organizations by tier and category in the Cultiness Spectrum dataset.',
};
export const revalidate = 3600;

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

export default async function SunburstPage() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/tier_category_counts`,
    { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}', next: { revalidate: 3600 } }
  );

  let data = await res.json().catch(() => null);

  // Fallback: aggregate client-side from raw orgs if RPC doesn't exist
  if (!data || !Array.isArray(data) || !data.length) {
    const orgsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?select=composite_tier,category,composite_score&active=eq.true&scoring_status=eq.ACCEPTED`,
      { headers, next: { revalidate: 3600 } }
    );
    const orgs = await orgsRes.json().catch(() => []);
    const map = {};
    orgs.forEach(o => {
      const key = `${o.composite_tier}|||${o.category}`;
      if (!map[key]) map[key] = { composite_tier: o.composite_tier, category: o.category, count: 0, scores: [] };
      map[key].count++;
      map[key].scores.push(parseFloat(o.composite_score || 0));
    });
    data = Object.values(map).map(v => ({
      composite_tier: v.composite_tier,
      category: v.category,
      count: v.count,
      avg_score: (v.scores.reduce((a,b)=>a+b,0)/v.scores.length).toFixed(1),
    }));
  }

  return (<><ExploreNav title="Tier Distribution" /><SunburstClient data={data} /></>);
}
