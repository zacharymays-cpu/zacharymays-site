import LineageClient from './LineageClient';
import ExploreNav from '../../../components/ExploreNav';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const metadata = {
  title: 'Formation Lineage — The Cultiness Spectrum',
  description: 'Force-directed graph of documented formation lineage and ideological inheritance between high-control organizations.',
};
export const revalidate = 3600;

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const opts = { headers, next: { revalidate: 3600 } };

export default async function LineagePage() {
  const [edgesRes, orgsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/org_lineage?select=*&order=chain_name,chain_order`, opts),
    fetch(`${SUPABASE_URL}/rest/v1/organizations?select=slug,name,composite_tier,composite_score,category&active=eq.true&scoring_status=eq.ACCEPTED`, opts),
  ]);

  const edges = await edgesRes.json().catch(() => []);
  const orgs  = await orgsRes.json().catch(() => []);

  // Only pass orgs that appear in lineage edges
  const activeSlugs = new Set([
    ...edges.map(e => e.source_slug),
    ...edges.map(e => e.target_slug),
  ]);
  const lineageOrgs = orgs.filter(o => activeSlugs.has(o.slug));

  return (<><ExploreNav title="Formation Lineage" /><LineageClient nodes={lineageOrgs} edges={edges} /></>);
}
