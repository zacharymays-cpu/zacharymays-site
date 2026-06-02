import Link from 'next/link';

export const metadata = {
  title: 'The Cultiness Spectrum',
  description: 'An independent public research project applying the Young-Reed framework systematically across American institutions. 370 organizations assessed, openly documented, ongoing.',
};

const NAV_ITEMS = [
  { href: '/cultiness/methodology',      label: 'Methodology',   desc: 'How the scoring works' },
  { href: '/cultiness/ai-methodology',   label: 'AI & Scoring',  desc: 'How AI is used and why' },
  { href: '/cultiness/findings',         label: 'Findings',      desc: 'What the data shows' },
  { href: '/cultiness/dataset',          label: 'The Dataset',   desc: 'What was assessed' },
];

export default function CultinessPage() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">
            An independent public research project
          </span>
          <h1 className="hero__title animate-up-2">
            The Cultiness<br />Spectrum
          </h1>
          <p className="hero__subtitle animate-up-3">
            A systematic, evenhanded application of the Young-Reed
            framework across American institutional life — openly
            documented, publicly available, and ongoing.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">

          <div className="section__label">What This Is</div>

          <p>
            The Cultiness Spectrum is an independent educational research
            project. Its purpose is straightforward: to apply the framework
            developed by Daniella Mestyanek Young and Amy Reed in{' '}
            <a href="https://uncultureyourself.com" target="_blank" rel="noopener noreferrer">
              <em>The Culting of America</em>
            </a>{' '}
            systematically and evenhandedly across a broad range of American
            organizations — and to make those assessments publicly available
            as a documented, auditable research resource.
          </p>

          <p>
            The value of this project is intrinsic. Understanding which
            institutional architectures produce high-control group dynamics —
            and which do not — is analytically and educationally important
            regardless of any particular argument or application. The dataset
            stands on its own. It will continue to grow, be revised as
            methodology improves, and remain publicly accessible.
          </p>

          <div className="pull-quote">
            <p className="pull-quote__text">
              The question isn't whether any given organization is a cult.
              The question is what its institutional architecture looks like —
              and whether the people inside it can see it clearly.
            </p>
          </div>

          <hr className="rule" />

          <div className="section__label">The Framework</div>

          <p>
            Young and Reed identify ten criteria that characterize cult-adjacent
            organizations — from charismatic leadership and sacred assumptions
            through to high exit costs and ends-justify-the-means institutional
            behavior. The framework was designed as a diagnostic tool: applied
            to a single organization, it helps members understand whether the
            group they belong to has the architecture of a high-control system.
          </p>

          <p>
            This project extends that diagnostic capacity to comparative,
            dataset-scale analysis. A dual-metric scoring system was developed
            specifically for this purpose: Young's original binary instrument
            runs fully independently alongside a composite score that captures
            both the breadth and intensity of cult-adjacent dynamics across
            all ten criteria. The two instruments are never converted between
            each other — their divergence is itself analytically meaningful.
          </p>

          <p>
            Every score is anchored to publicly documented, verifiable
            behaviors — court records, regulatory findings, investigative
            journalism, academic scholarship, institutional self-documentation.
            Not reputation. Not presumption. Documented behavior.
          </p>

          <hr className="rule" />

          <div className="section__label">Scale</div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: 'rgba(212,206,196,0.1)',
            margin: '1.5rem 0 2.5rem',
          }}>
            {[
              { num: '370',     label: 'Active organizations assessed' },
              { num: '38',      label: 'Calibration anchors' },
              { num: 'r=0.703', label: 'Authority-axis correlation' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'var(--ink)', padding: '2rem', textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)',
                  fontWeight: 700, color: 'var(--gold)',
                  lineHeight: 1, marginBottom: '0.5rem',
                }}>{stat.num}</div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '0.68rem',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <p>
            Organizations assessed span religious denominations, political
            movements, military formations, federal agencies, corporate
            cultures, media institutions, educational systems, advocacy
            organizations, and historical calibration anchors. The dataset
            is publicly available on GitHub and updated as new assessments
            are completed and reviewed.
          </p>

          <hr className="rule" />

          <div className="section__label">The Evenhandedness Commitment</div>

          <p>
            The framework produces credible results only if the same analytical
            standard applies regardless of political, religious, or cultural
            valence. This is non-negotiable — not as a disclaimer, but as a
            methodological requirement. An assessment tool that scores
            organizations on one side of the political or cultural spectrum
            differently than the other is not a research tool. It is advocacy.
          </p>

          <p>
            Some results confirm intuitions. Some challenge them. That is what
            systematic, evenhanded analysis produces — and it is the only kind
            worth doing.
          </p>

          <hr className="rule" />

          <div className="section__label">Explore the Project</div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1px',
            background: 'rgba(212,206,196,0.1)',
            marginTop: '1rem',
          }}>
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href} style={{textDecoration: 'none', display: 'block'}}>
                <div className="book-card-inner" style={{padding: '2rem'}}>
                  <p style={{
                    fontFamily: 'var(--serif)', fontSize: '1.1rem',
                    fontWeight: 700, color: 'var(--paper)', marginBottom: '0.4rem'
                  }}>{item.label}</p>
                  <p style={{
                    fontFamily: 'var(--mono)', fontSize: '0.72rem',
                    color: 'var(--muted)', letterSpacing: '0.06em', margin: 0
                  }}>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div style={{
            background: 'rgba(200,168,75,0.06)',
            border: '1px solid rgba(200,168,75,0.2)',
            padding: '2rem',
            marginTop: '3rem',
          }}>
            <p style={{
              fontFamily: 'var(--mono)', fontSize: '0.7rem',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--gold)', marginBottom: '0.75rem'
            }}>Framework Source</p>
            <p style={{fontSize: '0.95rem', color: 'var(--muted)', margin: 0}}>
              The ten criteria applied in this project are derived verbatim
              from Daniella Mestyanek Young and Amy Reed,{' '}
              <a href="https://uncultureyourself.com" target="_blank" rel="noopener noreferrer">
                <em>The Culting of America: What Makes a Cult and Why We Love Them</em>
              </a>{' '}
              (Otterpine, 2026). The composite scoring system and dual-metric
              architecture were developed independently as an extension for
              dataset-scale application. Young's binary instrument runs fully
              independently and is never mechanically converted from composite
              scores.
            </p>
          </div>

        </div>
      </section>
    </>
  );
}
