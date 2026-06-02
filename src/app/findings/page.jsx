import FindingsClient from './FindingsClient';
import Link from 'next/link';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const metadata = {
  title: 'Findings — The Cultiness Spectrum',
  description: 'Distribution and instrument variance analysis across 394 American organizations.',
};
export const revalidate = 3600;

async function getOrgs() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations?select=name,category,composite_tier,composite_score,youngs_score,trajectory&order=composite_score.desc`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export default async function FindingsPage() {
  const orgs = await getOrgs();
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">
            <Link href="/cultiness" style={{color:'var(--gold)'}}>The Cultiness Spectrum</Link>
            {' '}— Findings
          </span>
          <h1 className="hero__title animate-up-2">What the<br />Data Shows</h1>
          <p className="hero__subtitle animate-up-3">
            Distribution and instrument variance analysis across {orgs.length} American organizations.
            The r&nbsp;=&nbsp;0.703 correlation between authority-axis position and cultiness score
            is the headline finding. What follows is what the full dataset looks like.
          </p>
        </div>
      </section>
      <FindingsClient orgs={orgs} />
    </>
  );
}
