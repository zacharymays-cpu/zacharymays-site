import FindingsClient from './FindingsClient';
import Link from 'next/link';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

export const metadata = {
  title: 'Distribution Analysis — The Cultiness Spectrum',
  description: 'Live distribution and instrument-variance analysis of the Cultiness Spectrum dataset — score histogram, composite-vs-Young\'s variance, and tier breakdown computed directly from current data.',
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
            <Link href="/cultiness/findings" style={{color:'var(--gold)'}}>Findings</Link>
            {' '}— Live Distribution Analysis
          </span>
          <h1 className="hero__title animate-up-2">Distribution<br />&amp; Variance</h1>
          <p className="hero__subtitle animate-up-3">
            Score distribution and composite-vs-Young's instrument variance across
            {' '}{orgs.length} assessed organizations, computed directly from the current
            dataset. For the headline findings and benchmark comparisons, see{' '}
            <Link href="/cultiness/findings" style={{color:'var(--gold)'}}>Findings</Link>.
          </p>
        </div>
      </section>
      <FindingsClient orgs={orgs} />
    </>
  );
}
