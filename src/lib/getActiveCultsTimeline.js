// Live-computed timeline of "active culty organizations" per year, derived from
// current Supabase data. For each year Y an organization counts if it was
// founded on or before Y and has no recorded dissolution at or before Y
// (founding_year <= Y AND (defunct_year IS NULL OR defunct_year >= Y)).
// Scope: accepted, non-calibration orgs tiered Super Culty or Kinda Culty.
// Server-side, cached for an hour. The chart starts at START_YEAR for
// readability; orgs founded earlier are folded into the START_YEAR baseline.
const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const START_YEAR = 1900;
export const CULTY_TIERS = ['Super Culty', 'Kinda Culty'];

export async function getActiveCultsTimeline() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?select=founding_year,defunct_year,composite_tier` +
        `&scoring_status=eq.ACCEPTED&is_calibration=eq.false` +
        `&composite_tier=in.(%22Super%20Culty%22,%22Kinda%20Culty%22)` +
        `&founding_year=not.is.null`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const endYear = new Date().getFullYear();
    let oldestFounding = endYear;
    for (const r of rows) {
      if (r.founding_year != null && r.founding_year < oldestFounding) oldestFounding = r.founding_year;
    }

    const series = [];
    for (let y = START_YEAR; y <= endYear; y++) {
      let sup = 0, kin = 0;
      for (const r of rows) {
        const f = r.founding_year;
        const d = r.defunct_year;
        if (f == null || f > y) continue;
        if (d != null && d < y) continue;
        if (r.composite_tier === 'Super Culty') sup++;
        else if (r.composite_tier === 'Kinda Culty') kin++;
      }
      series.push({ year: y, super: sup, kinda: kin, total: sup + kin });
    }

    const last = series[series.length - 1];
    const first = series[0];
    return {
      series,
      startYear: START_YEAR,
      endYear,
      oldestFounding,
      total: rows.length,
      currentTotal: last.total,
      currentSuper: last.super,
      currentKinda: last.kinda,
      growthSinceStart: last.total - first.total,
    };
  } catch {
    return null;
  }
}
