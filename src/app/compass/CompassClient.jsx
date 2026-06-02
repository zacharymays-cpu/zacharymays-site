'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';

const TIER_COLORS = {
  'Cult':          '#9b1010',
  'Cult Dynamics': '#b83030',
  'High Control':  '#a06020',
  'Concerning':    '#8a7830',
  'Mildly Culty':  '#5a8030',
  'Healthy Group': '#2a8a50',
};

const TIERS = ['Cult','Cult Dynamics','High Control','Concerning','Mildly Culty','Healthy Group'];

const toSvgPct = (val, min=-5, max=5) => ((val - min) / (max - min)) * 100;

export default function CompassClient({ orgs = [] }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tierFilter, setTierFilter] = useState([]);
  const [svgSize, setSvgSize] = useState(560);
  const containerRef = useRef(null);

  // Responsive SVG size
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setSvgSize(Math.min(w, 560));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const filtered = useMemo(() =>
    tierFilter.length ? orgs.filter(o => tierFilter.includes(o.composite_tier)) : orgs,
    [orgs, tierFilter]
  );

  const toggle = (tier) =>
    setTierFilter(f => f.includes(tier) ? f.filter(t => t !== tier) : [...f, tier]);

  const W = svgSize;
  const H = svgSize;
  const PAD = 44;
  const INNER = W - PAD * 2;

  const cx = (econ) => PAD + (toSvgPct(econ) / 100) * INNER;
  const cy = (auth) => PAD + (toSvgPct(-auth) / 100) * INNER; // invert Y axis

  // Tier counts for legend
  const tierCounts = useMemo(() => {
    const counts = {};
    orgs.forEach(o => { counts[o.composite_tier] = (counts[o.composite_tier]||0)+1; });
    return counts;
  }, [orgs]);

  return (
    <>
      <section className="hero">
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">
            <Link href="/explore" style={{color:'var(--gold)'}}>Dataset Explorer</Link>
            {' '}— Political Compass
          </span>
          <h1 className="hero__title animate-up-2">Political<br />Compass</h1>
          <p className="hero__subtitle animate-up-3">
            {orgs.length} organizations plotted by economic axis (Left ↔ Right)
            and authority axis (Libertarian ↕ Authoritarian), colored by composite cultiness tier.
            The r=0.703 correlation between authority-axis position and composite score is visible in the data.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{display:'grid',gridTemplateColumns:'1fr 200px',gap:'2rem',alignItems:'start'}}>

            {/* SVG Compass */}
            <div ref={containerRef}>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                style={{width:'100%',maxWidth:W,display:'block',cursor:'crosshair'}}
                onClick={() => { if(!hovered) setSelected(null); }}
              >
                {/* Quadrant backgrounds */}
                <rect x={PAD} y={PAD} width={INNER/2} height={INNER/2} fill="rgba(139,32,32,0.05)"/>
                <rect x={PAD+INNER/2} y={PAD} width={INNER/2} height={INNER/2} fill="rgba(120,100,30,0.05)"/>
                <rect x={PAD} y={PAD+INNER/2} width={INNER/2} height={INNER/2} fill="rgba(42,107,74,0.05)"/>
                <rect x={PAD+INNER/2} y={PAD+INNER/2} width={INNER/2} height={INNER/2} fill="rgba(42,107,74,0.04)"/>

                {/* Grid lines */}
                {[-4,-3,-2,-1,1,2,3,4].map(v => {
                  const px = cx(v), py = cy(v);
                  return (
                    <g key={v}>
                      <line x1={px} y1={PAD} x2={px} y2={PAD+INNER} stroke="rgba(212,206,196,0.05)" strokeWidth="1"/>
                      <line x1={PAD} y1={py} x2={PAD+INNER} y2={py} stroke="rgba(212,206,196,0.05)" strokeWidth="1"/>
                    </g>
                  );
                })}

                {/* Axes */}
                <line x1={PAD} y1={H/2} x2={PAD+INNER} y2={H/2} stroke="rgba(212,206,196,0.3)" strokeWidth="1.5"/>
                <line x1={W/2} y1={PAD} x2={W/2} y2={PAD+INNER} stroke="rgba(212,206,196,0.3)" strokeWidth="1.5"/>

                {/* Axis labels */}
                <text x={PAD+4} y={H/2-6} fill="rgba(212,206,196,0.4)" fontSize={svgSize < 400 ? 8 : 10} fontFamily="monospace">◀ Left</text>
                <text x={PAD+INNER-4} y={H/2-6} textAnchor="end" fill="rgba(212,206,196,0.4)" fontSize={svgSize < 400 ? 8 : 10} fontFamily="monospace">Right ▶</text>
                <text x={W/2} y={PAD-6} textAnchor="middle" fill="rgba(212,206,196,0.4)" fontSize={svgSize < 400 ? 8 : 10} fontFamily="monospace">▲ Auth</text>
                <text x={W/2} y={PAD+INNER+16} textAnchor="middle" fill="rgba(212,206,196,0.4)" fontSize={svgSize < 400 ? 8 : 10} fontFamily="monospace">▼ Lib</text>

                {/* Quadrant labels */}
                <text x={PAD+6} y={PAD+16} fill="rgba(212,206,196,0.15)" fontSize={svgSize < 400 ? 7 : 9} fontFamily="monospace">AUTH LEFT</text>
                <text x={PAD+INNER-6} y={PAD+16} textAnchor="end" fill="rgba(212,206,196,0.15)" fontSize={svgSize < 400 ? 7 : 9} fontFamily="monospace">AUTH RIGHT</text>
                <text x={PAD+6} y={PAD+INNER-6} fill="rgba(212,206,196,0.15)" fontSize={svgSize < 400 ? 7 : 9} fontFamily="monospace">LIB LEFT</text>
                <text x={PAD+INNER-6} y={PAD+INNER-6} textAnchor="end" fill="rgba(212,206,196,0.15)" fontSize={svgSize < 400 ? 7 : 9} fontFamily="monospace">LIB RIGHT</text>

                {/* Organization dots */}
                {filtered.map((org, i) => {
                  const x = cx(org.econ);
                  const y = cy(org.auth);
                  const color = TIER_COLORS[org.composite_tier] || '#666';
                  const isHovered = hovered?.id === org.id;
                  const isSelected = selected?.id === org.id;
                  const r = isHovered || isSelected ? 7 : 4.5;
                  return (
                    <g key={org.id || i}>
                      {(isHovered || isSelected) && (
                        <circle cx={x} cy={y} r={16} fill={color} opacity={0.15}/>
                      )}
                      <circle
                        cx={x} cy={y} r={r}
                        fill={color}
                        fillOpacity={isHovered || isSelected ? 1 : 0.8}
                        stroke={isSelected ? 'var(--gold)' : isHovered ? 'rgba(244,240,232,0.7)' : 'rgba(26,23,20,0.5)'}
                        strokeWidth={isSelected ? 2 : 1}
                        style={{cursor:'pointer',transition:'r 0.1s'}}
                        onMouseEnter={() => setHovered(org)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={(e) => { e.stopPropagation(); setSelected(s => s?.id===org.id ? null : org); }}
                      />
                    </g>
                  );
                })}

                {/* Hover tooltip */}
                {hovered && (() => {
                  const x = cx(hovered.econ);
                  const y = cy(hovered.auth);
                  const name = hovered.name.length > 30 ? hovered.name.slice(0,28)+'…' : hovered.name;
                  const tx = x + 12 > W - 140 ? x - 140 : x + 12;
                  const ty = Math.max(PAD+4, y - 32);
                  const bw = Math.max(name.length * 6.5 + 12, 130);
                  return (
                    <g style={{pointerEvents:'none'}}>
                      <rect x={tx-4} y={ty-14} width={bw} height={46}
                        fill="rgba(20,18,16,0.96)" stroke="rgba(200,168,75,0.5)" strokeWidth="1" rx="1"/>
                      <text x={tx+2} y={ty+1} fill="#faf8f3" fontSize={11} fontFamily="monospace" fontWeight="600">{name}</text>
                      <text x={tx+2} y={ty+16} fill="rgba(200,168,75,0.8)" fontSize={9} fontFamily="monospace">
                        {hovered.composite_tier} · {parseFloat(hovered.composite_score).toFixed(0)}%
                      </text>
                      <text x={tx+2} y={ty+28} fill="rgba(212,206,196,0.45)" fontSize={9} fontFamily="monospace">
                        Econ: {hovered.econ>0?'+':''}{hovered.econ} · Auth: {hovered.auth>0?'+':''}{hovered.auth}
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Legend + detail */}
            <div>
              {/* Tier legend with filter */}
              <div style={{fontFamily:'var(--mono)',fontSize:'0.63rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.75rem'}}>
                Tier
              </div>
              {TIERS.map(tier => (
                <label key={tier} style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.45rem',cursor:'pointer'}}>
                  <input type="checkbox" checked={tierFilter.length===0||tierFilter.includes(tier)}
                    onChange={() => toggle(tier)}
                    style={{accentColor:TIER_COLORS[tier]}}/>
                  <div style={{width:10,height:10,borderRadius:'50%',background:TIER_COLORS[tier],flexShrink:0}}/>
                  <span style={{fontFamily:'var(--mono)',fontSize:'0.7rem',color:'var(--muted)',flex:1}}>{tier}</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'rgba(212,206,196,0.35)'}}>{tierCounts[tier]||0}</span>
                </label>
              ))}

              {tierFilter.length > 0 && (
                <button onClick={() => setTierFilter([])}
                  style={{fontFamily:'var(--mono)',fontSize:'0.63rem',letterSpacing:'0.08em',textTransform:'uppercase',padding:'0.35rem 0.75rem',width:'100%',background:'transparent',border:'1px solid rgba(212,206,196,0.2)',color:'var(--muted)',cursor:'pointer',marginTop:'0.5rem'}}>
                  Show All
                </button>
              )}

              {/* Selected org detail */}
              {selected && (
                <div style={{marginTop:'1.5rem',padding:'1rem',background:'rgba(244,240,232,0.03)',border:'1px solid rgba(212,206,196,0.15)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.5rem'}}>
                    <div style={{fontFamily:'var(--serif)',fontSize:'0.9rem',fontWeight:700,color:'var(--paper)',lineHeight:1.3,flex:1,paddingRight:'0.5rem'}}>{selected.name}</div>
                    <button onClick={()=>setSelected(null)} style={{background:'transparent',border:'none',color:'var(--muted)',cursor:'pointer',fontFamily:'var(--mono)',fontSize:'0.7rem',flexShrink:0}}>✕</button>
                  </div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--muted)',marginBottom:'0.75rem',lineHeight:1.4}}>{selected.category}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                    {[
                      ['Composite', `${parseFloat(selected.composite_score).toFixed(1)}%`],
                      ["Young's",   `${selected.youngs_score}/10`],
                      ['Tier',      selected.composite_tier],
                      ['Econ Axis', `${selected.econ > 0 ? '+' : ''}${selected.econ}`],
                      ['Auth Axis', `${selected.auth > 0 ? '+' : ''}${selected.auth}`],
                      ['Quadrant',  selected.quadrant||'—'],
                    ].map(([k,v]) => (
                      <div key={k} style={{display:'flex',justifyContent:'space-between',gap:'0.5rem'}}>
                        <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--muted)'}}>{k}</span>
                        <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--gold)'}}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:'0.75rem'}}>
                    <Link href="/explore" style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'rgba(212,206,196,0.4)',textDecoration:'none',letterSpacing:'0.06em'}}>
                      View in Explorer →
                    </Link>
                  </div>
                </div>
              )}

              {!selected && (
                <div style={{marginTop:'1.5rem',padding:'0.75rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
                  <p style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'rgba(212,206,196,0.3)',margin:0,lineHeight:1.6}}>
                    Click any dot to see organization details. Hover to preview. Use checkboxes to filter by tier.
                  </p>
                </div>
              )}

              <div style={{marginTop:'1rem'}}>
                <Link href="/explore" className="btn-secondary" style={{display:'block',textAlign:'center',fontSize:'0.7rem'}}>
                  ← Dataset Explorer
                </Link>
              </div>
            </div>
          </div>

          {/* Methodology note */}
          <div style={{marginTop:'2.5rem',padding:'1.25rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
            <p style={{fontFamily:'var(--mono)',fontSize:'0.68rem',color:'var(--muted)',margin:0,lineHeight:1.7}}>
              <span style={{color:'var(--gold)'}}>r = 0.703</span> correlation between authority-axis position and composite cultiness score across the full dataset.
              Political scores are independent from cultiness scores — Economic axis: −5 Far Left to +5 Far Right.
              Authority axis: −5 Libertarian to +5 Authoritarian.
              Scores reflect documented institutional behavior, not partisan affiliation or public perception.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
