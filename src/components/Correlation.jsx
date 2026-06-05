import { getFindingsStats } from '../lib/getFindingsStats';

// Inline async Server Component that renders the live authority-axis↔composite
// correlation r, computed from current data. `prefix` lets callers render
// "r = 0.670" vs just "0.670". Falls back to the last known value on failure.
export default async function Correlation({ digits = 3, prefix = '', fallback = 0.67 }) {
  const stats = await getFindingsStats();
  const r = stats?.r != null ? stats.r : fallback;
  return <>{prefix}{r.toFixed(digits)}</>;
}
