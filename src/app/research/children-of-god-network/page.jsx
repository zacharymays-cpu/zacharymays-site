import ChildrenOfGodWrapper from './ChildrenOfGodWrapper';

import { SUPABASE_URL, ANON_KEY } from '../../../lib/supabase/config';

// Revalidate hourly so newly-added compounds / score updates appear without a
// manual redeploy. Supabase (cog_compounds + organizations) is the single
// source of truth; there is no static GeoJSON for this page anymore.
export const revalidate = 3600;

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const opts = { headers, next: { revalidate: 3600 } };

export default async function ChildrenOfGodPage() {
  const [orgRes, compoundsRes, journeysRes, personsRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/organizations` +
        `?select=id,name,slug,category,composite_score,composite_tier,youngs_score,founding_year,defunct_year,trajectory,summary_text,active,membership_count,membership_count_year,revenue_usd,revenue_year,size_tier,size_notes,political_scores(economic_axis,authority_axis,political_quadrant,scoring_notes),criterion_scores(criterion,score,confidence,body_text),organization_research_narratives(id,narrative_type,title,content,summary,confidence_level,sources)` +
        `&slug=eq.children-of-god-the-family`,
      opts
    ),
    // NOTE: cog_compounds also contains 15 Twelve Tribes communes (loaded by a
    // mistaken Phase-4 integration) identifiable by their snake_case
    // facility_type vocab. Exclude them so only genuine Children of God
    // locations appear here. Until the data is properly partitioned by org,
    // this filter is the guard.
    fetch(
      `${SUPABASE_URL}/rest/v1/cog_compounds` +
        `?select=id,compound_name,city,country,facility_type,opened_year,closed_year,status,confidence,latitude,longitude,sources,notes` +
        `&facility_type=not.in.(communal_residence,communal_residence_business,communal_farm)` +
        `&compound_name=not.ilike.Test*` +
        `&order=opened_year.asc`,
      opts
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/survivor_journeys` +
        `?select=person_id,compound_from_id,compound_to_id,year_from,year_to,confidence`,
      opts
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/persons?select=id,canonical_name`,
      opts
    ),
  ]);

  const orgRows = await orgRes.json().catch(() => []);
  const compounds = await compoundsRes.json().catch(() => []);
  const journeyRows = await journeysRes.json().catch(() => []);
  const personRows = await personsRes.json().catch(() => []);

  // Join person names onto journeys, keep only fully-routed ones (both ends).
  const personMap = Object.fromEntries(
    (Array.isArray(personRows) ? personRows : []).map((p) => [p.id, p.canonical_name])
  );
  const journeys = (Array.isArray(journeyRows) ? journeyRows : [])
    .filter((j) => j.compound_from_id && j.compound_to_id)
    .map((j) => ({
      person_id: j.person_id,
      person_name: personMap[j.person_id] || 'Unknown',
      from_compound_id: j.compound_from_id,
      to_compound_id: j.compound_to_id,
      year_from: j.year_from,
      year_to: j.year_to,
      confidence: j.confidence,
    }));

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
      journeys={journeys}
    />
  );
}
