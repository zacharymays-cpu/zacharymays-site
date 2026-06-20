import { getDatasetStats, FALLBACK_ORG_COUNT } from '../lib/getDatasetStats';

// Inline async Server Component that renders the live count of all assessed
// organizations (analytics dataset + calibration anchors). Drop it anywhere
// a hardcoded dataset-size number used to live.
export default async function OrgCount({ fallback = FALLBACK_ORG_COUNT }) {
  const stats = await getDatasetStats();
  return <>{stats?.total_assessed ?? fallback}</>;
}
