import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('./MapClient'), { ssr: false });

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const metadata = {
  title: 'Geographic Map — The Cultiness Spectrum',
  description: 'US map of organizational headquarters, state average scores, and founding city origins — colored by cultiness tier and sized by membership.',
};
export const revalidate = 3600;

// Founding city coordinates lookup
const FOUNDING_COORDS = {
  "New York|NY":         [40.71, -74.01],  "Washington|DC":       [38.90, -77.04],
  "Chicago|IL":          [41.88, -87.63],  "San Francisco|CA":    [37.77, -122.42],
  "Los Angeles|CA":      [34.05, -118.24], "Houston|TX":          [29.76, -95.37],
  "Boston|MA":           [42.36, -71.06],  "Philadelphia|PA":     [39.95, -75.17],
  "Memphis|TN":          [35.15, -90.05],  "Detroit|MI":          [42.33, -83.05],
  "St. Louis|MO":        [38.63, -90.20],  "Nashville|TN":        [36.17, -86.78],
  "Provo|UT":            [40.23, -111.66], "Atlanta|GA":          [33.75, -84.39],
  "Brooklyn|NY":         [40.68, -73.94],  "Cleveland|OH":        [41.50, -81.69],
  "College Station|TX":  [30.63, -96.34],  "Pasadena|CA":         [34.15, -118.14],
  "San Antonio|TX":      [29.42, -98.49],  "Santa Monica|CA":     [34.01, -118.49],
  "San Jose|CA":         [37.34, -121.89], "Savannah|GA":         [32.08, -81.10],
  "Dallas|TX":           [32.78, -96.80],  "Burbank|CA":          [34.18, -118.31],
  "Cincinnati|OH":       [39.10, -84.51],  "Kansas City|MO":      [39.10, -94.58],
  "New Brunswick|NJ":    [40.49, -74.45],  "Baltimore|MD":        [39.29, -76.61],
  "Oakland|CA":          [37.80, -122.27], "Seattle|WA":          [47.61, -122.33],
  "Montgomery|AL":       [32.36, -86.30],  "Bethesda|MD":         [38.98, -77.10],
  "Colorado Springs|CO": [38.83, -104.82], "Menlo Park|CA":       [37.45, -122.18],
  "Hawthorne|CA":        [33.92, -118.35], "Boulder|CO":          [40.01, -105.27],
};

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const opts    = { headers, next: { revalidate: 3600 } };

export default async function MapPage() {
  const [orgsRes, stateRes, foundingRes] = await Promise.all([
    // Org dots
    fetch(
      `${SUPABASE_URL}/rest/v1/organizations` +
      `?select=id,name,slug,category,composite_tier,composite_score,trajectory,` +
      `hq_city,hq_state,hq_lat,hq_lng,geo_scope,membership_count,size_tier` +
      `&active=eq.true&scoring_status=eq.ACCEPTED&order=composite_score.desc`,
      opts
    ),
    // State stats for choropleth
    fetch(
      `${SUPABASE_URL}/rest/v1/rpc/state_stats`,
      { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}', next: { revalidate: 3600 } }
    ),
    // Founding city aggregates
    fetch(
      `${SUPABASE_URL}/rest/v1/organizations` +
      `?select=founding_city,founding_state,composite_score,composite_tier` +
      `&active=eq.true&scoring_status=eq.ACCEPTED&founding_city=not.is.null` +
      `&founding_city=not.eq.Various&founding_city=not.eq.Unknown&founding_state=not.is.null`,
      opts
    ),
  ]);

  const orgs        = await orgsRes.json().catch(() => []);
  const stateRaw    = await stateRes.json().catch(() => []);
  const foundingRaw = await foundingRes.json().catch(() => []);

  // Aggregate founding data client-side (RPC fallback)
  const foundingMap = {};
  (Array.isArray(foundingRaw) ? foundingRaw : []).forEach(o => {
    const key = `${o.founding_city}|${o.founding_state}`;
    if (!foundingMap[key]) foundingMap[key] = { city: o.founding_city, state: o.founding_state, scores: [], high: 0 };
    foundingMap[key].scores.push(parseFloat(o.composite_score || 0));
    if (['Cult','Cult Dynamics'].includes(o.composite_tier)) foundingMap[key].high++;
  });

  const foundingData = Object.entries(foundingMap)
    .map(([key, d]) => {
      const coords = FOUNDING_COORDS[key];
      if (!coords || d.scores.length < 2) return null;
      return {
        city: d.city, state: d.state,
        count: d.scores.length,
        avg_score: Math.round(d.scores.reduce((a,b) => a+b, 0) / d.scores.length * 10) / 10,
        high_control_count: d.high,
        lat: coords[0], lng: coords[1],
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count);

  // State stats — try RPC result, fall back to client aggregation
  let stateStats = Array.isArray(stateRaw) && stateRaw.length ? stateRaw : null;
  if (!stateStats) {
    const stateMap = {};
    orgs.forEach(o => {
      if (!o.hq_state) return;
      if (!stateMap[o.hq_state]) stateMap[o.hq_state] = { hq_state: o.hq_state, scores: [], cult: 0, cult_dynamics: 0, high_control: 0, concerning: 0, mildly_culty: 0, healthy_group: 0 };
      const s = stateMap[o.hq_state];
      s.scores.push(parseFloat(o.composite_score || 0));
      const tierKey = { 'Cult':'cult','Cult Dynamics':'cult_dynamics','High Control':'high_control','Concerning':'concerning','Mildly Culty':'mildly_culty','Healthy Group':'healthy_group' }[o.composite_tier];
      if (tierKey) s[tierKey]++;
    });
    stateStats = Object.values(stateMap).map(s => ({
      ...s,
      total: s.scores.length,
      avg_score: Math.round(s.scores.reduce((a,b) => a+b,0) / s.scores.length * 10) / 10,
    }));
  }

  const withGeo = orgs.filter(o => o.hq_lat && o.hq_lng).length;

  return (
    <MapClient
      orgs={orgs}
      stateStats={stateStats}
      foundingData={foundingData}
      withGeo={withGeo}
    />
  );
}
