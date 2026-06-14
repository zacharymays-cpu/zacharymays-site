export const metadata = {
  title: 'V6.1: Permanence-Aware | Research System',
  description: 'Separates intensity from system permanence. Proposed refinement.',
};

export default function V61Page() {
  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow"><a href="/research-system">Research System Architecture</a></span>
          <h1 className="hero__title">V6.1: Permanence-Aware Totalism</h1>
          <p className="hero__subtitle">Separates intensity of totalizing behavior from system permanence design. Proposed refinement ready for review.</p>
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Problem V6.0 Missed</div>
          <div className="pull-quote">
            <p className="pull-quote__text">V6.0 conflates totalizing intensity with system permanence. US Marines score 7.96 (penalized for temporary structure) but jury detects 9.7 intensity. CIA units are similarly underscored despite high totalism. V6.1 separates these components.</p>
          </div>
          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Three-Component Scoring</div>

          <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', marginTop: '1.5rem', marginBottom: '2rem' }}>
            <defs>
              <style>{`
                .box { fill: rgba(244, 240, 232, 0.06); stroke: rgba(212, 206, 196, 0.25); stroke-width: 1.5; }
                .label { font-family: 'Playfair Display', serif; font-size: 16px; fill: #f4f0e8; font-weight: 600; }
                .op { font-size: 20px; fill: #c8a84b; font-weight: bold; }
              `}</style>
            </defs>

            <rect x="50" y="20" width="180" height="80" className="box" rx="4" />
            <text x="140" y="50" className="label" textAnchor="middle">Intensity Score</text>
            <text x="140" y="75" style={{ fontSize: '12px', fill: '#6b6560', textAnchor: 'middle' }}>(1-10)</text>

            <text x="240" y="70" className="op">×</text>

            <rect x="280" y="20" width="180" height="80" className="box" rx="4" />
            <text x="370" y="50" className="label" textAnchor="middle">Permanence</text>
            <text x="370" y="75" style={{ fontSize: '12px', fill: '#6b6560', textAnchor: 'middle' }}>Multiplier (0.75-1.0)</text>

            <text x="470" y="70" className="op">+</text>

            <rect x="50" y="120" width="410" height="80" className="box" rx="4" />
            <text x="255" y="150" className="label" textAnchor="middle">Behavioral Durability Adjustment</text>
            <text x="255" y="175" style={{ fontSize: '12px', fill: '#6b6560', textAnchor: 'middle' }}>(-0.30 to +0.50 based on post-exit persistence)</text>

            <text x="280" y="240" style={{ fontSize: '14px', fill: '#c8a84b', fontWeight: 'bold', textAnchor: 'middle' }}>=</text>

            <rect x="50" y="240" width="410" height="50" className="box" rx="4" style={{ stroke: '#8b2020', strokeWidth: 2 }} />
            <text x="255" y="272" className="label" textAnchor="middle" fill="#f4f0e8">Final V6.1 Score (0-10)</text>
          </svg>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Component Definitions</div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: '1rem', color: '#f4f0e8' }}>Intensity Score (1-10)</h3>
          <p>Presence and integration of Lifton's 10 criteria. How totalizing is the environment while inside?</p>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Permanence Multiplier (0.75-1.0)</h3>
          <div style={{ background: 'rgba(244, 240, 232, 0.04)', border: '1px solid rgba(212, 206, 196, 0.15)', padding: '1.5rem', marginTop: '1rem', marginBottom: '2rem' }}>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#6b6560', margin: 0 }}>
              1.0 = Permanent system (lifetime commitment expected)<br/>
              0.9 = Temporary with durable effects (college years but 10-year identity impact)<br/>
              0.75 = Brief exposure (weeks or months)<br/>
            </p>
          </div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem', color: '#f4f0e8' }}>Behavioral Durability (-0.30 to +0.50)</h3>
          <p>Empirical post-exit persistence from longitudinal studies. How long do behavioral/psychological effects persist after exit?</p>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Examples</div>

          <table style={{ width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase' }}>Organization</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>Intensity</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>Permanence</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>Durability</td>
                <td style={{ padding: '1rem', color: '#f4f0e8', fontWeight: 'bold' }}>V6.1 Score</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b' }}>Scientology</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>10.0</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>1.0</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>+0.0</td>
                <td style={{ padding: '1rem', color: '#f4f0e8', fontWeight: 'bold' }}>10.0</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b' }}>US Marines</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>9.7</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>0.9</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>+0.43</td>
                <td style={{ padding: '1rem', color: '#f4f0e8', fontWeight: 'bold' }}>9.03</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b' }}>CIA Cells</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>9.2</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>0.85</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>+0.42</td>
                <td style={{ padding: '1rem', color: '#f4f0e8', fontWeight: 'bold' }}>8.84</td>
              </tr>
            </tbody>
          </table>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div className="section__label">Status</div>

          <table style={{ width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase' }}>Status</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>Proposed / Ready for PR review</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(212, 206, 196, 0.15)' }}>
                <td style={{ padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: '#c8a84b', textTransform: 'uppercase' }}>Next Step</td>
                <td style={{ padding: '1rem', color: '#f4f0e8' }}>Veteran affairs domain expert review</td>
              </tr>
            </tbody>
          </table>

          <hr className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container--narrow">
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <a href="/research-system/v6-0-lifton-framework" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem' }}>
              ← See V6.0's dual-track approach
            </a>
            <a href="/research-system/evolution-timeline" style={{ color: '#f4f0e8', textDecoration: 'none', borderBottom: '1px solid #c8a84b', paddingBottom: '0.25rem' }}>
              View full evolution narrative →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
