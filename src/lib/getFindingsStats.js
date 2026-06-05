// Live-computed findings stats: the authority-axis↔composite correlation (r)
// and the composite-tier distribution, derived from current Supabase data.
// Server-side, cached for an hour. Next dedupes the identical fetch across
// components within one request, so the query runs once per render.
const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const TIER_ORDER = ['Cult', 'Cult Dynamics', 'High Control', 'Concerning', 'Mildly Culty', 'Healthy Group'];

export async function getFindingsStats() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?select=composite_score,composite_tier,political_scores(authority_axis)&active=eq.true&scoring_status=eq.ACCEPTED`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const rows = await res.json();

    // Pearson r: authority axis vs composite score (orgs with both values)
    const xs = [], ys = [];
    for (const row of rows) {
      const cs = row.composite_score;
      const ps = Array.isArray(row.political_scores) ? row.political_scores[0] : row.political_scores;
      const auth = ps ? ps.authority_axis : null;
      if (cs == null || auth == null) continue;
      const x = parseFloat(auth), y = parseFloat(cs);
      if (Number.isNaN(x) || Number.isNaN(y)) continue;
      xs.push(x); ys.push(y);
    }
    const n = xs.length;
    let r = null;
    if (n > 1) {
      const mx = xs.reduce((a, b) => a + b, 0) / n;
      const my = ys.reduce((a, b) => a + b, 0) / n;
      let sxy = 0, sxx = 0, syy = 0;
      for (let i = 0; i < n; i++) {
        const dx = xs[i] - mx, dy = ys[i] - my;
        sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
      }
      r = (sxx > 0 && syy > 0) ? sxy / Math.sqrt(sxx * syy) : null;
    }

    // Composite-tier distribution
    const counts = {};
    let scored = 0;
    for (const row of rows) {
      const t = row.composite_tier;
      if (!t) continue;
      counts[t] = (counts[t] || 0) + 1;
      scored++;
    }
    const tiers = TIER_ORDER.map((t) => ({
      tier: t,
      count: counts[t] || 0,
      pct: scored ? (100 * (counts[t] || 0)) / scored : 0,
    }));
    const largest = tiers.reduce((a, b) => (b.count > a.count ? b : a), tiers[0]);

    return { r, n, scored, tiers, largest };
  } catch {
    return null;
  }
}
