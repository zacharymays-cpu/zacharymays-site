import LineageClient from './LineageClient';
import ExploreNav from '../../../components/ExploreNav';

import { SUPABASE_URL, ANON_KEY } from '../../../lib/supabase/config';

export const metadata = {
  title: 'Formation Lineage — The Cultiness Spectrum',
  description: 'Documented formation lineage traced from a single origin — the Nazi Party, the Ku Klux Klan, or other roots — with each descendant branch identified.',
};
export const revalidate = 3600;

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const opts = { headers, next: { revalidate: 3600 } };

// Lineage chains include PENDING / inactive historical orgs (e.g. the Nazi Party,
// NSWPP), which the anon RLS policy hides — making them render as raw slugs. Read
// orgs server-side with the service-role key so their real names/tiers show. Falls
// back to the anon key if the service key isn't configured.
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ANON_KEY;
const svcHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

export default async function LineagePage() {
  const [edgesRes, orgsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/org_lineage?select=*&order=chain_name,chain_order`, opts),
    // The activeSlugs filter below keeps only orgs that appear in a lineage edge,
    // so unrelated orgs are never pulled onto the page.
    fetch(`${SUPABASE_URL}/rest/v1/organizations?select=slug,name,composite_tier,composite_score,category&limit=2000`,
      { headers: svcHeaders, next: { revalidate: 3600 } }),
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
