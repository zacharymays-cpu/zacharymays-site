'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';

const TIER_COLORS = {
  'Cult':          '#c02020',
  'Cult Dynamics': '#c04040',
  'High Control':  '#b07030',
  'Concerning':    '#a09040',
  'Mildly Culty':  '#6a9840',
  'Healthy Group': '#30a060',
};
const TIERS = ['Cult','Cult Dynamics','High Control','Concerning','Mildly Culty','Healthy Group'];
const TRAJECTORIES = ['Stable','Escalating','Declining','Defunct'];
const QUADRANTS = ['Authoritarian Left','Authoritarian Right','Libertarian Left','Libertarian Right'];

const toP = (val, min=-5, max=5) => ((val - min) / (max - min)) * 100;

// Diamond SVG path centred on (cx,cy) with half-size r
const diamond = (x, y, r) =>
  `M ${x} ${y-r} L ${x+r} ${y} L ${x} ${y+r} L ${x-r} ${y} Z`;

export default function CompassClient({ orgs=[], calibrationOrgs=[] }) {
  const [hovered, setHovered]         = useState(null);
  const [selected, setSelected]       = useState(null);
  const [tierFilter, setTierFilter]   = useState([]);
  const [trajFilter, setTrajFilter]   = useState([]);
  const [quadFilter, setQuadFilter]   = useState([]);
  const [showCalib, setShowCalib]     = useState(true);
  const [svgSize, setSvgSize]         = useState(560);
  const containerRef = useRef(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setSvgSize(Math.min(containerRef.current.offsetWidth, 560));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const toggle = (val, state, setter) =>
    setter(state.includes(val) ? state.filter(v=>v!==val) : [...state,val]);

  const filteredOrgs = useMemo(() =>
    orgs.filter(o => {
      if (tierFilter.length && !tierFilter.includes(o.composite_tier)) return false;
      if (trajFilter.length && !trajFilter.includes(o.trajectory))     return false;
      if (quadFilter.length && !quadFilter.includes(o.quadrant))       return false;
      return true;
    }), [orgs, tierFilter, trajFilter, quadFilter]);

  const allPoints = useMemo(() => [
    ...filteredOrgs,
    ...(showCalib ? calibrationOrgs : []),
  ], [filteredOrgs, calibrationOrgs, showCalib]);

  const tierCounts = useMemo(() => {
    const c={};
    orgs.forEach(o=>{c[o.composite_tier]=(c[o.composite_tier]||0)+1;});
    return c;
  }, [orgs]);

  const trajCounts = useMemo(() => {
    const c={};
    orgs.forEach(o=>{c[o.trajectory]=(c[o.trajectory]||0)+1;});
    return c;
  }, [orgs]);

  const quadCounts = useMemo(() => {
    const c={};
    orgs.forEach(o=>{if(o.quadrant)c[o.quadrant]=(c[o.quadrant]||0)+1;});
    return c;
  }, [orgs]);

  const hasFilters = tierFilter.length||trajFilter.length||quadFilter.length||!showCalib;

  const W=svgSize, H=svgSize, PAD=44, INNER=W-PAD*2;
  const cx = econ => PAD + (toP(econ)/100)*INNER;
  const cy = auth => PAD + (toP(-auth)/100)*INNER;

  const FilterSection = ({ label, items, counts, state, setter }) => (
    <div style={{marginBottom:'1.1rem'}}>
      <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.4rem'}}>{label}</div>
      {items.map(t=>(
        <label key={t} style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.25rem',cursor:'pointer'}}>
          <input type="checkbox" checked={state.includes(t)} onChange={()=>toggle(t,state,setter)}/>
          <span style={{fontSize:'0.75rem',color:state.includes(t)?'var(--paper)':'var(--muted)',flex:1,lineHeight:1.3}}>{t}</span>
          {counts&&<span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'rgba(212,206,196,0.35)'}}>{counts[t]||0}</span>}
        </label>
      ))}
    </div>
  );

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
            {orgs.length} organizations + {calibrationOrgs.length} calibration anchors plotted
            by economic axis (Left ↔ Right) and authority axis (Libertarian ↕ Authoritarian).
            Colored by composite cultiness tier. r=0.703 correlation with authority axis.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{display:'grid',gridTemplateColumns:'160px 1fr 200px',gap:'1.5rem',alignItems:'start'}}>

            {/* Left: Filters */}
            <div style={{position:'sticky',top:'120px'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.63rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.75rem'}}>Filters</div>

              {/* Calibration toggle */}
              <div style={{marginBottom:'1.1rem'}}>
                <label style={{display:'flex',alignItems:'center',gap:'0.4rem',cursor:'pointer'}}>
                  <input type="checkbox" checked={showCalib} onChange={()=>setShowCalib(s=>!s)}/>
                  <span style={{fontSize:'0.75rem',color:showCalib?'var(--paper)':'var(--muted)',flex:1}}>Calibration ◆</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'rgba(212,206,196,0.35)'}}>{calibrationOrgs.length}</span>
                </label>
              </div>

              <FilterSection label="Tier" items={TIERS} counts={tierCounts} state={tierFilter} setter={setTierFilter}/>
              <FilterSection label="Trajectory" items={TRAJECTORIES} counts={trajCounts} state={trajFilter} setter={setTrajFilter}/>
              <FilterSection label="Quadrant" items={QUADRANTS} counts={quadCounts} state={quadFilter} setter={setQuadFilter}/>

              {hasFilters&&(
                <button onClick={()=>{setTierFilter([]);setTrajFilter([]);setQuadFilter([]);setShowCalib(true);}}
                  style={{fontFamily:'var(--mono)',fontSize:'0.63rem',letterSpacing:'0.08em',textTransform:'uppercase',padding:'0.35rem 0.75rem',width:'100%',background:'transparent',border:'1px solid rgba(212,206,196,0.2)',color:'var(--muted)',cursor:'pointer',marginTop:'0.5rem'}}>
                  Clear All
                </button>
              )}

              <div style={{marginTop:'1.5rem',padding:'0.75rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
                <p style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'rgba(212,206,196,0.3)',margin:0,lineHeight:1.6}}>
                  Dots = active orgs<br/>
                  ◆ = calibration anchors<br/>
                  Click to pin detail
                </p>
              </div>
            </div>

            {/* Centre: SVG */}
            <div ref={containerRef}>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                style={{width:'100%',maxWidth:W,display:'block',cursor:'crosshair'}}
                onClick={()=>{ if(!hovered) setSelected(null); }}
              >
                {/* Quadrant fills */}
                <rect x={PAD} y={PAD} width={INNER/2} height={INNER/2} fill="rgba(139,32,32,0.06)"/>
                <rect x={PAD+INNER/2} y={PAD} width={INNER/2} height={INNER/2} fill="rgba(120,100,30,0.06)"/>
                <rect x={PAD} y={PAD+INNER/2} width={INNER/2} height={INNER/2} fill="rgba(42,107,74,0.05)"/>
                <rect x={PAD+INNER/2} y={PAD+INNER/2} width={INNER/2} height={INNER/2} fill="rgba(42,107,74,0.04)"/>

                {/* Grid */}
                {[-4,-3,-2,-1,1,2,3,4].map(v=>{
                  const px=cx(v),py=cy(v);
                  return(<g key={v}>
                    <line x1={px} y1={PAD} x2={px} y2={PAD+INNER} stroke="rgba(212,206,196,0.05)" strokeWidth="1"/>
                    <line x1={PAD} y1={py} x2={PAD+INNER} y2={py} stroke="rgba(212,206,196,0.05)" strokeWidth="1"/>
                  </g>);
                })}

                {/* Axes */}
                <line x1={PAD} y1={H/2} x2={PAD+INNER} y2={H/2} stroke="rgba(212,206,196,0.25)" strokeWidth="1.5"/>
                <line x1={W/2} y1={PAD} x2={W/2} y2={PAD+INNER} stroke="rgba(212,206,196,0.25)" strokeWidth="1.5"/>

                {/* Labels */}
                {[
                  [PAD+4, H/2-7, 'start',  '◀ Left'],
                  [PAD+INNER-4, H/2-7, 'end', 'Right ▶'],
                  [W/2, PAD-7, 'middle', '▲ Auth'],
                  [W/2, PAD+INNER+16, 'middle', '▼ Lib'],
                ].map(([x,y,anchor,text])=>(
                  <text key={text} x={x} y={y} textAnchor={anchor} fill="rgba(212,206,196,0.35)" fontSize={svgSize<400?8:10} fontFamily="monospace">{text}</text>
                ))}
                {[
                  [PAD+6, PAD+16, 'start', 'AUTH LEFT'],
                  [PAD+INNER-6, PAD+16, 'end', 'AUTH RIGHT'],
                  [PAD+6, PAD+INNER-6, 'start', 'LIB LEFT'],
                  [PAD+INNER-6, PAD+INNER-6, 'end', 'LIB RIGHT'],
                ].map(([x,y,anchor,text])=>(
                  <text key={text} x={x} y={y} textAnchor={anchor} fill="rgba(212,206,196,0.12)" fontSize={svgSize<400?7:9} fontFamily="monospace">{text}</text>
                ))}

                {/* Regular org dots */}
                {filteredOrgs.map((org,i)=>{
                  const x=cx(org.econ), y=cy(org.auth);
                  const color=TIER_COLORS[org.composite_tier]||'#888';
                  const isH=hovered?.id===org.id, isS=selected?.id===org.id;
                  const r=isH||isS?7:4.5;
                  return(
                    <g key={org.id||i}>
                      {(isH||isS)&&<circle cx={x} cy={y} r={16} fill={color} opacity={0.15}/>}
                      <circle cx={x} cy={y} r={r} fill={color} fillOpacity={isH||isS?1:0.75}
                        stroke={isS?'var(--gold)':isH?'rgba(244,240,232,0.7)':'rgba(26,23,20,0.4)'}
                        strokeWidth={isS?2:1}
                        style={{cursor:'pointer',transition:'r 0.1s'}}
                        onMouseEnter={()=>setHovered(org)}
                        onMouseLeave={()=>setHovered(null)}
                        onClick={e=>{e.stopPropagation();setSelected(s=>s?.id===org.id?null:org);}}
                      />
                    </g>
                  );
                })}

                {/* Calibration anchor diamonds */}
                {showCalib&&calibrationOrgs.map((org,i)=>{
                  const x=cx(org.econ), y=cy(org.auth);
                  const color=TIER_COLORS[org.composite_tier]||'#888';
                  const isH=hovered?.id===org.id, isS=selected?.id===org.id;
                  const r=isH||isS?9:6;
                  return(
                    <g key={`calib-${org.id||i}`}>
                      {(isH||isS)&&<circle cx={x} cy={y} r={18} fill={color} opacity={0.15}/>}
                      <path d={diamond(x,y,r)} fill={color} fillOpacity={isH||isS?1:0.85}
                        stroke={isS?'var(--gold)':isH?'rgba(244,240,232,0.9)':'rgba(26,23,20,0.5)'}
                        strokeWidth={isS?2:1.5}
                        style={{cursor:'pointer',transition:'d 0.1s'}}
                        onMouseEnter={()=>setHovered(org)}
                        onMouseLeave={()=>setHovered(null)}
                        onClick={e=>{e.stopPropagation();setSelected(s=>s?.id===org.id?null:org);}}
                      />
                    </g>
                  );
                })}

                {/* Hover tooltip */}
                {hovered&&(()=>{
                  const x=cx(hovered.econ), y=cy(hovered.auth);
                  const name=hovered.name.length>32?hovered.name.slice(0,30)+'…':hovered.name;
                  const tx=x+14>W-150?x-154:x+14;
                  const ty=Math.max(PAD+4,y-36);
                  const bw=Math.max(name.length*6.5+16,140);
                  return(
                    <g style={{pointerEvents:'none'}}>
                      <rect x={tx-4} y={ty-14} width={bw} height={52}
                        fill="rgba(20,18,16,0.97)" stroke="rgba(200,168,75,0.5)" strokeWidth="1" rx="1"/>
                      <text x={tx+2} y={ty+1} fill="#faf8f3" fontSize={11} fontFamily="monospace" fontWeight="600">
                        {hovered.isCalibration?'◆ ':''}{name}
                      </text>
                      <text x={tx+2} y={ty+16} fill="rgba(200,168,75,0.85)" fontSize={9} fontFamily="monospace">
                        {hovered.composite_tier} · {parseFloat(hovered.composite_score).toFixed(0)}%
                      </text>
                      <text x={tx+2} y={ty+30} fill="rgba(212,206,196,0.45)" fontSize={9} fontFamily="monospace">
                        Econ: {hovered.econ>0?'+':''}{hovered.econ}  Auth: {hovered.auth>0?'+':''}{hovered.auth}
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Right: Selected detail */}
            <div style={{position:'sticky',top:'120px'}}>
              {selected?(
                <div style={{padding:'1rem',background:'rgba(244,240,232,0.03)',border:'1px solid rgba(212,206,196,0.15)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.6rem'}}>
                    <div style={{fontFamily:'var(--serif)',fontSize:'0.9rem',fontWeight:700,color:'var(--paper)',lineHeight:1.3,flex:1,paddingRight:'0.5rem'}}>
                      {selected.isCalibration&&<span style={{color:'var(--gold)',marginRight:'0.3rem'}}>◆</span>}
                      {selected.name}
                    </div>
                    <button onClick={()=>setSelected(null)} style={{background:'transparent',border:'none',color:'var(--muted)',cursor:'pointer',fontFamily:'var(--mono)',fontSize:'0.7rem',flexShrink:0}}>✕</button>
                  </div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'var(--muted)',marginBottom:'0.75rem',lineHeight:1.5}}>
                    {selected.category}
                    {selected.isCalibration&&<span style={{display:'block',color:'rgba(200,168,75,0.5)',marginTop:'0.2rem'}}>Calibration anchor</span>}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                    {[
                      ['Composite',  `${parseFloat(selected.composite_score).toFixed(1)}%`],
                      ["Young's",    `${selected.youngs_score}/10`],
                      ['Tier',       selected.composite_tier],
                      ['Econ',       `${selected.econ>0?'+':''}${selected.econ}`],
                      ['Auth',       `${selected.auth>0?'+':''}${selected.auth}`],
                      ['Quadrant',   selected.quadrant||'—'],
                      ...(!selected.isCalibration?[['Trajectory', selected.trajectory||'—']]:[]),
                    ].map(([k,v])=>(
                      <div key={k} style={{display:'flex',justifyContent:'space-between',gap:'0.5rem'}}>
                        <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--muted)'}}>{k}</span>
                        <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--gold)'}}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {!selected.isCalibration&&(
                    <div style={{marginTop:'0.75rem'}}>
                      <Link href="/explore" style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'rgba(212,206,196,0.4)',textDecoration:'none'}}>
                        View in Explorer →
                      </Link>
                    </div>
                  )}
                </div>
              ):(
                <div style={{padding:'0.9rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.63rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.6rem'}}>Tier Legend</div>
                  {TIERS.map(tier=>(
                    <div key={tier} style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.4rem'}}>
                      <div style={{width:9,height:9,borderRadius:'50%',background:TIER_COLORS[tier],flexShrink:0}}/>
                      <span style={{fontFamily:'var(--mono)',fontSize:'0.68rem',color:'var(--muted)',flex:1}}>{tier}</span>
                      <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'rgba(212,206,196,0.35)'}}>{tierCounts[tier]||0}</span>
                    </div>
                  ))}
                  <div style={{marginTop:'0.75rem',paddingTop:'0.75rem',borderTop:'1px solid rgba(212,206,196,0.1)'}}>
                    <p style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'rgba(212,206,196,0.3)',margin:0,lineHeight:1.6}}>
                      Click any dot or ◆ to see details. Use filters to isolate tiers, trajectories, or quadrants.
                    </p>
                  </div>
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
              <span style={{color:'var(--gold)'}}>r = 0.703</span> correlation between authority-axis position and composite cultiness score.
              Economic axis: −5 Far Left to +5 Far Right. Authority axis: −5 Libertarian to +5 Authoritarian.
              Scores reflect documented institutional behavior, not partisan affiliation.
              Calibration anchors (◆) are historical reference organizations used to anchor the scoring scale.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
