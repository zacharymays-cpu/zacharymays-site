import ChildrenOfGodWrapper from '../children-of-god-network/ChildrenOfGodWrapper';
import { SUPABASE_URL, ANON_KEY } from '../../../lib/supabase/config';

export const revalidate = 3600;

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const opts = { headers, next: { revalidate: 3600 } };

const TT_ABOUT =
  "This dataset documents the Twelve Tribes (also called the Commonwealth of Israel / Yashar'el), a high-control communal religious movement founded by Elbert Eugene Spriggs (\"Yoneq\") in 1972 in Chattanooga, Tennessee. Members live in shared compounds and businesses under elder authority. The cultiness scores reflect extensive survivor testimony, documented child-labor and child-abuse prosecutions, corporal-punishment practices, communal isolation, and legal records across multiple countries — including the 2018 European Court of Human Rights ruling (Wetjen and Tlapak v. Germany) and the 1984 Island Pond raid in Vermont.";

const TT_SOURCES = [
  "European Court of Human Rights — Wetjen and Tlapak v. Germany (2018): removal of children upheld over corporal punishment",
  "In Re: Certain Children (Island Pond Raid), Vermont (1984): 112 children seized; warrants ruled unconstitutional",
  "New York State Department of Labor v. Twelve Tribes — child-labor findings",
  "Susan J. Palmer — academic studies of the Twelve Tribes",
  "Survivor testimony and the Twelve Tribes / xFamily documentation archives",
];

// Distinct colors for per-person path lines (cycled).
const PATH_COLORS = [
  '#dc322f', '#268bd2', '#859900', '#b58900', '#6c71c4',
  '#cb4b16', '#2aa198', '#d33682', '#657b83', '#93a1a1',
];

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
        if (year != null) last.year_to = year;
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

  paths.sort((a, b) => b.waypoints.length - a.waypoints.length);
  paths.forEach((p, i) => { p.color = PATH_COLORS[i % PATH_COLORS.length]; });
  return paths;
}

export default async function TwelveTribesPage() {
  // Fetch org and TT locations first (journeys depend on location IDs).
  const [orgRes, locationsRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/organizations` +
        `?select=id,name,slug,category,composite_score,composite_tier,youngs_score,founding_year,defunct_year,trajectory,summary_text,active,membership_count,membership_count_year,revenue_usd,revenue_year,size_tier,size_notes,political_scores(economic_axis,authority_axis,political_quadrant,scoring_notes),criterion_scores(criterion,score,confidence,body_text),organization_research_narratives(id,narrative_type,title,content,summary,confidence_level,sources)` +
        `&slug=eq.twelve-tribes`,
      opts
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/organization_locations` +
        `?select=id,compound_name:location_name,city,country,facility_type:location_type,opened_year,closed_year,status:operational_status,confidence,latitude,longitude,sources,notes:location_notes` +
        `&org_id=eq.800c6cb4-db92-b692-edee-1234c9b9da23` +
        `&visible=eq.true` +
        `&order=opened_year.asc`,
      opts
    ),
  ]);

  const orgRows = await orgRes.json().catch(() => []);
  const compounds = await locationsRes.json().catch(() => []);

  // Scope survivor journeys to TT locations only (prevents cross-org leakage).
  const ttLocIds = (Array.isArray(compounds) ? compounds : [])
    .map((c) => c.id)
    .filter(Boolean);

  let journeyRows = [];
  if (ttLocIds.length > 0) {
    const journeysRes = await fetch(
      `${SUPABASE_URL}/rest/v1/survivor_journeys` +
        `?select=person_id,journey_sequence,from_location_id,to_location_id,year_from,year_to,confidence` +
        `&or=(from_location_id.in.(${ttLocIds.join(',')}),to_location_id.in.(${ttLocIds.join(',')}))`,
      opts
    );
    journeyRows = await journeysRes.json().catch(() => []);
  }

  // Build person and location lookup maps for path reconstruction.
  const refIds = Array.from(new Set(
    (Array.isArray(journeyRows) ? journeyRows : [])
      .flatMap((j) => [j.from_location_id, j.to_location_id])
      .filter(Boolean)
  ));

  const [personRows, locRows] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/rpc/get_survivor_journey_persons`, opts)
      .then((r) => r.json()).catch(() => []),
    refIds.length
      ? fetch(
          `${SUPABASE_URL}/rest/v1/organization_locations?select=id,location_name,city,country,latitude,longitude&id=in.(${refIds.join(',')})`,
          opts
        ).then((r) => r.json()).catch(() => [])
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
      aboutText={TT_ABOUT}
      sources={TT_SOURCES}
    />
  );
}
