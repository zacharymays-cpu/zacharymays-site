import ChildrenOfGodWrapper from './ChildrenOfGodWrapper';

import { SUPABASE_URL, ANON_KEY } from '../../../lib/supabase/config';

// Revalidate hourly so newly-added compounds / score updates appear without a
// manual redeploy. Supabase (cog_compounds + organizations) is the single
// source of truth; there is no static GeoJSON for this page anymore.
export const revalidate = 3600;

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const opts = { headers, next: { revalidate: 3600 } };

export default async function ChildrenOfGodPage() {
  const [orgRes, compoundsRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/organizations` +
        `?select=id,name,slug,category,composite_score,composite_tier,youngs_score,founding_year,defunct_year,trajectory,summary_text,active,membership_count,membership_count_year,revenue_usd,revenue_year,size_tier,size_notes,political_scores(economic_axis,authority_axis,political_quadrant,scoring_notes),criterion_scores(criterion,score,confidence,body_text),organization_research_narratives(id,narrative_type,title,content,summary,confidence_level,sources)` +
        `&slug=eq.children-of-god-the-family`,
      opts
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/cog_compounds` +
        `?select=id,compound_name,city,country,facility_type,opened_year,closed_year,status,confidence,latitude,longitude,sources,notes` +
        `&order=opened_year.asc`,
      opts
    ),
  ]);

  const orgRows = await orgRes.json().catch(() => []);
  const compounds = await compoundsRes.json().catch(() => []);

  let cogData = null;
  if (Array.isArray(orgRows) && orgRows[0]) {
    const org = orgRows[0];
    cogData = {
      ...org,
      political_scores: Array.isArray(org.political_scores) ? org.political_scores[0] : org.political_scores,
      criterion_scores: org.criterion_scores || [],
      research_narratives: Array.isArray(org.organization_research_narratives)
        ? org.organization_research_narratives
        : [],
    };
  }

  return (
    <ChildrenOfGodWrapper
      cogData={cogData}
      compounds={Array.isArray(compounds) ? compounds : []}
    />
  );
}
