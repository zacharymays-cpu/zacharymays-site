const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';
const BASE = 'https://www.zacharymays.com';

export const revalidate = 3600;

const STATIC_PATHS = [
  '', '/about', '/donate', '/terms',
  '/how-we-got-here', '/assholes-in-history',
  '/cultiness', '/cultiness/methodology', '/cultiness/ai-methodology',
  '/cultiness/findings', '/cultiness/dataset', '/findings',
  '/explore', '/explore/heatmap', '/explore/distributions', '/explore/timeline',
  '/explore/correlations', '/explore/lineage', '/explore/sankey', '/explore/sunburst',
  '/explore/compare', '/explore/map', '/compass',
];

export default async function sitemap() {
  const now = new Date();
  const staticEntries = STATIC_PATHS.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'weekly' : 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));

  let orgEntries = [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?select=slug,updated_at&active=eq.true&scoring_status=eq.ACCEPTED`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const orgs = await res.json();
      orgEntries = orgs
        .filter((o) => o.slug)
        .map((o) => ({
          url: `${BASE}/org/${o.slug}`,
          lastModified: o.updated_at ? new Date(o.updated_at) : now,
          changeFrequency: 'monthly',
          priority: 0.5,
        }));
    }
  } catch {
    // If the dataset fetch fails, still return the static sitemap.
  }

  return [...staticEntries, ...orgEntries];
}
