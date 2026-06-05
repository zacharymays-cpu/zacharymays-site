import Link from 'next/link';

export const metadata = {
  title: 'Methodology — The Cultiness Spectrum',
  description: 'How the Cultiness Spectrum scoring system works: the ten criteria, the dual-metric system, N/A discipline, and the evenhandedness standard.',
};

const CRITERIA = [
  { id: 'C1',  name: 'Charismatic Leadership',        desc: 'A defined authority figure — or a central idea functioning in place of a person — whose directives are taken as truth and whose challengers are discredited. Does not require a living human leader; posthumous authority that is institutionally ratified and structurally unrevisable scores as high as or higher than a living leader.' },
  { id: 'C2',  name: 'Sacred Assumptions',            desc: 'Certain beliefs maintained against counter-evidence, with mantras repeated and alternatives dismissed. The key test is not whether beliefs exist but whether they are enforced against documented contradicting evidence. The most extreme form is architectural prevention of counter-evidence from being generated at all.' },
  { id: 'C3',  name: 'Transcendent Mission',          desc: 'A mission so large it justifies sacrifice, treats doubts as betrayal, and provides meaning in ways that override individual judgment. Organizations that structurally encourage internal dissent as an improvement mechanism score N/A — the structural opposite of this criterion.' },
  { id: 'C4',  name: 'Sublimation of Individuality',  desc: 'Identity demands, appearance and lifestyle conformity, and rest-as-weakness culture. Includes institutional statements that inflate membership value, creating a reputational double-bind where departure signals either rejection or poor judgment.' },
  { id: 'C5',  name: 'Isolation',                     desc: 'Information environment narrows, outside perspectives are dismissed, the world shrinks. Isolation through institutional ecosystem completeness — parallel schools, hospitals, media, employment — scores equivalently to geographic compound isolation. The developmental outcome is functionally identical.' },
  { id: 'C6',  name: 'Private Vernacular',            desc: 'Specialized vocabulary that marks membership identity, encodes a way of understanding reality difficult to access from outside, and terminates inquiry rather than enabling it. Standard professional field vocabulary does not check this criterion — the test is whether vocabulary operates as epistemological closure, not merely institutional naming.' },
  { id: 'C7',  name: 'Us-Versus-Them',               desc: 'More-enlightened-than-outsiders framing, defectors characterized as broken or corrupt, disagreement framed as bigotry or betrayal. Appropriate labor-management framing in unions and symmetrical partisan framing in political parties are distinguished from pathological enemy-construction.' },
  { id: 'C8',  name: 'Exploitation of Labor',         desc: 'Sacrifice extracted as virtue, labor monetized through institutional control. Financial extraction coerced through doctrinal framing with salvific or mission stakes is labor extraction. The delivery mechanism — financial, physical, or psychological — does not moderate intensity scoring. Compensation engineered to create exit barriers rather than fairly reward labor also checks this criterion.' },
  { id: 'C9',  name: 'High Exit Costs',               desc: 'Departure produces social, economic, or identity costs; exit is framed as betrayal. Spiritual absolutism — where departure means eternal damnation, complete family rupture, and total social network dissolution — scores at the same level as physical confinement. The absence of physical restraint does not moderate the score.' },
  { id: 'C10', name: 'Ends Justify the Means',        desc: 'Institutional harm tolerated in pursuit of mission, cover-ups occur, perpetrators are protected. Multi-generational non-correcting harm patterns score at the ceiling regardless of mechanism. The existence of internal dissenters who made the courageous choice within the same constraints establishes that compliant choices were genuine institutional choices, not forced outcomes.' },
];

