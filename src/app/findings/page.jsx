import FindingsClient from './FindingsClient';
import Link from 'next/link';

import { SUPABASE_URL, ANON_KEY } from '../../lib/supabase/config';

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
