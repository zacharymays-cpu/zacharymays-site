import CompareClient from './CompareClient';
import ExploreNav from '../../../components/ExploreNav';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';
export const metadata = { title: 'Compare — The Cultiness Spectrum' };
export const revalidate = 3600;

export default async function ComparePage() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations?select=id,name,category,composite_tier,composite_score,youngs_score,trajectory&active=eq.true&scoring_status=eq.ACCEPTED&order=name`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
  );
  const orgs = await res.json();

  // criterion_scores exceeds Supabase's 1000-row REST cap — page through all
  // rows so every org's criteria are available for comparison.
  const rawScores = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const csRes = await fetch(
      `${SUPABASE_URL}/rest/v1/criterion_scores?select=org_id,criterion,score&order=org_id`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, Range: `${from}-${from + PAGE - 1}` },
        next: { revalidate: 3600 } }
    );
    const batch = await csRes.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    rawScores.push(...batch);
    if (batch.length < PAGE) break;
  }

  const scoreMap = {};
  for (const s of rawScores) {
    if (!scoreMap[s.org_id]) scoreMap[s.org_id] = {};
    scoreMap[s.org_id][s.criterion] = s.score !== null ? parseFloat(s.score) : null;
  }

  return (<><ExploreNav title="Head-to-Head Comparison" /><CompareClient orgs={orgs} scoreMap={scoreMap} /></>);
}
