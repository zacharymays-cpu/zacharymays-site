const BASE = 'https://www.zacharymays.com';

const STATIC_PATHS = [
  '', '/about', '/terms',
  '/how-we-got-here', '/assholes-in-history',
  '/research-system', '/research-system/overview', '/research-system/evolution-timeline',
  '/research-system/v4-anchor-heuristic', '/research-system/v5-0-evidence-jury',
  '/research-system/v5-1-formal-validation', '/research-system/v5-2-deepseek-case-study',
  '/research-system/v6-0-lifton-framework', '/research-system/v6-1-permanence-aware',
];

export default function sitemap() {
  const now = new Date();
  return STATIC_PATHS.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'weekly' : 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));
}
