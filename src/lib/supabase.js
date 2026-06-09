import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase/config';

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export async function fetchAllOrgs() {
  // Fetch calibration anchors with their criterion scores
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/calibration_anchors?select=id,name,category,composite_score,youngs_score,composite_tier,trajectory,anchor_type&order=composite_score.desc`,
    { headers, next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error('Failed to fetch organizations');
  return res.json();
}

export async function fetchOrgWithScores(id) {
  const [orgRes, scoresRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/calibration_anchors?id=eq.${id}&select=*`,
      { headers, next: { revalidate: 3600 } }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/calibration_criterion_scores?anchor_id=eq.${id}&select=criterion,score,body_text&order=criterion`,
      { headers, next: { revalidate: 3600 } }
    ),
  ]);
  const [orgs, scores] = await Promise.all([orgRes.json(), scoresRes.json()]);
  return { org: orgs[0], scores };
}

export async function fetchCategories() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/calibration_anchors?select=category`,
    { headers, next: { revalidate: 86400 } }
  );
  const data = await res.json();
  return [...new Set(data.map(d => d.category))].sort();
}

export const TIER_COLORS = {
  'Super Culty':  '#6b1010',
  'Kinda Culty':  '#7a4a1a',
  'Not Culty':    '#2a6b4a',
};

export const TIER_ORDER = [
  'Super Culty', 'Kinda Culty', 'Not Culty'
];

export const CRITERIA_NAMES = {
  C1:  'Charismatic Leadership',
  C2:  'Sacred Assumptions',
  C3:  'Transcendent Mission',
  C4:  'Sublimation of Individuality',
  C5:  'Isolation',
  C6:  'Private Vernacular',
  C7:  'Us-Versus-Them',
  C8:  'Exploitation of Labor',
  C9:  'High Exit Costs',
  C10: 'Ends Justify the Means',
};
