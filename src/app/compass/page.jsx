'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

const TIER_COLORS = {
  'Cult':          '#6b1010',
  'Cult Dynamics': '#8b2020',
  'High Control':  '#7a4a1a',
  'Concerning':    '#7a6a2a',
  'Mildly Culty':  '#4a6a2a',
  'Healthy Group': '#2a6b4a',
};

// Convert -5..+5 axis to SVG coordinate (0..100%)
const toSvg = (val, min = -5, max = 5) =>
  ((val - min) / (max - min)) * 100;

export default function CompassPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, visible: false });

  // For now we use calibration anchors — political scores will be added
  // when political_scores table is populated. Show compass with placeholder positions
  // based on category inference until real data exists.
  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/calibration_anchors?select=id,name,category,composite_score,composite_tier,youngs_score`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    })
      .then(r => r.json())
      .then(data => {
        // Assign approximate political positions based on known calibration anchors
        // These will be replaced by real political_scores data once populated
        const positioned = data.map(org => {
          const positions = {
            'Jonestown / Peoples Temple (Guyana Phase)': { econ: -2, auth: 5 },
            'Aum Shinrikyo (Japan)': { econ: -1, auth: 5 },
            'Chinese Communist Party (Cultural Revolution)': { econ: -5, auth: 5 },
            'Khmer Rouge (Cambodia)': { econ: -5, auth: 5 },
            'Soviet Communist Party (Stalin Era)': { econ: -5, auth: 5 },
            'North Korean Juche State': { econ: -5, auth: 5 },
            'Hitler Youth': { econ: 1, auth: 5 },
            'Nazi Party (NSDAP)': { econ: 1, auth: 5 },
            'Theranos': { econ: 4, auth: 4 },
            'American Eugenics Society': { econ: 3, auth: 3 },
            'Students for a Democratic Society (SDS)': { econ: -4, auth: -2 },
            'Young Patriots Organization': { econ: -3, auth: -1 },
            'Costco': { econ: 2, auth: -1 },
          };
          const pos = positions[org.name] || { econ: null, auth: null };
          return { ...org, econ: pos.econ, auth: pos.auth };
        }).filter(o => o.econ !== null);
        setOrgs(positioned);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const W = 560;
  const H = 560;
  const PAD = 48;
  const INNER = W - PAD * 2;

  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">
            <Link href="/explore" style={{ color: 'var(--gold)' }}>Dataset Explorer</Link>
            {' '}— Political Compass
          </span>
          <h1 className="hero__title animate-up-2">Political<br />Compass</h1>
          <p className="hero__subtitle animate-up-3">
            Organizations plotted by economic axis (Left–Right) and
            authority axis (Libertarian–Authoritarian), colored by
            composite cultiness tier.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3rem', alignItems: 'start' }}>

            {/* Compass SVG */}
            <div style={{ position: 'relative' }}>
              {loading ? (
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--muted)', padding: '4rem 0' }}>
                  Loading compass data...
                </div>
              ) : (
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
                  {/* Background quadrants */}
                  <rect x={PAD} y={PAD} width={INNER/2} height={INNER/2} fill="rgba(139,32,32,0.04)" />
                  <rect x={PAD + INNER/2} y={PAD} width={INNER/2} height={INNER/2} fill="rgba(90,122,58,0.04)" />
                  <rect x={PAD} y={PAD + INNER/2} width={INNER/2} height={INNER/2} fill="rgba(90,122,58,0.04)" />
                  <rect x={PAD + INNER/2} y={PAD + INNER/2} width={INNER/2} height={INNER/2} fill="rgba(139,32,32,0.04)" />

                  {/* Grid lines */}
                  {[-4,-3,-2,-1,1,2,3,4].map(v => {
                    const pct = toSvg(v);
                    const x = PAD + (pct / 100) * INNER;
                    const y = PAD + (pct / 100) * INNER;
                    return (
                      <g key={v}>
                        <line x1={x} y1={PAD} x2={x} y2={PAD + INNER} stroke="rgba(212,206,196,0.06)" strokeWidth="1" />
                        <line x1={PAD} y1={y} x2={PAD + INNER} y2={y} stroke="rgba(212,206,196,0.06)" strokeWidth="1" />
                      </g>
                    );
                  })}

                  {/* Axes */}
                  <line x1={PAD} y1={H/2} x2={PAD + INNER} y2={H/2} stroke="rgba(212,206,196,0.25)" strokeWidth="1.5" />
                  <line x1={W/2} y1={PAD} x2={W/2} y2={PAD + INNER} stroke="rgba(212,206,196,0.25)" strokeWidth="1.5" />

                  {/* Axis labels */}
                  <text x={PAD - 4} y={H/2 + 4} textAnchor="end" fill="rgba(212,206,196,0.4)" fontSize="10" fontFamily="monospace">◀ Left</text>
                  <text x={PAD + INNER + 4} y={H/2 + 4} textAnchor="start" fill="rgba(212,206,196,0.4)" fontSize="10" fontFamily="monospace">Right ▶</text>
                  <text x={W/2} y={PAD - 8} textAnchor="middle" fill="rgba(212,206,196,0.4)" fontSize="10" fontFamily="monospace">▲ Auth</text>
                  <text x={W/2} y={PAD + INNER + 18} textAnchor="middle" fill="rgba(212,206,196,0.4)" fontSize="10" fontFamily="monospace">▼ Lib</text>

                  {/* Quadrant labels */}
                  <text x={PAD + 8} y={PAD + 18} fill="rgba(212,206,196,0.18)" fontSize="9" fontFamily="monospace">AUTH LEFT</text>
                  <text x={PAD + INNER - 8} y={PAD + 18} textAnchor="end" fill="rgba(212,206,196,0.18)" fontSize="9" fontFamily="monospace">AUTH RIGHT</text>
                  <text x={PAD + 8} y={PAD + INNER - 8} fill="rgba(212,206,196,0.18)" fontSize="9" fontFamily="monospace">LIB LEFT</text>
                  <text x={PAD + INNER - 8} y={PAD + INNER - 8} textAnchor="end" fill="rgba(212,206,196,0.18)" fontSize="9" fontFamily="monospace">LIB RIGHT</text>

                  {/* Organization dots */}
                  {orgs.map(org => {
                    const cx = PAD + (toSvg(org.econ) / 100) * INNER;
                    const cy = PAD + (toSvg(-org.auth, -5, 5) / 100) * INNER; // invert Y
                    const color = TIER_COLORS[org.composite_tier] || '#555';
                    const isHovered = hovered?.id === org.id;
                    return (
                      <g key={org.id}>
                        {isHovered && (
                          <circle cx={cx} cy={cy} r={14} fill={color} opacity={0.2} />
                        )}
                        <circle
                          cx={cx} cy={cy}
                          r={isHovered ? 8 : 6}
                          fill={color}
                          stroke={isHovered ? 'var(--gold)' : 'rgba(26,23,20,0.6)'}
                          strokeWidth={isHovered ? 2 : 1}
                          style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                          onMouseEnter={(e) => {
                            setHovered(org);
                            const rect = e.target.closest('svg').getBoundingClientRect();
                            setTooltip({ x: cx, y: cy, visible: true });
                          }}
                          onMouseLeave={() => { setHovered(null); setTooltip(t => ({ ...t, visible: false })); }}
                        />
                      </g>
                    );
                  })}

                  {/* Tooltip */}
                  {hovered && tooltip.visible && (() => {
                    const tx = tooltip.x + 10;
                    const ty = Math.max(PAD + 20, tooltip.y - 30);
                    const name = hovered.name.length > 32 ? hovered.name.slice(0, 30) + '…' : hovered.name;
                    return (
                      <g>
                        <rect x={tx - 4} y={ty - 14} width={Math.max(name.length * 6.2 + 8, 120)} height={44}
                          fill="rgba(26,23,20,0.95)" stroke="rgba(200,168,75,0.4)" strokeWidth="1" rx="1" />
                        <text x={tx} y={ty} fill="#faf8f3" fontSize="11" fontFamily="monospace" fontWeight="600">{name}</text>
                        <text x={tx} y={ty + 15} fill="rgba(212,206,196,0.6)" fontSize="9" fontFamily="monospace">
                          {hovered.composite_tier} · {parseFloat(hovered.composite_score).toFixed(1)}%
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              )}
            </div>

            {/* Legend + selected detail */}
            <div style={{ minWidth: '220px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>
                Tier Legend
              </div>
              {Object.entries(TIER_COLORS).map(([tier, color]) => (
                <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--muted)' }}>{tier}</span>
                </div>
              ))}

              {hovered && (
                <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(244,240,232,0.03)', border: '1px solid rgba(212,206,196,0.15)' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.4rem' }}>
                    {hovered.name}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                    {hovered.category}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--muted)' }}>Composite</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--gold)' }}>
                        {parseFloat(hovered.composite_score).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--muted)' }}>Young's</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--paper)' }}>
                        {hovered.youngs_score}/10
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(244,240,232,0.02)', border: '1px solid rgba(212,206,196,0.1)' }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                  Political positions are scored independently from cultiness scores on two axes: Economic (−5 Far Left to +5 Far Right) and Authority (−5 Libertarian to +5 Authoritarian). Scores reflect documented institutional behavior, not partisan affiliation.
                </p>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <Link href="/explore" className="btn-secondary" style={{ display: 'block', textAlign: 'center', fontSize: '0.7rem' }}>
                  ← Back to Explorer
                </Link>
              </div>
            </div>
          </div>

          {/* Note about data */}
          <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(244,240,232,0.02)', border: '1px solid rgba(212,206,196,0.1)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.06em', color: 'var(--muted)', margin: 0 }}>
              <span style={{ color: 'var(--gold)' }}>Note:</span>{' '}
              Political compass positions currently display calibration anchors only. Full dataset political scoring (370 organizations) is in progress and will populate this compass as scores are reviewed and accepted. The r=0.703 correlation between authority-axis position and composite cultiness score is documented in the{' '}
              <Link href="/cultiness/findings" style={{ color: 'var(--gold)' }}>findings</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