export default function MethodologyPage() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">
            <Link href="/cultiness" style={{color: 'var(--gold)'}}>The Cultiness Spectrum</Link>
            {' '}— Methodology
          </span>
          <h1 className="hero__title animate-up-2">How the<br />Scoring Works</h1>
          <p className="hero__subtitle animate-up-3">
            The framework, the dual-metric system, the scoring rules,
            and why each design decision was made.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">

          <div className="section__label">The Source Framework</div>

          <p>
            Every criterion applied in this project is derived verbatim from
            Daniella Mestyanek Young and Amy Reed's{' '}
            <a href="https://uncultureyourself.com" target="_blank" rel="noopener noreferrer">
              <em>The Culting of America: What Makes a Cult and Why We Love Them</em>
            </a>{' '}
            (Otterpine, 2026). Young and Reed define a cult as a group that
            meets these ten conditions. The composite scoring system was
            developed independently to extend analytical range for
            dataset-scale application — but the criteria themselves are
            Young and Reed's.
          </p>

          <hr className="rule" />

          <div className="section__label">The Ten Criteria</div>

          <p style={{color: 'var(--muted)', marginBottom: '2rem'}}>
            A cult is a group that:
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0'}}>
            {CRITERIA.map((c, i) => (
              <div key={c.id} style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr',
                gap: '1.5rem',
                padding: '1.75rem 0',
                borderBottom: '1px solid rgba(212,206,196,0.1)',
              }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.1em',
                  color: 'var(--gold)',
                  paddingTop: '0.2rem',
                  fontWeight: 500,
                }}>{c.id}</div>
                <div>
                  <p style={{
                    fontFamily: 'var(--serif)',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--paper)',
                    marginBottom: '0.5rem',
                  }}>{c.name}</p>
                  <p style={{
                    color: 'var(--muted)',
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    margin: 0,
                  }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">Two Independent Instruments</div>

          <p>
            Every organization receives two scores that are derived
            independently and never converted between each other.
            Their divergence is analytically meaningful, not a problem
            to resolve.
          </p>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(212,206,196,0.1)', margin: '2rem 0'}}>
            {[
              {
                label: "Young's Original Score",
                sub: '0–10 binary checklist',
                body: "Each of the ten criteria either checks or does not check. Produces three bands: Not Culty (0–2), Kinda Culty (3–5), Super Culty (6–10). Must be derived from direct application of Young's checklist — never mechanically converted from composite intensity. Mechanical conversion produces systematically inflated results.",
              },
              {
                label: 'Composite Cultiness Score',
                sub: 'Formula-based 0–100%',
                body: 'Formula: (Breadth ÷ 10) × (Mean Intensity ÷ 10) × 100. Breadth = criteria with non-N/A scores. Mean Intensity = average of those scores. Adds two dimensions the binary instrument cannot capture: intensity variance and breadth-intensity interaction. Produces three tiers from Not Culty through Super Culty.',
              },
            ].map((item, i) => (
              <div key={i} style={{background: 'var(--ink)', padding: '2rem'}}>
                <p style={{fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.3rem'}}>{item.label}</p>
                <p style={{fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: '1rem'}}>{item.sub}</p>
                <p style={{color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0}}>{item.body}</p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">Composite Tiers</div>

          <div style={{margin: '1.5rem 0'}}>
            {[
              { range: '0–40%',    tier: 'Not Culty',    color: '#2a6b4a' },
              { range: '41–70%',   tier: 'Kinda Culty',  color: '#7a4a1a' },
              { range: '71–100%',  tier: 'Super Culty',  color: '#6b1010' },
            ].map((t, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '80px 160px 1fr',
                gap: '1.5rem',
                padding: '0.85rem 0',
                borderBottom: '1px solid rgba(212,206,196,0.08)',
                alignItems: 'center',
              }}>
                <div style={{fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--muted)'}}>{t.range}</div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '0.75rem',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--paper)', padding: '0.3rem 0.75rem',
                  background: t.color, display: 'inline-block',
                }}>{t.tier}</div>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">The N/A Rule</div>

          <p>
            Each criterion receives either a score of 1–10 or N/A.
            N/A is not a floor score. N/A designates structural absence —
            the criterion describes a dynamic that is inapplicable because
            the organization lacks the architecture for it, or because the
            organization's documented behavior is the structural opposite
            of what the criterion describes.
          </p>

          <p>
            Never assign N/A to soften a low score. Never assign a floor
            number when the evidence says the dynamic is absent. When body
            text explicitly states a dynamic is not operative, the score must
            be N/A — not 1 or 2. The distinction matters because N/A criteria
            are excluded from both the breadth count and the mean intensity
            calculation. Phantom scoring — floor numbers on structurally absent
            criteria — artificially inflates composite scores and produces
            misleading results.
          </p>

          <hr className="rule" />

          <div className="section__label">Per-Criterion Intensity Scale</div>

          <div style={{margin: '1.5rem 0'}}>
            {[
              { score: 'N/A', desc: 'Criterion structurally inapplicable — dynamic not operative and organization lacks the architecture for it' },
              { score: '1–2', desc: 'Essentially no evidence of this dynamic' },
              { score: '3–4', desc: 'Mild, occasional, or incidental presence' },
              { score: '5–6', desc: 'Moderate, recurring presence with documented examples' },
              { score: '7–8', desc: 'Strong, systematic presence across multiple documented behaviors' },
              { score: '9–10', desc: 'Extreme, defining feature with documented evidence of harm' },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '60px 1fr', gap: '1.5rem',
                padding: '0.85rem 0', borderBottom: '1px solid rgba(212,206,196,0.08)',
              }}>
                <div style={{fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 500}}>{row.score}</div>
                <p style={{color: 'var(--muted)', fontSize: '0.9rem', margin: 0}}>{row.desc}</p>
              </div>
            ))}
          </div>

          <hr className="rule" />

          <div className="section__label">Evidence Standards</div>

          <p>
            Scores are anchored to publicly documented, verifiable behaviors —
            not reputation, not impression, not general public perception.
            Acceptable sources include court records and regulatory findings,
            investigative journalism from publications meeting T1–T2 credibility
            standards, peer-reviewed academic scholarship, government reports,
            and institutional self-documentation. Each criterion score includes
            at least one specific, verifiable example with citation.
          </p>

          <p>
            Where evidence is limited, contested, or primarily indirect,
            confidence is rated Low and noted explicitly. The methodology
            does not paper over uncertainty.
          </p>

          <hr className="rule" />

          <div className="section__label">The Human Review Gate</div>

          <p>
            AI-assisted scoring is used to generate proposed assessments at
            scale. Every proposed score passes through human review before
            entering the dataset. The reviewer verifies that each score is
            consistent with the body text, that N/A designations have
            structural rationale, that cited sources support the claims made,
            and that the assessment reflects consistent application of the
            methodology across the ideological and cultural spectrum.
          </p>

          <p>
            The AI proposes. The human decides. No score enters the published
            dataset without that review.
          </p>

          <div style={{marginTop: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <Link href="/cultiness/findings" className="btn-primary">See the Findings</Link>
            <Link href="/cultiness/dataset" className="btn-secondary">Explore the Dataset</Link>
          </div>

        </div>
      </section>
    </>
  );
}
