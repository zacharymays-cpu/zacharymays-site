import Link from 'next/link';
import { getFindingsStats, TIER_ORDER } from '../../../lib/getFindingsStats';
import CultsOverTimeChart from '../../../components/CultsOverTimeChart';

export const metadata = {
  title: 'Findings — The Organizational Coercion Index',
  description: 'What systematic application of the Young-Reed framework across hundreds of American organizations reveals about institutional formation and cult-adjacent dynamics.',
};

// Tier display metadata (composite-score band + color); counts come live.
const TIER_META = {
  'Super Culty': { range: '71–100%', color: '#6b1010' },
  'Kinda Culty': { range: '41–70%',  color: '#7a4a1a' },
  'Not Culty':   { range: '0–40%',   color: '#2a6b4a' },
};
// Softer reader-facing labels for the DB tier enum (keys are unchanged).
const TIER_LABELS = { 'Super Culty':'High-Control','Kinda Culty':'Moderate-Control','Not Culty':'Low-Control' };
const lbl = (t) => TIER_LABELS[t] || t;

// Shown only if the live stats fetch fails (rare; values cached hourly).
const FALLBACK = {
  r: 0.67, n: 492, scored: 492,
  tiers: [
    { tier: 'Super Culty', pct: 26.6 },
    { tier: 'Kinda Culty', pct: 36.6 },
    { tier: 'Not Culty', pct: 36.8 },
  ],
  largest: { tier: 'Not Culty', pct: 36.8 },
};

const BENCHMARKS = [
  { orgs: 'MAGA (84%) vs. Antifa (32%)',              note: 'Framework registers asymmetry accurately — both assessed by identical criteria' },
  { orgs: 'Black Church (29%) vs. SBC (43%)',         note: 'Formation-in-resistance produces measurably different profiles than formation-in-service-of-dominant-culture' },
  { orgs: 'NAACP (19%) vs. Heritage Foundation (58%)', note: 'Civil rights formation vs. political mobilization formation' },
  { orgs: 'Labor unions (21–45%) vs. Corporate employers (56–70%)', note: 'High solidarity does not require cult-adjacent dynamics' },
  { orgs: 'Girl Scouts (6%) vs. Boy Scouts of America (62%)', note: 'Same category, different institutional architecture' },
  { orgs: 'Democratic Party (6%) vs. Republican Party / MAGA', note: 'Instrument divergence confirmed by evidence — not political preference' },
  { orgs: 'US Navy SEALs (96%) vs. US Army (61%)',    note: 'Intensity varies substantially within the same branch of government' },
  { orgs: 'Scientology (100%) vs. Presbyterian Church USA (11%)', note: 'Same religious category, opposite institutional architectures' },
];

