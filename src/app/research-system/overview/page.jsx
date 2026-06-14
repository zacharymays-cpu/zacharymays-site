export const metadata = {
  title: 'System Overview | Research System Architecture',
  description: 'Comprehensive overview of the current AI-driven research evaluation system. Multi-model jury consensus, evidence framework, dual-track scoring, auditability, and governance.',
};

export default function OverviewPage() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow"><a href="/research-system">Research System Architecture</a></span>
          <h1 className="hero__title hero__title--compact">System Overview</h1>
          <p className="hero__subtitle hero__subtitle--compact">
            A comprehensive, auditable, multi-model evaluation framework designed for rigorous research at scale
          </p>
        </div>
      </section>

      {/* System Architecture Diagram */}
      <section className="section">
        <div className="container--wide">
          <div className="section__label">Current System Architecture (V5.0 + V6.0+)</div>

          <svg viewBox="0 0 900 620" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', marginTop: '1.5rem', marginBottom: '2rem' }}>
            <defs>
              <style>{`
                .arch-box { fill: rgba(244, 240, 232, 0.06); stroke: rgba(212, 206, 196, 0.25); stroke-width: 1.5; }
                .arch-label { font-family: 'Playfair Display', serif; font-size: 16px; fill: #f4f0e8; font-weight: 600; }
                .arch-small { font-family: 'DM Mono', monospace; font-size: 11px; fill: #c8a84b; text-transform: uppercase; letter-spacing: 0.08em; }
                .arch-arrow { stroke: rgba(212, 206, 196, 0.4); stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
                .arch-track { stroke: rgba(139, 32, 32, 0.25); stroke-width: 1.5; fill: none; stroke-dasharray: 5,5; }
              `}</style>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="rgba(212, 206, 196, 0.4)" />
              </marker>
            </defs>

            {/* Input Layer */}
            <rect x="20" y="10" width="860" height="80" className="arch-box" rx="4" />
            <text x="450" y="35" className="arch-label" textAnchor="middle">Input Layer: Organizations + Evidence Packages</text>
            <text x="450" y="60" className="arch-small" textAnchor="middle">CSV/API Feeds • Manual Intake • External Data Sources</text>

            {/* Arrow down */}
            <path d="M 450 90 L 450 120" className="arch-arrow" />

            {/* Evidence Framework */}
            <rect x="20" y="120" width="860" height="70" className="arch-box" rx="4" />
            <text x="450" y="145" className="arch-label" textAnchor="middle">Evidence Framework: 8-Tier Source Hierarchy</text>
            <text x="450" y="170" className="arch-small" textAnchor="middle">Primary Sources → Secondary → Grey Literature → AI-Derived</text>

            {/* Arrow down */}
            <path d="M 450 190 L 450 220" className="arch-arrow" />

            {/* Jury Consensus */}
            <rect x="20" y="220" width="860" height="80" className="arch-box" rx="4" />
            <text x="450" y="245" className="arch-label" textAnchor="middle">Multi-Model Jury Consensus (4 Independent Models)</text>
            <text x="100" y="275" className="arch-small" textAnchor="middle">Claude</text>
            <text x="250" y="275" className="arch-small" textAnchor="middle">GPT-4o</text>
            <text x="450" y="275" className="arch-small" textAnchor="middle">Gemini</text>
            <text x="650" y="275" className="arch-small" textAnchor="middle">Llama</text>

            {/* Arrow down */}
            <path d="M 450 300 L 450 330" className="arch-arrow" />

            {/* Parallel Tracks */}
            <text x="20" y="320" className="arch-small">Parallel Scoring Tracks</text>

            {/* Young Track */}
            <rect x="30" y="330" width="260" height="100" className="arch-box" rx="4" />
            <path d="M 160 330 L 160 430" className="arch-track" />
            <text x="160" y="355" className="arch-label" textAnchor="middle" fontSize="14">Young Track</text>
            <text x="160" y="380" className="arch-small" textAnchor="middle">C1-C10 Behavior</text>
            <text x="160" y="400" className="arch-small" textAnchor="middle">Score: 0-10 & 0-100%</text>

            {/* Lifton Track */}
            <rect x="320" y="330" width="260" height="100" className="arch-box" rx="4" />
            <path d="M 450 330 L 450 430" className="arch-track" />
            <text x="450" y="355" className="arch-label" textAnchor="middle" fontSize="14">Lifton Track</text>
            <text x="450" y="380" className="arch-small" textAnchor="middle">C11 Totalism</text>
            <text x="450" y="400" className="arch-small" textAnchor="middle">System Permanence</text>

            {/* Configural Track */}
            <rect x="610" y="330" width="260" height="100" className="arch-box" rx="4" />
            <path d="M 740 330 L 740 430" className="arch-track" />
            <text x="740" y="355" className="arch-label" textAnchor="middle" fontSize="14">Configural Track</text>
            <text x="740" y="380" className="arch-small" textAnchor="middle">Structural Analysis</text>
            <text x="740" y="400" className="arch-small" textAnchor="middle">External Mapping</text>

            {/* Arrow down from all tracks */}
            <path d="M 160 430 L 160 460" className="arch-arrow" />
            <path d="M 450 430 L 450 460" className="arch-arrow" />
            <path d="M 740 430 L 740 460" className="arch-arrow" />

            {/* Human Review Gate */}
            <rect x="20" y="460" width="860" height="70" className="arch-box" rx="4" style={{ stroke: '#8b2020', strokeWidth: 2 }} />
            <text x="450" y="485" className="arch-label" textAnchor="middle">Human Review Gate & Governance</text>
            <text x="450" y="510" className="arch-small" textAnchor="middle">Consensus Validation • Spread Thresholds • Acceptance/Rejection • Audit Trail</text>

            {/* Arrow down */}
            <path d="M 450 530 L 450 560" className="arch-arrow" />

            {/* Output Layer */}
            <rect x="20" y="560" width="860" height="50" className="arch-box" rx="4" style={{ stroke: '#c8a84b', strokeWidth: 2 }} />
            <text x="450" y="580" className="arch-label" textAnchor="middle">Supabase (Source of Truth)</text>
            <text x="450" y="600" className="arch-small" textAnchor="middle">Three Scoring Outputs • Provenance Chain • Validation Metrics • Immutable Score History</text>
          </svg>
        </div>
      </section>

      {/* Component Overview */}
      <section className="section">
        <div className="container--wide">
          <div className="section__label">System Components</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>

            {/* Multi-Model Jury Card */}
            <div className="component-card">
              <h3 className="component-card__title">Multi-Model Jury</h3>
              <p className="component-card__label">Independent Consensus</p>
              <p className="component-card__text">Four independent AI models (Claude, GPT-4o, Gemini, Llama) score the same evidence independently. Jury consensus calculated via mean, median, spread. Models never see each other's outputs, eliminating groupthink.</p>
            </div>

            {/* Evidence Framework Card */}
            <div className="component-card">
              <h3 className="component-card__title">Evidence Framework</h3>
              <p className="component-card__label">8-Tier Hierarchy</p>
              <p className="component-card__text">Not all sources are equal. Evidence classified into 8 tiers from peer-reviewed journals to AI-derived synthesis. Standardized tier assignment ensures methodological consistency across 1000+ organizations.</p>
            </div>

            {/* Dual-Track Scoring Card */}
            <div className="component-card">
              <h3 className="component-card__title">Dual-Track Scoring</h3>
              <p className="component-card__label">Complementary Frameworks</p>
              <p className="component-card__text">Two independent frameworks run in parallel: Young's behavioral indicators (C1-C10) + Lifton's system-level totalism (C11). Divergence between tracks reveals new insights; both provided to users.</p>
            </div>

            {/* Human Review Gate Card */}
            <div className="component-card">
              <h3 className="component-card__title">Human Review Gate</h3>
              <p className="component-card__label">Non-Negotiable Governance</p>
              <p className="component-card__text">All jury proposals require human review before acceptance. Spread thresholds determine routing: 0-5pt strong consensus → accept; 6-20pt → review criteria; &gt;20pt → revise evidence. Preserves human judgment.</p>
            </div>

            {/* Auditability Card */}
            <div className="component-card">
              <h3 className="component-card__title">Complete Auditability</h3>
              <p className="component-card__label">Provenance Chain</p>
              <p className="component-card__text">Every score includes: run_id linking to jury votes, methodology_version, per-model scores, evidence citations, human review decision, timestamp. Score history immutable. Full traceability from decision to evidence.</p>
            </div>

            {/* Validation Metrics Card */}
            <div className="component-card">
              <h3 className="component-card__title">Formal Validation</h3>
              <p className="component-card__label">Research-Grade Metrics</p>
              <p className="component-card__text">Inter-rater reliability calculated via Krippendorff's alpha (≥0.70 threshold), ICC(2,k) correlation, pairwise agreement analysis. All results include ECRA reliability statements for publication readiness.</p>
            </div>

          </div>

          <hr className="rule" />
        </div>
      </section>

      {/* Value for Researchers */}
      <section className="section">
        <div className="container--wide">
          <div className="section__label">Why Researchers Choose This System</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: '0.75rem', color: '#f4f0e8' }}>Rigor Without Single Points of Failure</h3>
              <ul style={{ marginTop: '0.75rem', paddingLeft: '1.5rem', color: '#f4f0e8', fontSize: '0.95rem' }}>
                <li style={{ marginBottom: '0.5rem' }}><strong>Multi-model consensus:</strong> Three independent AI models eliminate single-model bias. Jury spread measures agreement strength; high spread triggers deeper review.</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Evidence-based, not heuristic:</strong> Organizations scored against framework, not calibration anchors. No ceiling effects or systematic inflation.</li>
                <li><strong>Human governance:</strong> Every score passes human review gates. System amplifies human judgment, not replaces it.</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: '0.75rem', color: '#f4f0e8' }}>Transparent & Auditable</h3>
              <ul style={{ marginTop: '0.75rem', paddingLeft: '1.5rem', color: '#f4f0e8', fontSize: '0.95rem' }}>
                <li style={{ marginBottom: '0.5rem' }}><strong>Complete provenance chain:</strong> Trace any score back to evidence sources, jury votes, and human decision.</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Immutable history:</strong> Score history never overwrites; tracks how assessments evolve as new evidence emerges.</li>
                <li><strong>Publication-ready:</strong> Validation metrics (α, ICC) and ECRA statements included; ready for peer review and academic citation.</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: '0.75rem', color: '#f4f0e8' }}>Generalizable Across Domains</h3>
            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.5rem', color: '#f4f0e8', fontSize: '0.95rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Framework-agnostic:</strong> The system architecture is reusable. Swap "Young's 10 criteria" for any other framework; the jury, evidence, governance, and validation machinery stays the same.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Extensible:</strong> Dual-track and configural scoring allow multiple frameworks to run in parallel without conflict.</li>
              <li><strong>Documented evolution:</strong> See how the system improved over six versions; understand the reasoning behind each methodology choice.</li>
            </ul>
          </div>

          <hr className="rule" />
        </div>
      </section>

      {/* Navigation to Modern & Legacy */}
      <section className="section">
        <div className="container--wide">
          <div className="section__label">Explore the System</div>

          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '0.75rem', color: '#f4f0e8' }}>Current System (V4.0+)</h3>
            <p style={{ color: '#a39d95', marginBottom: '1rem', fontSize: '0.95rem' }}>
              Deep dive into modern methodology versions with full technical details, validation results, and trade-offs.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <a href="/research-system/v4-anchor-heuristic" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V4.0: Anchor Heuristic</a>
              <a href="/research-system/v5-0-evidence-jury" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V5.0: Evidence Jury</a>
              <a href="/research-system/v5-1-formal-validation" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V5.1: Validation</a>
              <a href="/research-system/v5-2-deepseek-case-study" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V5.2: Case Study</a>
              <a href="/research-system/v6-0-lifton-framework" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V6.0: Lifton</a>
              <a href="/research-system/v6-1-permanence-aware" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V6.1: Permanence</a>
            </div>
          </div>

          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '0.75rem', color: '#f4f0e8' }}>Historical Evolution (V0-V3)</h3>
            <p style={{ color: '#a39d95', marginBottom: '1rem', fontSize: '0.95rem' }}>
              Understand the system's origins and how it evolved from Young & Reed's framework through manual assessment to automated jury consensus.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="/research-system/v0-young-reed-framework" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V0: Young & Reed</a>
              <a href="/research-system/v1-dual-metric-concept" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V1: Dual-Metric</a>
              <a href="/research-system/v3-streamlit-era" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V3: Streamlit Era</a>
              <a href="/research-system/evolution-timeline" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>Full Timeline</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
