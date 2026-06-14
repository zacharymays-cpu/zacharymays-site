export const metadata = {
  title: 'Research System Architecture',
  description: 'Documentation of an AI-driven evaluation framework architecture and its evolution from V4.0 through V6.1. Designed for researchers, academics, and practitioners interested in rigorous, scalable research evaluation systems.',
};

export default function ResearchSystemHub() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow">
            <a href="/research-system">Research System Architecture</a>
          </span>
          <h1 className="hero__title">An AI-Driven Evaluation Framework</h1>
          <p className="hero__subtitle">
            How a rigorous, multi-model system evolved through systematic iteration and principled decision-making
          </p>
        </div>
      </section>

      {/* Overview Section */}
      <section className="section">
        <div className="container--narrow">
          <div className="section__label">What This System Does</div>
          <p>
            This documentation explains a reusable framework for AI-driven research evaluation. Rather than domain-specific, this system is designed to work across any research domain requiring: consistent evidence assessment, multi-model consensus, human review governance, and rigorous validation.
          </p>
          <p>
            The system evolved through six versions (V4.0 → V6.1) plus one deliberate rejection (V5.2). Each iteration solved specific problems and introduced new capabilities. This documentation is for researchers, academics, and practitioners interested in building similar evaluation systems.
          </p>
        </div>
      </section>

      {/* Evolution Visual Timeline */}
      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Evolution Path</div>

          <svg viewBox="0 0 1000 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', marginTop: '2rem' }}>
            <defs>
              <style>{`
                .timeline-box { fill: rgba(244, 240, 232, 0.06); stroke: rgba(212, 206, 196, 0.25); stroke-width: 1; }
                .timeline-title { font-family: 'Playfair Display', serif; font-size: 18px; fill: #f4f0e8; font-weight: 600; }
                .timeline-label { font-family: 'DM Mono', monospace; font-size: 12px; fill: #c8a84b; text-transform: uppercase; letter-spacing: 0.1em; }
                .timeline-arrow { stroke: rgba(212, 206, 196, 0.4); stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
                .timeline-rejected { fill: rgba(139, 32, 32, 0.1); stroke: rgba(139, 32, 32, 0.3); }
              `}</style>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="rgba(212, 206, 196, 0.4)" />
              </marker>
            </defs>

            {/* V4.0 */}
            <rect x="10" y="20" width="140" height="100" className="timeline-box" rx="4" />
            <text x="85" y="50" className="timeline-title" textAnchor="middle">V4.0</text>
            <text x="85" y="75" className="timeline-label" textAnchor="middle">Anchor Heuristic</text>
            <text x="85" y="95" style={{ fontSize: '12px', fill: '#6b6560', textAnchor: 'middle' }}>Single Model</text>

            {/* Arrow V4 → V5.0 */}
            <path d="M 150 70 L 200 70" className="timeline-arrow" />

            {/* V5.0 */}
            <rect x="200" y="20" width="140" height="100" className="timeline-box" rx="4" />
            <text x="275" y="50" className="timeline-title" textAnchor="middle">V5.0</text>
            <text x="275" y="75" className="timeline-label" textAnchor="middle">Evidence Jury</text>
            <text x="275" y="95" style={{ fontSize: '12px', fill: '#6b6560', textAnchor: 'middle' }}>Current Prod</text>

            {/* Arrow V5.0 → V5.1 */}
            <path d="M 340 70 L 390 70" className="timeline-arrow" />

            {/* V5.1 */}
            <rect x="390" y="20" width="140" height="100" className="timeline-box" rx="4" />
            <text x="465" y="50" className="timeline-title" textAnchor="middle">V5.1</text>
            <text x="465" y="75" className="timeline-label" textAnchor="middle">Validation</text>
            <text x="465" y="95" style={{ fontSize: '12px', fill: '#6b6560', textAnchor: 'middle' }}>Pilot</text>

            {/* Arrow V5.1 → V5.2 (Rejected) */}
            <path d="M 530 70 L 580 70" className="timeline-arrow" stroke="rgba(139, 32, 32, 0.3)" />

            {/* V5.2 (Rejected) */}
            <rect x="580" y="20" width="140" height="100" className="timeline-box timeline-rejected" rx="4" />
            <text x="655" y="50" className="timeline-title" textAnchor="middle" fill="#8b2020">V5.2</text>
            <text x="655" y="75" className="timeline-label" textAnchor="middle" fill="#8b2020">Deepseek</text>
            <text x="655" y="95" style={{ fontSize: '12px', fill: '#8b2020', textAnchor: 'middle', fontWeight: 'bold' }}>❌ Rejected</text>

            {/* Arrow V5.1 → V6.0 */}
            <path d="M 530 120 L 600 180" className="timeline-arrow" />

            {/* V6.0 */}
            <rect x="680" y="160" width="140" height="100" className="timeline-box" rx="4" />
            <text x="755" y="190" className="timeline-title" textAnchor="middle">V6.0</text>
            <text x="755" y="215" className="timeline-label" textAnchor="middle">Lifton Framework</text>
            <text x="755" y="235" style={{ fontSize: '12px', fill: '#6b6560', textAnchor: 'middle' }}>Prod Ready</text>

            {/* Arrow V6.0 → V6.1 */}
            <path d="M 820 210 L 870 210" className="timeline-arrow" />

            {/* V6.1 */}
            <rect x="870" y="160" width="120" height="100" className="timeline-box" rx="4" />
            <text x="930" y="190" className="timeline-title" textAnchor="middle">V6.1</text>
            <text x="930" y="215" className="timeline-label" textAnchor="middle">Permanence</text>
            <text x="930" y="235" style={{ fontSize: '12px', fill: '#6b6560', textAnchor: 'middle' }}>Proposed</text>
          </svg>

          <hr className="rule" />
        </div>
      </section>

      {/* Methodology Pages Grid */}
      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Methodologies</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
            {/* V4.0 Card */}
            <a href="/research-system/v4-anchor-heuristic" style={{ textDecoration: 'none' }}>
              <div className="book-card" style={{ position: 'relative', padding: '2rem', border: '1px solid rgba(212, 206, 196, 0.15)', borderLeft: '3px solid #8b2020' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: '0.5rem', color: '#f4f0e8' }}>V4.0</h3>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: '#c8a84b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Anchor Heuristic</p>
                <p style={{ fontSize: '0.95rem', color: '#6b6560', lineHeight: 1.6 }}>Single-model scoring with calibration exemplars. Foundation approach.</p>
              </div>
            </a>

            {/* V5.0 Card */}
            <a href="/research-system/v5-0-evidence-jury" style={{ textDecoration: 'none' }}>
              <div className="book-card" style={{ position: 'relative', padding: '2rem', border: '1px solid rgba(212, 206, 196, 0.15)', borderLeft: '3px solid #c8a84b' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: '0.5rem', color: '#f4f0e8' }}>V5.0</h3>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: '#c8a84b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Current Production</p>
                <p style={{ fontSize: '0.95rem', color: '#6b6560', lineHeight: 1.6 }}>Three-model jury with evidence-based scoring. Primary system.</p>
              </div>
            </a>

            {/* V5.1 Card */}
            <a href="/research-system/v5-1-formal-validation" style={{ textDecoration: 'none' }}>
              <div className="book-card" style={{ position: 'relative', padding: '2rem', border: '1px solid rgba(212, 206, 196, 0.15)', borderLeft: '3px solid #8b2020' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: '0.5rem', color: '#f4f0e8' }}>V5.1</h3>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: '#c8a84b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Formal Validation</p>
                <p style={{ fontSize: '0.95rem', color: '#6b6560', lineHeight: 1.6 }}>Four-model jury with Krippendorff's alpha validation. Pilot phase.</p>
              </div>
            </a>

            {/* V5.2 Case Study Card */}
            <a href="/research-system/v5-2-deepseek-case-study" style={{ textDecoration: 'none' }}>
              <div className="book-card" style={{ position: 'relative', padding: '2rem', border: '1px solid rgba(139, 32, 32, 0.25)', borderLeft: '3px solid #8b2020', background: 'rgba(139, 32, 32, 0.04)' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: '0.5rem', color: '#f4f0e8' }}>V5.2</h3>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: '#8b2020', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 'bold' }}>Case Study: Rejected</p>
                <p style={{ fontSize: '0.95rem', color: '#6b6560', lineHeight: 1.6 }}>Deepseek experiment and why it failed. Lessons for future improvements.</p>
              </div>
            </a>

            {/* V6.0 Card */}
            <a href="/research-system/v6-0-lifton-framework" style={{ textDecoration: 'none' }}>
              <div className="book-card" style={{ position: 'relative', padding: '2rem', border: '1px solid rgba(212, 206, 196, 0.15)', borderLeft: '3px solid #8b2020' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: '0.5rem', color: '#f4f0e8' }}>V6.0</h3>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: '#c8a84b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Lifton Framework</p>
                <p style={{ fontSize: '0.95rem', color: '#6b6560', lineHeight: 1.6 }}>Dual-track system with Lifton's totalism framework. Production-ready.</p>
              </div>
            </a>

            {/* V6.1 Card */}
            <a href="/research-system/v6-1-permanence-aware" style={{ textDecoration: 'none' }}>
              <div className="book-card" style={{ position: 'relative', padding: '2rem', border: '1px solid rgba(212, 206, 196, 0.15)', borderLeft: '3px solid #8b2020' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: '0.5rem', color: '#f4f0e8' }}>V6.1</h3>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: '#c8a84b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Permanence-Aware</p>
                <p style={{ fontSize: '0.95rem', color: '#6b6560', lineHeight: 1.6 }}>Separates intensity from system permanence. Proposed refinement.</p>
              </div>
            </a>
          </div>

          <hr className="rule" />
        </div>
      </section>

      {/* Evolution Timeline Link */}
      <section className="section">
        <div className="container--narrow">
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>
            <a href="/research-system/evolution-timeline" style={{ color: '#c8a84b', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem' }}>
              Read the full evolution narrative →
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
