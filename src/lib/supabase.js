const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

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
  'Cult':          '#6b1010',
  'Cult Dynamics': '#8b2020',
  'High Control':  '#7a4a1a',
  'Concerning':    '#7a6a2a',
  'Mildly Culty':  '#5a7a3a',
  'Healthy Group': '#2a6b4a',
};

export const TIER_ORDER = [
  'Cult', 'Cult Dynamics', 'High Control', 'Concerning', 'Mildly Culty', 'Healthy Group'
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
