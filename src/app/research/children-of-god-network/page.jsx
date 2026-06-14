import ChildrenOfGodWrapper from './ChildrenOfGodWrapper';

import { SUPABASE_URL, ANON_KEY } from '../../../lib/supabase/config';

// Revalidate hourly so newly-added compounds / score updates appear without a
// manual redeploy. Supabase (cog_compounds + organizations) is the single
// source of truth; there is no static GeoJSON for this page anymore.
export const revalidate = 3600;

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const opts = { headers, next: { revalidate: 3600 } };

// Distinct colors for per-person path lines (cycled).
const PATH_COLORS = [
  '#dc322f', '#268bd2', '#859900', '#b58900', '#6c71c4',
  '#cb4b16', '#2aa198', '#d33682', '#657b83', '#93a1a1',
];

// Reconstruct each person's chronological location chain from their journey
// records. Many journeys have no origin (just "arrived at X") or are self-loops;
// chaining the time-ordered from/to locations and de-duplicating consecutive
// repeats turns that fragmented data into a coherent per-person path. This is
// what surfaces intra-country movement (e.g. Daniella: Belo Horizonte -> Rio ->
// Ajijic -> Dallas) that the old aggregated-route view discarded.
function buildPersonPaths(journeyRows, personMap, locMap) {
  const byPerson = {};
  for (const j of (Array.isArray(journeyRows) ? journeyRows : [])) {
    (byPerson[j.person_id] ||= []).push(j);
  }

  const paths = [];
  for (const [pid, js] of Object.entries(byPerson)) {
    js.sort((a, b) =>
      ((a.journey_sequence ?? 0) - (b.journey_sequence ?? 0)) ||
      ((a.year_from ?? 0) - (b.year_from ?? 0))
    );

    const waypoints = [];
    const push = (locId, year) => {
      const loc = locId ? locMap[locId] : null;
      if (!loc || loc.lat == null || loc.lng == null) return;
      const last = waypoints[waypoints.length - 1];
      if (last && last.location_id === locId) {
        if (year != null) last.year_to = year; // extend stay
        return;
      }
      waypoints.push({
        location_id: locId, name: loc.name, city: loc.city, country: loc.country,
        lat: loc.lat, lng: loc.lng, year_from: year ?? null, year_to: year ?? null,
      });
    };

    for (const j of js) {
      push(j.from_location_id, j.year_from);
      push(j.to_location_id, j.year_to ?? j.year_from);
    }

    if (waypoints.length >= 2) {
      paths.push({ person_id: pid, person_name: personMap[pid] || 'Unknown', waypoints });
    }
  }

  // Most-traveled first; assign a stable color by that order.
  paths.sort((a, b) => b.waypoints.length - a.waypoints.length);
  paths.forEach((p, i) => { p.color = PATH_COLORS[i % PATH_COLORS.length]; });
  return paths;
}

export default async function ChildrenOfGodPage() {
  const [orgRes, compoundsRes, journeysRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/organizations` +
        `?select=id,name,slug,category,composite_score,composite_tier,youngs_score,founding_year,defunct_year,trajectory,summary_text,active,membership_count,membership_count_year,revenue_usd,revenue_year,size_tier,size_notes,political_scores(economic_axis,authority_axis,political_quadrant,scoring_notes),criterion_scores(criterion,score,confidence,body_text),organization_research_narratives(id,narrative_type,title,content,summary,confidence_level,sources)` +
        `&slug=eq.children-of-god-the-family`,
      opts
    ),
    // Children of God locations now live in the unified organization_locations
    // table, scoped by org_id (this is what makes cross-org contamination
    // structurally impossible). Columns are aliased back to the compound_* names
    // the client map already expects.
    fetch(
      `${SUPABASE_URL}/rest/v1/organization_locations` +
        `?select=id,compound_name:location_name,city,country,facility_type:location_type,opened_year,closed_year,status:operational_status,confidence,latitude,longitude,sources,notes:location_notes` +
        `&org_id=eq.471e1fab-c57c-6a63-e539-dd4a93b7e47d` +
        `&visible=eq.true` +
        `&order=opened_year.asc`,
      opts
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/survivor_journeys` +
        `?select=person_id,journey_sequence,from_location_id,to_location_id,year_from,year_to,confidence`,
      opts
    ),
  ]);

  const orgRows = await orgRes.json().catch(() => []);
  const compounds = await compoundsRes.json().catch(() => []);
  const journeyRows = await journeysRes.json().catch(() => []);

  // The persons table (10k+ rows) is RLS-locked from anon, so survivor names
  // come from a security-definer RPC that exposes ONLY journey-referenced
  // people. Location coords come from a bounded id lookup. Run in parallel.
  const refIds = Array.from(new Set(
    (Array.isArray(journeyRows) ? journeyRows : [])
      .flatMap((j) => [j.from_location_id, j.to_location_id])
      .filter(Boolean)
  ));

  const [personRows, locRows] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/rpc/get_survivor_journey_persons`, opts)
      .then((r) => r.json()).catch(() => []),
    refIds.length
      ? fetch(`${SUPABASE_URL}/rest/v1/organization_locations?select=id,location_name,city,country,latitude,longitude&id=in.(${refIds.join(',')})`, opts)
          .then((r) => r.json()).catch(() => [])
      : Promise.resolve([]),
  ]);

  const personMap = Object.fromEntries(
    (Array.isArray(personRows) ? personRows : []).map((p) => [p.id, p.canonical_name])
  );

  const locMap = Object.fromEntries(
    (Array.isArray(locRows) ? locRows : []).map((l) => [l.id, {
      name: l.location_name, city: l.city, country: l.country,
      lat: l.latitude != null ? Number(l.latitude) : null,
      lng: l.longitude != null ? Number(l.longitude) : null,
    }])
  );

  const personPaths = buildPersonPaths(journeyRows, personMap, locMap);

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
      personPaths={personPaths}
    />
  );
}
