export const metadata = {
  title: 'V5.0: Evidence-Based Multi-Model Jury | Research System',
  description: 'Three-model jury consensus with evidence-based scoring. Current production system.',
};

export default function V50Page() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow"><a href="/research-system">Research System Architecture</a></span>
          <h1 className="hero__title hero__title--compact">V5.0: Evidence-Based Multi-Model Jury</h1>
          <p className="hero__subtitle hero__subtitle--compact">Three independent models with evidence-weighted scoring and jury consensus logic. Current production system adopted 2026-06-01.</p>
        </div>
      </section>

      <section className="section">
        <div className="container--wide">
          <div className="section__label">What V4.0 Missed</div>
          <div className="pull-quote">
            <p className="pull-quote__text">V4.0's anchor overcalibration and single-model bias revealed that rigor requires: (1) evidence-based scoring (not exemplar anchoring), (2) multi-model consensus (not single-point estimates), (3) formal inter-rater validation, and (4) human governance gates.</p>
          </div>
          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--wide">
          <div className="section__label">System Architecture</div>

          <svg viewBox="0 0 700 500" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', marginTop: '1.5rem', marginBottom: '2rem' }}>
            <defs>
              <style>{`
                .box { fill: rgba(244, 240, 232, 0.06); stroke: rgba(212, 206, 196, 0.25); stroke-width: 1.5; }
                .label { font-family: 'Playfair Display', serif; font-size: 18px; fill: #f4f0e8; font-weight: 600; }
                .small-label { font-family: 'DM Mono', monospace; font-size: 11px; fill: #c8a84b; text-transform: uppercase; letter-spacing: 0.08em; }
                .arrow { stroke: rgba(212, 206, 196, 0.4); stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
                .accent-arrow { stroke: #8b2020; stroke-width: 2; fill: none; marker-end: url(#arrowhead-accent); }
              `}</style>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="rgba(212, 206, 196, 0.4)" />
              </marker>
              <marker id="arrowhead-accent" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#8b2020" />
              </marker>
            </defs>

            <rect x="50" y="10" width="600" height="45" className="box" rx="4" />
            <text x="350" y="42" className="label" textAnchor="middle">Organization + Evidence Package</text>

            <path d="M 350 55 L 350 85" className="arrow" />

            <rect x="50" y="85" width="600" height="60" className="box" rx="4" />
            <text x="350" y="110" className="label" textAnchor="middle">8-Tier Evidence Hierarchy</text>
            <text x="350" y="135" className="small-label" textAnchor="middle">Primary Sources → Secondary → Grey → AI-Derived</text>

            <path d="M 350 145 L 350 175" className="arrow" />

            <text x="50" y="170" className="small-label">Independent Jury Models</text>

            <rect x="30" y="185" width="180" height="80" className="box" rx="4" style={{ stroke: '#8b2020', strokeWidth: 2 }} />
            <text x="120" y="220" className="label" textAnchor="middle" fill="#f4f0e8" fontSize="16">Claude Sonnet</text>
            <text x="120" y="245" className="small-label" textAnchor="middle">No shared context</text>

            <rect x="260" y="185" width="180" height="80" className="box" rx="4" style={{ stroke: '#8b2020', strokeWidth: 2 }} />
            <text x="350" y="220" className="label" textAnchor="middle" fill="#f4f0e8" fontSize="16">GPT-4o</text>
            <text x="350" y="245" className="small-label" textAnchor="middle">No shared context</text>

            <rect x="490" y="185" width="180" height="80" className="box" rx="4" style={{ stroke: '#8b2020', strokeWidth: 2 }} />
            <text x="580" y="220" className="label" textAnchor="middle" fill="#f4f0e8" fontSize="16">Gemini Pro</text>
            <text x="580" y="245" className="small-label" textAnchor="middle">No shared context</text>

            <path d="M 120 265 L 120 295" className="accent-arrow" />
            <path d="M 350 265 L 350 295" className="accent-arrow" />
            <path d="M 580 265 L 580 295" className="accent-arrow" />

            <rect x="50" y="295" width="600" height="90" className="box" rx="4" />
            <text x="350" y="325" className="label" textAnchor="middle">Consensus Logic</text>
            <text x="350" y="350" className="small-label" textAnchor="middle">jury_mean • jury_median • jury_spread • consensus_strong</text>
            <text x="350" y="370" style={{ fontSize: '11px', fill: '#6b6560', textAnchor: 'middle' }}>Spread Thresholds: 0-5pt strong | 6-10pt accept with notes | 11-20pt review | &gt;20pt revise</text>

            <path d="M 350 385 L 350 415" className="arrow" />

            <rect x="50" y="415" width="600" height="70" className="box" rx="4" style={{ stroke: '#8b2020', strokeWidth: 2 }} />
            <text x="350" y="445" className="label" textAnchor="middle">Human Review Gate</text>
            <text x="350" y="468" className="small-label" textAnchor="middle">≥2/3 Jury Required • Governance Decision • Acceptance/Modification</text>
          </svg>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--wide">
          <div className="section__label">Core Components</div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: '1rem', color: '#f4f0e8' }}>Three-Model Jury</h3>
          <p>V5.0 uses three independent LLMs (Claude Sonnet 4.6, GPT-4o, Gemini Pro) without shared context. Each model scores independently on the same evidence package.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Evidence Framework</h3>
          <p>Evidence classified into 8-tier hierarchy: Peer-reviewed journals → Books → Government reports → Interviews → News → Documentary → Grey literature → AI-derived.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Consensus Logic</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li><strong>jury_mean:</strong> Average of three scores</li>
            <li><strong>jury_spread:</strong> Max - Min (indicates agreement strength)</li>
            <li><strong>consensus_strong:</strong> Boolean (spread ≤ 5 points)</li>
          </ul>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Human Review Gate</h3>
          <p>Jury proposals require human review before acceptance based on spread thresholds.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Scoring Outputs (Generated in Parallel)</h3>
          <p>V5.0 generates two scoring outputs simultaneously for each organization:</p>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li><strong>Young's Original Score:</strong> 0-10 binary checklist across the 10 criteria. How many of Young's indicators are present?</li>
            <li><strong>Composite Score:</strong> 0-100% formula-based: (Breadth ÷ 10) × (Mean Intensity ÷ 10) × 100. Measures evidence-weighted prevalence and intensity.</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            Both scores are generated from the same jury consensus and evidence package. Users receive both perspectives on each organization.
          </p>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--wide">
          <div className="section__label">Production Status</div>

          <table style={{ width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase' }}>Adoption Date</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>2026-06-01</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase' }}>Organizations Scored</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>565+ (all with jury provenance)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase' }}>Status</td>
                <td style={{ padding: '1rem', color: '#f4f0e8', fontWeight: 'bold' }}>✓ Current Production</td>
              </tr>
            </tbody>
          </table>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--wide">
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <a href="/research-system/v4-anchor-heuristic" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem' }}>
              ← See V4.0's approach
            </a>
            <a href="/research-system/v5-1-formal-validation" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem' }}>
              See how V5.1 added validation metrics →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
