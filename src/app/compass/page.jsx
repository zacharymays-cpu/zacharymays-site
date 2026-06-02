import CompassClient from './CompassClient';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const metadata = {
  title: 'Political Compass — The Cultiness Spectrum',
  description: 'Organizations plotted by economic and authority axes, colored by composite cultiness tier.',
};

export const revalidate = 3600;

async function getOrgs() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/political_scores?select=economic_axis,authority_axis,political_quadrant,organizations(id,name,category,composite_tier,composite_score,youngs_score,trajectory)&order=economic_axis`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data
    .filter(d => d.organizations)
    .map(d => ({
      ...d.organizations,
      econ: parseFloat(d.economic_axis),
      auth: parseFloat(d.authority_axis),
      quadrant: d.political_quadrant,
      isCalibration: false,
    }));
}

async function getCalibrationAnchors() {
  // Fetch calibration anchors with their known political positions
  // These live in calibration_anchors table with hardcoded positions
  // since they don't have political_scores entries
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/calibration_anchors?select=id,name,category,composite_tier,composite_score,youngs_score,anchor_type&order=composite_score.desc`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();

  // Known political positions for calibration anchors
  const positions = {
    'Jonestown / Peoples Temple (Guyana Phase)':          { econ: -2.5, auth: 4.5, quadrant: 'Authoritarian Left' },
    'Aum Shinrikyo (Japan)':                              { econ:  0.0, auth: 5.0, quadrant: 'Authoritarian' },
    'Chinese Communist Party (Cultural Revolution)':      { econ: -5.0, auth: 5.0, quadrant: 'Authoritarian Left' },
    'Khmer Rouge (Cambodia)':                             { econ: -5.0, auth: 5.0, quadrant: 'Authoritarian Left' },
    'Soviet Communist Party (Stalin Era)':                { econ: -4.5, auth: 5.0, quadrant: 'Authoritarian Left' },
    'North Korean Juche State':                           { econ: -4.0, auth: 5.0, quadrant: 'Authoritarian Left' },
    'Hitler Youth':                                       { econ:  1.5, auth: 5.0, quadrant: 'Authoritarian Right' },
    'Nazi Party (NSDAP)':                                 { econ:  1.5, auth: 5.0, quadrant: 'Authoritarian Right' },
    'Peoples Temple (Jonestown)':                         { econ: -2.5, auth: 4.5, quadrant: 'Authoritarian Left' },
    'Branch Davidians':                                   { econ: -1.0, auth: 4.5, quadrant: 'Authoritarian Left' },
    'Heaven\'s Gate':                                     { econ:  0.0, auth: 4.0, quadrant: 'Authoritarian' },
    'Scientology':                                        { econ:  3.0, auth: 4.5, quadrant: 'Authoritarian Right' },
    'FLDS':                                               { econ:  2.0, auth: 5.0, quadrant: 'Authoritarian Right' },
    'Manson Family':                                      { econ: -3.0, auth: 4.0, quadrant: 'Authoritarian Left' },
    'Ku Klux Klan':                                       { econ:  2.0, auth: 4.5, quadrant: 'Authoritarian Right' },
    'John Birch Society':                                 { econ:  4.0, auth: 3.5, quadrant: 'Authoritarian Right' },
    'Synanon':                                            { econ: -1.0, auth: 5.0, quadrant: 'Authoritarian' },
    'Students for a Democratic Society (SDS)':            { econ: -4.0, auth: -2.0, quadrant: 'Libertarian Left' },
    'Young Patriots Organization':                        { econ: -3.0, auth: -1.0, quadrant: 'Libertarian Left' },
    'Black Panther Party (1966-1982)':                    { econ: -4.0, auth: -1.0, quadrant: 'Libertarian Left' },
    'American Eugenics Society':                          { econ:  3.0, auth: 3.0, quadrant: 'Authoritarian Right' },
    'Costco':                                             { econ:  2.0, auth: -1.0, quadrant: 'Libertarian Right' },
    'Theranos':                                           { econ:  4.0, auth: 4.0, quadrant: 'Authoritarian Right' },
  };

  return data
    .filter(d => positions[d.name])
    .map(d => ({
      ...d,
      ...positions[d.name],
      isCalibration: true,
    }));
}

export default async function CompassPage() {
  const [orgs, calibration] = await Promise.all([getOrgs(), getCalibrationAnchors()]);
  return <CompassClient orgs={orgs} calibrationOrgs={calibration} />;
}
