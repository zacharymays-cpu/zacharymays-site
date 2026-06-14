export const metadata = {
  title: 'Evolution Timeline | Research System',
  description: 'Chronological narrative of the AI-driven evaluation framework evolution from V4.0 through V6.1.',
};

export default function EvolutionTimelinePage() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow"><a href="/research-system">Research System Architecture</a></span>
          <h1 className="hero__title">Evolution Timeline</h1>
          <p className="hero__subtitle">How a research evaluation system evolved through systematic iteration, testing, and principled rejection.</p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">The Journey</div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>V4.0: Single-Model Anchor Heuristic</h3>
          <p><strong>Problem solved:</strong> Establish first systematic scoring approach.</p>
          <p><strong>Innovation:</strong> Calibration exemplars injected into prompts to anchor scoring range.</p>
          <p><strong>Limitation:</strong> Anchor overcalibration (~15-20pt ceiling), single-model bias, no evidence provenance.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>V5.0: Evidence-Based Multi-Model Jury</h3>
          <p><strong>Problem solved:</strong> V4.0's anchor bias and single-model limitations.</p>
          <p><strong>Innovation:</strong> Three independent models (Claude, GPT-4o, Gemini) scoring evidence-weighted packages. Jury consensus with formal spread thresholds.</p>
          <p><strong>Key decision:</strong> Human review gate is non-negotiable. ≥2/3 jury required for acceptance.</p>
          <p><strong>Scoring outputs (generated in parallel):</strong> Young's Original Score (0-10 binary) + Composite Score (0-100% formula). Both provided for each organization.</p>
          <p><strong>Adoption:</strong> 2026-06-01. 565+ organizations scored with V5.0 provenance.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>V5.1: Formal Validation Metrics</h3>
          <p><strong>Problem solved:</strong> Lack of formal inter-rater reliability (IRR) metrics for academic credibility.</p>
          <p><strong>Innovation:</strong> Added Llama (fourth model, open-weights). Formal Krippendorff's alpha and ICC(2,k) calculations. ECRA statements on all results.</p>
          <p><strong>Status:</strong> Pilot phase. Awaiting calibration audit before publication.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>V5.2: The Deepseek Experiment (Rejected)</h3>
          <p><strong>Problem attempted to solve:</strong> Could we improve consensus with a fifth diverse model?</p>
          <p><strong>Hypothesis:</strong> Deepseek (Chinese, open-weights) would add methodological diversity and improve jury agreement.</p>
          <p><strong>Results:</strong> Jury spread increased 40%, consensus dropped 42%, Krippendorff's α fell to 0.61 (below 0.70 threshold).</p>
          <p><strong>Key lesson:</strong> Not all diversity improves consensus. Systematic rejection is sometimes the right decision. Deepseek was a consistent outlier, not a productive addition.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>V6.0: Framework Extension (Lifton Totalism)</h3>
          <p><strong>Problem solved:</strong> V5 only covered Young & Reed's 10 criteria. Need complementary framework for totalism.</p>
          <p><strong>Innovation:</strong> Dual-track system. Young track (C1-C10) + Lifton track (C11 totalism). Configural (non-compensatory) scoring combining both signals.</p>
          <p><strong>Scoring outputs (generated in parallel):</strong> Young's Original Score (0-10 binary) + Composite Score (0-100%) + Lifton's Totalism Score (0-10). Three perspectives provided for each organization.</p>
          <p><strong>Validation:</strong> Krippendorff's α = 0.81 (≥0.80 threshold met). Young's YCDI concordance r = 0.78 (p &lt; 0.001).</p>
          <p><strong>Adoption:</strong> 2026-06-12. Production-ready. 536+ organizations fully scored.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>V6.1: Permanence-Aware Refinement</h3>
          <p><strong>Problem solved:</strong> V6.0 conflates totalizing intensity with system permanence. US Marines penalized (temporary structure) despite high intensity (9.7).</p>
          <p><strong>Innovation:</strong> Three-component scoring: Intensity (1-10) × Permanence Multiplier (0.75-1.0) + Behavioral Durability Adjustment (-0.30 to +0.50).</p>
          <p><strong>Status:</strong> Proposed. Ready for PR review. Awaiting veteran affairs domain expert input.</p>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Design Philosophy</div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: '1rem', color: '#f4f0e8' }}>Core Principles</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li><strong>Rigor &gt; Speed:</strong> Each version prioritizes methodological validity over rapid deployment.</li>
            <li><strong>Transparency &gt; Elegance:</strong> Document decisions, rejections, and trade-offs openly. Governance is visible.</li>
            <li><strong>Auditability &gt; Automation:</strong> Human review gate is preserved even as jury complexity increases.</li>
            <li><strong>Generalizability &gt; Domain-Specificity:</strong> System architecture is reusable across research domains.</li>
          </ul>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Key Decisions</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li><strong>Multi-model &gt; Single-model:</strong> Jury consensus reduces single-model bias. But diversity must improve metrics, not worsen them (V5.2 rejection).</li>
            <li><strong>Evidence tiers are essential:</strong> Not all sources are equal. 8-tier hierarchy ensures methodological rigor.</li>
            <li><strong>Human review is non-negotiable:</strong> No fully automated scoring. Governance gates preserve accountability.</li>
            <li><strong>Formal metrics enable publication:</strong> Krippendorff's alpha, ICC, ECRA statements transform jury scoring into publishable research.</li>
            <li><strong>Framework complementarity works:</strong> Young + Lifton dual-track outperforms single framework. Separate components reveal nuance single metrics miss.</li>
          </ul>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Lessons for Future Methodology Work</div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: '1rem', color: '#f4f0e8' }}>Before Testing</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li>Define success criteria in advance (e.g., α ≥ 0.70, jury spread must not increase).</li>
            <li>Pilot on representative sample (≥50 organizations) before committing to production.</li>
            <li>Measure against multiple dimensions, not just one metric.</li>
          </ul>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>If Results Are Negative</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li>Reject decisively and document why (like V5.2).</li>
            <li>Don't force adoption for cosmetic reasons.</li>
            <li>Systematic outliers are warning signs, not acceptable diversity.</li>
          </ul>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Incremental vs. Revolutionary</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li>Small improvements (V5.0 → V5.1) are valid.</li>
            <li>Complementary frameworks (V5 → V6 adding Lifton) are valid.</li>
            <li>Refining separable components (V6.0 → V6.1) is valid.</li>
            <li>But diversification for its own sake (V5.2) is not.</li>
          </ul>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ fontSize: '0.95rem', color: '#6b6560' }}>
              Each methodology is documented separately for deep-dive reference:
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <a href="/research-system/v4-anchor-heuristic" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V4.0</a>
              <a href="/research-system/v5-0-evidence-jury" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V5.0</a>
              <a href="/research-system/v5-1-formal-validation" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V5.1</a>
              <a href="/research-system/v5-2-deepseek-case-study" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V5.2 Case Study</a>
              <a href="/research-system/v6-0-lifton-framework" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V6.0</a>
              <a href="/research-system/v6-1-permanence-aware" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem', fontSize: '0.9rem' }}>V6.1</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
