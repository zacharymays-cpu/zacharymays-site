export const metadata = {
  title: 'V6.0: Lifton Framework | Research System',
  description: 'Dual-track system extending V5.0 with Lifton\'s totalism framework. C11 criterion added.',
};

export default function V60Page() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow"><a href="/research-system">Research System Architecture</a></span>
          <h1 className="hero__title">V6.0: Lifton Framework Track</h1>
          <p className="hero__subtitle">Dual-track jury system extending evidence-based scoring to Lifton's totalism framework. New C11 criterion. Production-ready 2026-06-12.</p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Why Extend Beyond Young?</div>
          <div className="pull-quote">
            <p className="pull-quote__text">Young & Reed's 10 criteria are excellent for cult detection. However, Robert Jay Lifton's 8-point framework for ideological totalism offers a complementary lens—especially for understanding permanence and system design. V6.0 adds a parallel track using Lifton's framework alongside Young's.</p>
          </div>
          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Dual-Track System</div>

          <svg viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', marginTop: '1.5rem', marginBottom: '2rem' }}>
            <defs>
              <style>{`
                .box { fill: rgba(244, 240, 232, 0.06); stroke: rgba(212, 206, 196, 0.25); stroke-width: 1.5; }
                .label { font-family: 'Playfair Display', serif; font-size: 18px; fill: #f4f0e8; font-weight: 600; }
                .small-label { font-family: 'DM Mono', monospace; font-size: 11px; fill: #c8a84b; text-transform: uppercase; letter-spacing: 0.08em; }
                .arrow { stroke: rgba(212, 206, 196, 0.4); stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
              `}</style>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="rgba(212, 206, 196, 0.4)" />
              </marker>
            </defs>

            <rect x="50" y="10" width="600" height="45" className="box" rx="4" />
            <text x="350" y="42" className="label" textAnchor="middle">Organization + Evidence</text>

            <path d="M 350 55 L 350 85" className="arrow" />

            <text x="50" y="85" className="small-label">Dual-Track Jury Processing</text>

            <rect x="30" y="100" width="280" height="100" className="box" rx="4" />
            <text x="170" y="130" className="label" textAnchor="middle" fontSize="16">Young Track</text>
            <text x="170" y="160" className="small-label" textAnchor="middle">C1-C10: Cult Behavior</text>
            <text x="170" y="180" style={{ fontSize: '11px', fill: '#6b6560', textAnchor: 'middle' }}>3-Model Jury</text>

            <rect x="390" y="100" width="280" height="100" className="box" rx="4" />
            <text x="530" y="130" className="label" textAnchor="middle" fontSize="16">Lifton Track</text>
            <text x="530" y="160" className="small-label" textAnchor="middle">C11: Totalism System</text>
            <text x="530" y="180" style={{ fontSize: '11px', fill: '#6b6560', textAnchor: 'middle' }}>Parallel Jury</text>

            <path d="M 170 200 L 170 230" className="arrow" />
            <path d="M 530 200 L 530 230" className="arrow" />

            <rect x="50" y="230" width="600" height="80" className="box" rx="4" />
            <text x="350" y="260" className="label" textAnchor="middle">Configural Scoring</text>
            <text x="350" y="285" className="small-label" textAnchor="middle">Combine signals without averaging</text>
            <text x="350" y="305" style={{ fontSize: '11px', fill: '#6b6560', textAnchor: 'middle' }}>5-Tier Classification based on preponderance</text>
          </svg>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Core Concepts</div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: '1rem', color: '#f4f0e8' }}>Young's 10 Criteria (C1-C10)</h3>
          <p>Behavioral indicators of cultic control: deception, unquestioning obedience, exploitation, isolation, etc.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Lifton's Totalism (C11)</h3>
          <p>System-level analysis: ideological totalism, thought control, information control, mystique, confession, sacred science, loading the language, dispensing of existence, doctrine over person, and context vs. texture.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Configural Scoring</h3>
          <p>Rather than averaging tracks, V6.0 uses non-compensatory logic: preponderance of evidence from either track can determine final classification.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Scoring Outputs (Generated in Parallel)</h3>
          <p>V6.0 generates three scoring outputs simultaneously for each organization:</p>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li><strong>Young's Original Score:</strong> 0-10 binary checklist from C1-C10 jury track</li>
            <li><strong>Composite Score:</strong> 0-100% formula-based from C1-C10 jury track</li>
            <li><strong>Lifton's Totalism Score:</strong> 0-10 from C11 jury track (ideological totalism framework)</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            All three scores are generated from the same evidence package via parallel jury processing. Users receive all three perspectives on each organization—Young's behavior-based analysis, Composite evidence-weighted prevalence, and Lifton's system-level totalism assessment.
          </p>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Production Status</div>

          <table style={{ width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase' }}>Approval Date</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>2026-06-12</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase' }}>Organizations Scored</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>536+ fully scored</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase' }}>Krippendorff's α</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>0.81 (threshold met)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase' }}>Status</td>
                <td style={{ padding: '1rem', color: '#f4f0e8', fontWeight: 'bold' }}>✓ Production-Ready</td>
              </tr>
            </tbody>
          </table>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <a href="/research-system/v5-2-deepseek-case-study" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem' }}>
              ← See the V5.2 rejection decision
            </a>
            <a href="/research-system/v6-1-permanence-aware" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem' }}>
              See how V6.1 refines this approach →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