export default async function FindingsPage() {
  const stats = await getFindingsStats();
  const r = stats?.r != null ? stats.r : FALLBACK.r;
  const n = stats?.n ?? FALLBACK.n;
  const scored = stats?.scored ?? FALLBACK.scored;
  const tierData = stats?.tiers ?? FALLBACK.tiers;
  const largest = stats?.largest ?? FALLBACK.largest;
  const maxPct = Math.max(...tierData.map(t => t.pct), 1);

  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">
            <Link href="/oci" style={{color: 'var(--gold)'}}>The Organizational Coercion Index</Link>
            {' '}— Findings
          </span>
          <h1 className="hero__title hero__title--compact animate-up-2">What the<br />Data Shows</h1>
          <p className="hero__subtitle hero__subtitle--compact animate-up-3">
            Selected findings from systematic application of the
            Young-Reed framework across {scored} scored American organizations.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container--wide">

          <div className="section__label">The Headline Finding</div>

          <p style={{fontSize: '1.1rem', color: 'var(--cream)', lineHeight: 1.8}}>
            Across the {n} organizations with a scored political position, the
            correlation between authority-axis position and Group Dynamics
            score is <strong style={{color: 'var(--gold)'}}>r = {r.toFixed(3)}</strong>.
          </p>

          <p>
            This is not a small effect. It means that knowing where an
            organization sits on the authoritarian-to-libertarian axis
            explains roughly half the variance in its cult-adjacency score.
            The relationship is not perfect — there are high-control
            organizations across the political spectrum, and healthy
            organizations across it as well. But the pattern is strong,
            consistent, and not explained by coincidence.
          </p>

          <p>
            The question the dataset raises — and that{' '}
            <Link href="/how-we-got-here"><em>How We Got Here</em></Link>{' '}
            attempts to answer — is why this relationship exists and how
            it was built.
          </p>

          <hr className="rule" />

          <div className="section__label">Tier Distribution</div>

          <p style={{color: 'var(--muted)', marginBottom: '2rem', fontSize: '0.9rem'}}>
            How the {scored} scored organizations distribute across the three YM Composite tiers:
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0 0 2rem'}}>
            {tierData.map((t, i) => {
              const meta = TIER_META[t.tier] || { color: '#888' };
              return (
              <div key={i} style={{display: 'grid', gridTemplateColumns: '140px 1fr 50px', gap: '1rem', alignItems: 'center'}}>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '0.7rem',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--paper)', padding: '0.25rem 0.6rem',
                  background: meta.color,
                }}>{lbl(t.tier)}</div>
                <div style={{
                  height: '8px', background: 'rgba(212,206,196,0.1)',
                  borderRadius: '1px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${(t.pct / maxPct) * 100}%`,
                    background: meta.color, transition: 'width 0.3s',
                  }} />
                </div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '0.75rem',
                  color: 'var(--muted)', textAlign: 'right',
                }}>{t.pct.toFixed(1)}%</div>
              </div>
              );
            })}
          </div>

          <p style={{color: 'var(--muted)', fontSize: '0.88rem', fontStyle: 'italic'}}>
            {lbl(largest.tier)} is the largest single tier, accounting for
            {' '}{largest.pct.toFixed(0)}% of scored organizations. These figures
            update as new assessments are completed.
          </p>

          <hr className="rule" />

          <div className="section__label">Active Organizations Over Time</div>

          <p style={{color: 'var(--muted)', marginBottom: '2rem', fontSize: '0.9rem'}}>
            The number of organizations (Moderate-Control or High-Control) counted
            as active in the United States in each year:
          </p>

          <CultsOverTimeChart />

          <hr className="rule" />

          <div className="section__label">Key Analytical Findings</div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0'}}>
            {[
              {
                heading: 'Formation-in-resistance produces measurably different profiles',
                body: 'Organizations formed explicitly in resistance to white supremacist power structures exhibit systematically lower cult-adjacency scores than organizations formed in service of dominant culture — even when both have comparable levels of institutional commitment and solidarity. High solidarity does not require cult-adjacent dynamics. The dataset documents this distinction across civil rights organizations, labor unions, and community institutions.',
              },
              {
                heading: 'The secrecy gradient drives variance in federal employers',
                body: 'Among federal agencies and defense-adjacent organizations, the strongest predictor of YM Composite score is classification architecture — the degree to which secrecy is structurally embedded in the institution\'s operating culture. The relationship between mission intensity and institutional harm cover-up capacity is a documented analytical finding, not an assumption.',
              },
              {
                heading: 'C9 (Exit Costs) is the strongest YM Composite predictor',
                body: 'Of the ten criteria, exit cost intensity shows the strongest correlation with overall YM Composite score. Organizations that engineer high exit costs — whether through spiritual absolutism, deferred compensation traps, classified knowledge burdens, or social network dependency — tend to score high across the other criteria as well. Exit cost architecture appears to be both a symptom and an enabler of other high-control dynamics.',
              },
              {
                heading: 'C6 (Private Vernacular) is the most universal criterion',
                body: 'More organizations check C6 than any other criterion. Specialized vocabulary that marks membership, encodes insider epistemology, and functions as a thought-stopping mechanism appears across organizational types that otherwise look nothing alike — from high-control religious movements to corporate tech cultures to political formations.',
              },
              {
                heading: 'Defunct organizations average substantially higher scores',
                body: 'Organizations that no longer exist score substantially higher on average than stable, active organizations. This may reflect survivor bias — organizations with the most extreme dynamics were more likely to collapse, be shut down, or destroy themselves. It may also reflect that the historical record is more complete for defunct organizations than for active ones whose members and leadership can still suppress documentation.',
              },
            ].map((item, i) => (
              <div key={i} style={{
                borderLeft: '2px solid rgba(200,168,75,0.3)',
                paddingLeft: '1.75rem',
                paddingTop: '0.25rem',
                paddingBottom: '1.75rem',
                marginBottom: '0.25rem',
              }}>
                <p style={{
                  fontFamily: 'var(--serif)', fontWeight: 700,
                  fontSize: '1rem', color: 'var(--paper)',
                  marginBottom: '0.6rem',
                }}>{item.heading}</p>
                <p style={{color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0}}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">Benchmark Comparisons</div>

          <p style={{color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9rem'}}>
            Selected pairings illustrating the framework's analytical range.
            Both organizations in each pair were assessed by identical criteria.
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0'}}>
            {BENCHMARKS.map((b, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '2rem', padding: '1.25rem 0',
                borderBottom: '1px solid rgba(212,206,196,0.08)',
              }}>
                <p style={{fontFamily: 'var(--serif)', fontSize: '0.95rem', color: 'var(--paper)', margin: 0, fontStyle: 'italic'}}>
                  {b.orgs}
                </p>
                <p style={{fontFamily: 'var(--body)', fontSize: '0.85rem', color: 'var(--muted)', margin: 0}}>
                  {b.note}
                </p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">What the Findings Don't Say</div>

          <p>
            High YM Composite scores are descriptive, not normative. A score
            documents what an organization's institutional architecture looks
            like — it does not determine whether membership is beneficial,
            whether the organization's goals are worthy, or whether individuals
            should leave. Military special operations units score in the Cult
            tier on both instruments. That documents their formation
            architecture. It says nothing about whether military service is
            valuable or whether individual soldiers should reconsider their
            commitment.
          </p>

          <p>
            The framework is a diagnostic tool. What you do with the
            diagnosis is a separate question.
          </p>

          <div style={{marginTop: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <Link href="/oci/dataset" className="btn-primary">Explore the Dataset</Link>
            <Link href="/findings" className="btn-secondary">Live Distribution Analysis</Link>
            <Link href="/oci/methodology" className="btn-secondary">Review the Methodology</Link>
          </div>

        </div>
      </section>
    </>
  );
}
