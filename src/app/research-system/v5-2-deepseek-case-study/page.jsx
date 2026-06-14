export const metadata = {
  title: 'V5.2: Deepseek Case Study | Research System',
  description: 'Documentation of the V5.2 Deepseek experiment: why it was tested, why it failed, and lessons learned.',
};

export default function V52Page() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow"><a href="/research-system">Research System Architecture</a></span>
          <h1 className="hero__title" style={{ color: '#8b2020' }}>V5.2: The Deepseek Experiment</h1>
          <p className="hero__subtitle">A deliberate test of five-model jury consensus. Why it was attempted, why it failed, and what we learned.</p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Case Study Overview</div>
          <div className="pull-quote">
            <p className="pull-quote__text">V5.2 attempted to extend the four-model jury (V5.1) by adding Deepseek. The hypothesis was that a fifth diverse model would improve consensus. Testing revealed this assumption was incorrect, and the experiment was rejected. This case study documents why methodological rejection is sometimes the right decision.</p>
          </div>
          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Why Test V5.2?</div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: '1rem', color: '#f4f0e8' }}>Hypothesis</h3>
          <p>If jury consensus improves with diversity, adding a fifth model (Deepseek) should further reduce jury spread and increase consensus_strong frequency.</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Model Selection Rationale</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li><strong>Deepseek:</strong> Open-weights Chinese model with strong reasoning performance</li>
            <li><strong>Diversification goal:</strong> Reduce Western model concentration</li>
            <li><strong>Cost consideration:</strong> Available via OpenRouter at lower cost</li>
          </ul>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Experimental Results</div>

          <table style={{ width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(212, 206, 196, 0.25)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase', fontWeight: 600 }}>Metric</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase', fontWeight: 600 }}>V5.1 (4 models)</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase', fontWeight: 600 }}>V5.2 (5 models)</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase', fontWeight: 600 }}>Impact</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)', background: 'rgba(139, 32, 32, 0.04)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#f4f0e8' }}>Avg Jury Spread</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>6.2 pts</td>
                <td style={{ padding: '1rem', color: '#8b2020', fontWeight: 'bold' }}>8.7 pts ↑</td>
                <td style={{ padding: '1rem', color: '#8b2020', fontWeight: 'bold' }}>WORSE</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)', background: 'rgba(139, 32, 32, 0.04)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#f4f0e8' }}>Consensus Strong %</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>48%</td>
                <td style={{ padding: '1rem', color: '#8b2020', fontWeight: 'bold' }}>28% ↓</td>
                <td style={{ padding: '1rem', color: '#8b2020', fontWeight: 'bold' }}>WORSE</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#f4f0e8' }}>Avg Krippendorff's α</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>0.74</td>
                <td style={{ padding: '1rem', color: '#8b2020', fontWeight: 'bold' }}>0.61 ↓</td>
                <td style={{ padding: '1rem', color: '#8b2020', fontWeight: 'bold' }}>Below threshold</td>
              </tr>
            </tbody>
          </table>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Why V5.2 Failed</div>

          <div className="pull-quote">
            <p className="pull-quote__text">V5.2 was rejected because jury spread increased by 40%, consensus strength decreased by 42%, and Krippendorff's α fell below publication threshold (0.61 &lt; 0.70). Deepseek was a systematic outlier on 62% of criteria. Adding a model that worsens consensus is worse than no additional model.</p>
          </div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Why This Was the Right Call</h3>
          <p>Continuing with V5.1 rather than forcing V5.2 into production exemplifies methodological rigor. Not every idea improves the system. Testing and rejection is preferable to adoption of sub-optimal changes.</p>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Lessons Learned</div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: '1rem', color: '#f4f0e8' }}>For Model Selection</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li><strong>Diversity ≠ Improvement:</strong> More models doesn't always improve consensus. Only adopt models that maintain or improve IRR metrics.</li>
            <li><strong>Pilot first:</strong> Always test on a representative sample before committing to production.</li>
            <li><strong>Watch for systematic bias:</strong> If a new model is consistently higher or lower, investigate root cause before integration.</li>
          </ul>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>For Future Methodology Changes</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '2rem', color: '#f4f0e8' }}>
            <li><strong>Define success criteria in advance:</strong> What metrics must a new approach beat?</li>
            <li><strong>Test against multiple criteria:</strong> Not just one; use spread, consensus_strong, α, and expert judgment.</li>
            <li><strong>Document rejections:</strong> Prevent re-testing of failed approaches.</li>
            <li><strong>Accept incrementalism:</strong> Sometimes the best progress is staying with a proven system.</li>
          </ul>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <a href="/research-system/v5-1-formal-validation" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem' }}>
              ← Back to V5.1 (which was retained)
            </a>
            <a href="/research-system/v6-0-lifton-framework" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem' }}>
              Forward to V6.0 (the next approach) →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
