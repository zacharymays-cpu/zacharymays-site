import SankeyClient from './SankeyClient';
import ExploreNav from '../../../components/ExploreNav';

import { SUPABASE_URL, ANON_KEY } from '../../../lib/supabase/config';

export const metadata = {
  title: 'Category → Tier Flow — The Cultiness Spectrum',
  description: 'Sankey diagram showing how each organizational category distributes across control tiers.',
};
export const revalidate = 3600;

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

export default async function SankeyPage() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations?select=composite_tier,category,composite_score&active=eq.true&scoring_status=eq.ACCEPTED`,
    { headers, next: { revalidate: 3600 } }
  );
  const orgs = await res.json().catch(() => []);

  // Aggregate
  const map = {};
  orgs.forEach(o => {
    const key = `${o.composite_tier}|||${o.category}`;
    if (!map[key]) map[key] = { composite_tier: o.composite_tier, category: o.category, count: 0 };
    map[key].count++;
  });

  return (<><ExploreNav title="Category → Tier Flow" /><SankeyClient data={Object.values(map)} /></>);
}
