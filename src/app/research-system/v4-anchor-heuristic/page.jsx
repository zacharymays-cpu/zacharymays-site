export const metadata = {
  title: 'V4.0: Anchor-Based Heuristic | Research System',
  description: 'Documentation of version 4.0 of the AI-driven evaluation framework. Single-model heuristic approach with calibration exemplars.',
};

export default function V4Page() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow"><a href="/research-system">Research System Architecture</a></span>
          <h1 className="hero__title">V4.0: Anchor-Based Heuristic</h1>
          <p className="hero__subtitle">Single-model scoring with calibration exemplars. The foundation approach.</p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Objective</div>
          <div className="pull-quote">
            <p className="pull-quote__text">V4.0 established the first systematic approach to scoring. The key innovation was using calibration exemplars to anchor the scoring range and improve consistency.</p>
          </div>
          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">System Architecture</div>
          <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', marginTop: '1.5rem', marginBottom: '2rem' }}>
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

            <rect x="50" y="20" width="500" height="50" className="box" rx="4" />
            <text x="300" y="55" className="label" textAnchor="middle">Organizations to Score</text>

            <path d="M 300 70 L 300 100" className="arrow" />

            <rect x="50" y="100" width="500" height="60" className="box" rx="4" />
            <text x="300" y="125" className="label" textAnchor="middle">Calibration Exemplars (Injected)</text>
            <text x="300" y="150" className="small-label" textAnchor="middle">MAGA • NAACP • Girl Scouts • Other Anchors</text>

            <path d="M 300 160 L 300 190" className="arrow" />

            <rect x="150" y="190" width="300" height="60" className="box" rx="4" style={{ stroke: '#8b2020', strokeWidth: 2 }} />
            <text x="300" y="215" className="label" textAnchor="middle" fill="#f4f0e8">Single Claude Model</text>
            <text x="300" y="240" className="small-label" textAnchor="middle">Deterministic Rule Engine</text>

            <path d="M 300 250 L 300 280" className="arrow" />

            <rect x="50" y="280" width="500" height="80" className="box" rx="4" />
            <text x="300" y="305" className="label" textAnchor="middle">Scores (0-10)</text>
            <text x="300" y="335" className="small-label" textAnchor="middle">+ Calibration Notes + Reasoning</text>
          </svg>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Core Components</div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Calibration Exemplars</h3>
          <p>V4.0 injected reference organizations into the prompt to establish scoring boundaries. For example, the prompt would include:</p>
          <div style={{ background: 'rgba(244, 240, 232, 0.04)', border: '1px solid rgba(212, 206, 196, 0.15)', padding: '1.5rem', marginTop: '1rem', marginBottom: '2rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#6b6560' }}>
            "Consider these reference points: MAGA (score: 8.5), NAACP (score: 2.0), Girl Scouts (score: 0.5)..."
          </div>
          <p>The rationale: anchoring forces the model to calibrate its scale and reduces drift.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Deterministic Scoring</h3>
          <p>Single Claude model applying rules consistently. No jury consensus, no multi-model validation. Output includes numerical score plus reasoning.</p>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Limitations & Trade-offs</div>
          <div className="pull-quote">
            <p className="pull-quote__text">V4.0 revealed a critical limitation: anchor overcalibration. Organizations tended to cluster near the injected exemplars, creating a 15-20 point ceiling effect. Additionally, single-model scoring has inherent bias risks and no inter-rater validation.</p>
          </div>

          <p style={{ marginTop: '2rem' }}><strong>Key Limitations:</strong></p>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li>Anchor overcalibration (~15-20pt clustering around exemplars)</li>
            <li>Single-model bias (no external validation)</li>
            <li>No evidence provenance tracking</li>
            <li>Lack of inter-rater reliability metrics</li>
            <li>Non-replicable governance (decisions not auditable)</li>
          </ul>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Implementation</div>
          <p>V4.0 implementation retained in the codebase for provenance and back-comparison:</p>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li><code style={{ fontFamily: 'DM Mono, monospace', color: '#c8a84b' }}>scorer_v4.py</code> — Original single-model scorer</li>
            <li><code style={{ fontFamily: 'DM Mono, monospace', color: '#c8a84b' }}>tests/test_scorer_v4.py</code> — Validation tests</li>
          </ul>

          <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#6b6560' }}>Status: Retired from production, maintained for reference only.</p>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#6b6560' }}>← Previous version not applicable</p>
            <a href="/research-system/v5-0-evidence-jury" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem' }}>
              See how V5.0 solved these limitations →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
