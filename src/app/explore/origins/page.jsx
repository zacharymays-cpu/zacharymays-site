import OriginsClient from './OriginsClient';
import ExploreNav from '../../../components/ExploreNav';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const metadata = {
  title: 'Origins — The Cultiness Spectrum',
  description: 'Every organization descended from a single origin — the Nazi Party or the Ku Klux Klan — traced through documented formation and ideological inheritance, with each branch identified.',
};
export const revalidate = 3600;

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const opts = { headers, next: { revalidate: 3600 } };

export default async function OriginsPage() {
  const [edgesRes, orgsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/org_lineage?select=*&order=chain_name,chain_order`, opts),
    // Lineage spans historical/defunct and not-yet-scored orgs, so no status filter;
    // the client keeps only orgs reachable from the selected origin.
    fetch(`${SUPABASE_URL}/rest/v1/organizations?select=slug,name,composite_tier,composite_score,category&limit=2000`, opts),
  ]);

  const edges = await edgesRes.json().catch(() => []);
  const orgs = await orgsRes.json().catch(() => []);

  const slugs = new Set([...edges.map(e => e.source_slug), ...edges.map(e => e.target_slug)]);
  const lineageOrgs = orgs.filter(o => slugs.has(o.slug));

  return (
    <>
      <ExploreNav title="Origins" />
      <OriginsClient nodes={lineageOrgs} edges={edges} />
    </>
  );
}
