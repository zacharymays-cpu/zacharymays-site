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
          <h1 className="hero__title hero__title--compact">An AI-Driven Evaluation Framework</h1>
          <p className="hero__subtitle hero__subtitle--compact">
            How a rigorous, multi-model system evolved through systematic iteration and principled decision-making
          </p>
        </div>
      </section>

      {/* Overview Section */}
      <section className="section">
        <div className="container--wide">
          <div className="section__label">What This System Does</div>
          <p>
            This documentation explains a reusable framework for AI-driven research evaluation scoring methodologies. Rather than domain-specific, this system is designed to work across any research domain requiring: consistent evidence assessment, multi-model consensus, human review governance, and rigorous validation.
          </p>
          <p>
            <strong>Current production system (V5.0 + V6.0):</strong> Generates three scoring outputs simultaneously for each organization:
          </p>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li><strong>Young's Original Score:</strong> 0-10 binary checklist (Young & Reed's 10 criteria)</li>
            <li><strong>YM Composite Score:</strong> 0-100% formula-based (evidence-weighted across all criteria)</li>
            <li><strong>Lifton's Totalism Score:</strong> System-level analysis of ideological totalism (C11 criterion)</li>
          </ul>
          <p style={{ marginTop: '1.5rem' }}>
            All three are generated in parallel by the jury consensus process. Users receive all three perspectives on each organization. These scoring methodologies describe HOW organizations are evaluated, not changes to previously published scores or organizational records.
          </p>
          <p>
            The system evolved through six versions (V4.0 → V6.1) plus one deliberate rejection (V5.2). Each iteration solved specific problems and introduced new capabilities. This documentation is for researchers, academics, and practitioners interested in building or understanding similar evaluation systems.
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

      {/* System Architecture Section */}
      <section className="section">
        <div className="container--wide">
          <div className="section__label">System Architecture: How It Works</div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '1rem', marginTop: '1.5rem', color: '#f4f0e8' }}>1. Jury Consensus Mechanism</h3>
          <p style={{ color: '#a39d95', marginBottom: '0.75rem' }}>
            Every score is generated by independent evaluation from four AI models (Claude, GPT-4o, Gemini, Llama). Models score the same evidence independently without seeing each other's scores, eliminating groupthink and single-model bias. The jury mean becomes the proposed score; jury spread (max - min) measures agreement strength.
          </p>
          <ul style={{ paddingLeft: '2rem', color: '#a39d95', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            <li><strong>0–2 point spread:</strong> High confidence; immediate acceptance</li>
            <li><strong>3–5 point spread:</strong> Moderate confidence; accepted with validation flags</li>
            <li><strong>6–20 point spread:</strong> Low confidence; triggered evidence re-review by human</li>
            <li><strong>&gt;20 point spread:</strong> Model disagreement signals; evidence re-briefing required</li>
          </ul>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '1rem', marginTop: '1.5rem', color: '#f4f0e8' }}>2. Evidence Framework (8-Tier Hierarchy)</h3>
          <p style={{ color: '#a39d95', marginBottom: '0.75rem' }}>
            Not all sources are weighted equally. Evidence is classified into eight tiers from peer-reviewed journals to AI-derived synthesis. Each tier has calibrated weight in jury scoring. This prevents unsourced claims from inflating scores.
          </p>
          <ul style={{ paddingLeft: '2rem', color: '#a39d95', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            <li>Tier 1–2: Peer-reviewed scholarship, government records, court filings</li>
            <li>Tier 3–4: Investigative journalism, books, institutional documentation</li>
            <li>Tier 5–6: News reports, interviews, documentary evidence</li>
            <li>Tier 7–8: Grey literature, social media, AI-derived synthesis</li>
          </ul>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '1rem', marginTop: '1.5rem', color: '#f4f0e8' }}>3. Human Review Gate (Non-Negotiable Governance)</h3>
          <p style={{ color: '#a39d95', marginBottom: '0.75rem' }}>
            <strong>No score enters the dataset without human review.</strong> AI proposes; humans decide. The review gate checks:
          </p>
          <ul style={{ paddingLeft: '2rem', color: '#a39d95', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            <li>Does the score align with the body text evidence?</li>
            <li>Are N/A designations structurally justified?</li>
            <li>Do cited sources actually support the claims?</li>
            <li>Is the assessment consistent across the ideological spectrum?</li>
            <li>Has jury spread triggered additional evidence review?</li>
          </ul>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '1rem', marginTop: '1.5rem', color: '#f4f0e8' }}>4. Immutable Audit Trail &amp; Provenance Chain</h3>
          <p style={{ color: '#a39d95', marginBottom: '0.75rem' }}>
            Every score includes complete provenance tracking:
          </p>
          <ul style={{ paddingLeft: '2rem', color: '#a39d95', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            <li><strong>run_id:</strong> Links to the specific jury evaluation run</li>
            <li><strong>per_model_scores:</strong> Individual scores from each of the four models</li>
            <li><strong>jury_spread:</strong> Consensus confidence metric</li>
            <li><strong>methodology_version:</strong> Which version (V5.0, V6.0, etc.) generated the score</li>
            <li><strong>evidence_citations:</strong> Complete source list with tier classification</li>
            <li><strong>human_review_decision:</strong> Accept, modify, or reject</li>
            <li><strong>timestamp:</strong> When the score was finalized</li>
            <li><strong>score_history:</strong> All previous versions preserved (immutable); users can see how assessment evolved</li>
          </ul>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '1rem', marginTop: '1.5rem', color: '#f4f0e8' }}>5. Logging &amp; Change History</h3>
          <p style={{ color: '#a39d95', marginBottom: '0.75rem' }}>
            The system logs every change at the database level:
          </p>
          <ul style={{ paddingLeft: '2rem', color: '#a39d95', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            <li><strong>Score modifications:</strong> Old score → new score, with timestamp and reason</li>
            <li><strong>Evidence updates:</strong> Which sources were added/removed and why</li>
            <li><strong>N/A rule changes:</strong> When criteria are marked as inapplicable and justification</li>
            <li><strong>Jury re-runs:</strong> When jury was asked to re-evaluate due to spread/evidence questions</li>
            <li><strong>Human review actions:</strong> Accept/modify decisions recorded with reviewer identifier</li>
            <li><strong>Methodology version bumps:</strong> When an org was re-scored under new methodology version</li>
          </ul>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '1rem', marginTop: '1.5rem', color: '#f4f0e8' }}>6. Formal Validation Metrics</h3>
          <p style={{ color: '#a39d95', marginBottom: '0.75rem' }}>
            Every dataset release includes inter-rater reliability statistics:
          </p>
          <ul style={{ paddingLeft: '2rem', color: '#a39d95', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            <li><strong>Krippendorff's alpha (≥0.70 threshold):</strong> Measures agreement strength across the four models</li>
            <li><strong>ICC(2,k) correlation:</strong> Intraclass correlation for intensity scores</li>
            <li><strong>Pairwise agreement:</strong> How often any two models agreed within ±2 points</li>
            <li><strong>ECRA statements:</strong> Explicit reliability claims suitable for academic publication</li>
          </ul>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '1rem', marginTop: '1.5rem', color: '#f4f0e8' }}>7. Why This Architecture Matters</h3>
          <p style={{ color: '#a39d95', marginBottom: '0.75rem' }}>
            <strong>Auditability:</strong> Every score is traceable to evidence and decision-makers. This enables peer review, independent verification, and publication in peer-reviewed venues.
          </p>
          <p style={{ color: '#a39d95', marginBottom: '0.75rem' }}>
            <strong>Reproducibility:</strong> Jury consensus is documented. Others can examine whether the models agreed, whether evidence tier was appropriate, and whether human review was applied fairly.
          </p>
          <p style={{ color: '#a39d95', marginBottom: '0.75rem' }}>
            <strong>Immutability:</strong> Score history preserves old versions. If methodology changes, past scores are not overwritten—they're preserved for comparison and back-analysis.
          </p>
          <p style={{ color: '#a39d95', marginBottom: '1.5rem' }}>
            <strong>Generalizability:</strong> This architecture is domain-agnostic. The same system can evaluate organizations, policies, research claims, or any domain requiring evidence-based consensus scoring.
          </p>

          <hr className="rule" />
        </div>
      </section>

      {/* Methodology Pages Grid */}
      <section className="section">
        <div className="container--wide">
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
        <div className="container--wide">
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
