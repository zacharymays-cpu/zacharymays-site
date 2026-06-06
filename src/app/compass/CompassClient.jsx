'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';

const TIER_COLORS = {
  'Super Culty':  '#e8574d',
  'Kinda Culty':  '#d99b3e',
  'Not Culty':    '#5cb878',
};
const TIERS       = ['Super Culty','Kinda Culty','Not Culty'];
const TRAJECTORIES= ['Stable','Escalating','Declining','Defunct'];
const QUADRANTS   = ['Authoritarian Left','Authoritarian Right','Libertarian Left','Libertarian Right'];

const toP = (val, min=-5, max=5) => ((val - min) / (max - min)) * 100;

// Diamond path centred on x,y with half-size r
const diamond = (x, y, r) => `M${x} ${y-r} L${x+r} ${y} L${x} ${y+r} L${x-r} ${y}Z`;

// 5-point star centred on x,y with outer radius R
const star = (x, y, R) => {
  const r = R * 0.42;
  const pts = Array.from({length:10}, (_,i) => {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? R : r;
    return `${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`;
  });
  return `M${pts.join('L')}Z`;
};

export default function CompassClient({ orgs=[], regimes=[], presidentialEras=[], r=0.67 }) {
  const [hovered, setHovered]       = useState(null);
  const [selected, setSelected]     = useState(null);
  const [tierFilter, setTierFilter] = useState([]);
  const [trajFilter, setTrajFilter] = useState([]);
  const [quadFilter, setQuadFilter] = useState([]);
  const [showRegimes, setShowRegimes]   = useState(true);
  const [showPresEras, setShowPresEras] = useState(true);
  const [svgSize, setSvgSize]           = useState(700);
  const containerRef = useRef(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setSvgSize(Math.min(containerRef.current.offsetWidth, 800));
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

  const tierCounts = useMemo(() => {
    const c={}; orgs.forEach(o=>{c[o.composite_tier]=(c[o.composite_tier]||0)+1;}); return c;
  }, [orgs]);
  const trajCounts = useMemo(() => {
    const c={}; orgs.forEach(o=>{c[o.trajectory]=(c[o.trajectory]||0)+1;}); return c;
  }, [orgs]);
  const quadCounts = useMemo(() => {
    const c={}; orgs.forEach(o=>{if(o.quadrant)c[o.quadrant]=(c[o.quadrant]||0)+1;}); return c;
  }, [orgs]);

  const hasFilters = tierFilter.length||trajFilter.length||quadFilter.length||!showRegimes||!showPresEras;

  const W=svgSize, H=svgSize, PAD=44, INNER=W-PAD*2;
  const cx = econ => PAD + (toP(econ)/100)*INNER;
  const cy = auth => PAD + (toP(-auth)/100)*INNER;
  const small = svgSize < 400;

  const Tooltip = ({item, isRegime, isPresEra}) => {
    if (!item) return null;
    const x=cx(parseFloat(item.economic_axis||item.econ));
    const y=cy(parseFloat(item.authority_axis||item.auth));
    const label = item.display_label||item.name;
    const name  = label.length>30 ? label.slice(0,28)+'…' : label;
    const tx    = x+14 > W-150 ? x-154 : x+14;
    const ty    = Math.max(PAD+4, y-36);
    const bw    = Math.max(name.length*7+16, 130);
    const line2 = isRegime  ? item.description?.slice(0,55)+'…'
                : isPresEra ? `${item.era_start}–${item.era_end||'present'}`
                :             `${item.composite_tier} · ${parseFloat(item.composite_score).toFixed(0)}%`;
    return (
      <g style={{pointerEvents:'none'}}>
        <rect x={tx-4} y={ty-14} width={bw} height={44}
          fill="rgba(18,15,12,0.97)" stroke="rgba(200,168,75,0.55)" strokeWidth="1" rx="1"/>
        <text x={tx+2} y={ty+1} fill="#faf8f3" fontSize={11} fontFamily="monospace" fontWeight="600">{name}</text>
        <text x={tx+2} y={ty+16} fill="rgba(200,168,75,0.8)" fontSize={9} fontFamily="monospace">{line2}</text>
        <text x={tx+2} y={ty+28} fill="rgba(212,206,196,0.4)" fontSize={9} fontFamily="monospace">
          Econ {parseFloat(item.economic_axis||item.econ)>0?'+':''}
          {parseFloat(item.economic_axis||item.econ)} · Auth {parseFloat(item.authority_axis||item.auth)>0?'+':''}
          {parseFloat(item.authority_axis||item.auth)}
        </text>
      </g>
    );
  };

  const FilterSection = ({label, items, counts, state, setter}) => (
    <div style={{marginBottom:'1rem'}}>
      <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.4rem'}}>{label}</div>
      {items.map(t=>(
        <label key={t} style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.22rem',cursor:'pointer'}}>
          <input type="checkbox" checked={state.includes(t)} onChange={()=>toggle(t,state,setter)}/>
          <span style={{fontSize:'0.73rem',color:state.includes(t)?'var(--paper)':'var(--muted)',flex:1,lineHeight:1.3}}>{t}</span>
          {counts&&<span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'rgba(212,206,196,0.3)'}}>{counts[t]||0}</span>}
        </label>
      ))}
    </div>
  );

  const DetailPanel = ({item, isRegime, isPresEra}) => {
    if (!item) return null;
    const rows = isRegime ? [
      ['Econ Axis', `${parseFloat(item.economic_axis)>0?'+':''}${item.economic_axis}`],
      ['Auth Axis', `${parseFloat(item.authority_axis)>0?'+':''}${item.authority_axis}`],
      ['Type', 'Historical Regime ◆'],
    ] : isPresEra ? [
      ['Period', `${item.era_start}–${item.era_end||'present'}`],
      ['Econ Axis', `${parseFloat(item.economic_axis)>0?'+':''}${item.economic_axis}`],
      ['Auth Axis', `${parseFloat(item.authority_axis)>0?'+':''}${item.authority_axis}`],
      ['Type', 'Presidential Era ★'],
    ] : [
      ['Composite', `${parseFloat(item.composite_score).toFixed(1)}%`],
      ["Young's",   `${item.youngs_score}/10`],
      ['Tier',       item.composite_tier],
      ['Econ',       `${item.econ>0?'+':''}${item.econ}`],
      ['Auth',       `${item.auth>0?'+':''}${item.auth}`],
      ['Quadrant',   item.quadrant||'—'],
      ['Trajectory', item.trajectory||'—'],
    ];
    return (
      <div style={{padding:'1rem',background:'rgba(244,240,232,0.03)',border:'1px solid rgba(212,206,196,0.15)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.5rem'}}>
          <div style={{fontFamily:'var(--serif)',fontSize:'0.88rem',fontWeight:700,color:'var(--paper)',lineHeight:1.3,flex:1,paddingRight:'0.5rem'}}>
            {isRegime&&<span style={{color:'var(--gold)',marginRight:'0.3rem'}}>◆</span>}
            {isPresEra&&<span style={{color:'var(--gold)',marginRight:'0.3rem'}}>★</span>}
            {item.display_label||item.name}
          </div>
          <button onClick={()=>setSelected(null)} style={{background:'transparent',border:'none',color:'var(--muted)',cursor:'pointer',fontFamily:'var(--mono)',fontSize:'0.7rem'}}>✕</button>
        </div>
        {(isRegime||isPresEra)&&item.description&&(
          <p style={{fontSize:'0.75rem',color:'var(--muted)',lineHeight:1.5,marginBottom:'0.75rem'}}>{item.description}</p>
        )}
        {!isRegime&&!isPresEra&&<div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)',marginBottom:'0.6rem'}}>{item.category}</div>}
        <div style={{display:'flex',flexDirection:'column',gap:'0.28rem'}}>
          {rows.map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',gap:'0.5rem'}}>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'var(--muted)'}}>{k}</span>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'var(--gold)'}}>{v}</span>
            </div>
          ))}
        </div>
        {!isRegime&&!isPresEra&&(
          <div style={{marginTop:'0.65rem'}}>
            <Link href="/explore" style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'rgba(212,206,196,0.35)',textDecoration:'none'}}>
              View in Explorer →
            </Link>
          </div>
        )}
      </div>
    );
  };

  const isRegime  = selected && regimes.find(r=>r.id===selected.id);
  const isPresEra = selected && presidentialEras.find(r=>r.id===selected.id);

  const hovRegime  = hovered && regimes.find(r=>r.id===hovered.id);
  const hovPresEra = hovered && presidentialEras.find(r=>r.id===hovered.id);

  return (
    <>
      <section style={{padding:'2.5rem 0 1.5rem',borderBottom:'1px solid rgba(212,206,196,0.1)'}}>
        <div className="container--wide">
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',flexWrap:'wrap',gap:'0.5rem',marginBottom:'0.6rem'}}>
            <div>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)',marginRight:'0.5rem'}}>
                <Link href="/explore" style={{color:'var(--gold)'}}>Dataset Explorer</Link>{' '}—
              </span>
              <span style={{fontFamily:'var(--serif)',fontSize:'clamp(1.3rem,2.5vw,1.9rem)',color:'var(--paper)',fontWeight:700}}>
                Political Compass
              </span>
            </div>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)'}}>
              {orgs.length} organizations · {regimes.length} regimes ◆ · {presidentialEras.length} eras ★
            </span>
          </div>
        </div>
      </section>

      <section className="section--tight">
        <div className="container--wide">
          <div style={{display:'flex',justifyContent:'center'}}>
          <div style={{width:'75%',minWidth:320,display:'grid',gridTemplateColumns:'155px 1fr 195px',gap:'1.5rem',alignItems:'start'}}>

            {/* Filters */}
            <div style={{position:'sticky',top:'120px'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.75rem'}}>Filters</div>

              {/* Reference toggles */}
              <div style={{marginBottom:'1rem'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.4rem'}}>Reference Points</div>
                <label style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.22rem',cursor:'pointer'}}>
                  <input type="checkbox" checked={showRegimes} onChange={()=>setShowRegimes(s=>!s)}/>
                  <span style={{fontSize:'0.73rem',color:showRegimes?'var(--paper)':'var(--muted)',flex:1}}>Regimes ◆</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'rgba(212,206,196,0.3)'}}>{regimes.length}</span>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:'0.4rem',cursor:'pointer'}}>
                  <input type="checkbox" checked={showPresEras} onChange={()=>setShowPresEras(s=>!s)}/>
                  <span style={{fontSize:'0.73rem',color:showPresEras?'var(--paper)':'var(--muted)',flex:1}}>Pres. Eras ★</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'rgba(212,206,196,0.3)'}}>{presidentialEras.length}</span>
                </label>
              </div>

              <FilterSection label="Tier"       items={TIERS}        counts={tierCounts} state={tierFilter} setter={setTierFilter}/>
              <FilterSection label="Trajectory" items={TRAJECTORIES} counts={trajCounts} state={trajFilter} setter={setTrajFilter}/>
              <FilterSection label="Quadrant"   items={QUADRANTS}    counts={quadCounts} state={quadFilter} setter={setQuadFilter}/>

              {hasFilters&&(
                <button onClick={()=>{setTierFilter([]);setTrajFilter([]);setQuadFilter([]);setShowRegimes(true);setShowPresEras(true);}}
                  style={{fontFamily:'var(--mono)',fontSize:'0.62rem',letterSpacing:'0.08em',textTransform:'uppercase',padding:'0.35rem 0.7rem',width:'100%',background:'transparent',border:'1px solid rgba(212,206,196,0.2)',color:'var(--muted)',cursor:'pointer',marginTop:'0.5rem'}}>
                  Clear All
                </button>
              )}
            </div>

            {/* SVG */}
            <div ref={containerRef}>
              <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',maxWidth:W,display:'block',cursor:'crosshair'}}
                onClick={()=>{ if(!hovered) setSelected(null); }}>

                {/* Quadrant fills */}
                <rect x={PAD} y={PAD} width={INNER/2} height={INNER/2} fill="rgba(139,32,32,0.06)"/>
                <rect x={PAD+INNER/2} y={PAD} width={INNER/2} height={INNER/2} fill="rgba(120,100,30,0.06)"/>
                <rect x={PAD} y={PAD+INNER/2} width={INNER/2} height={INNER/2} fill="rgba(42,107,74,0.05)"/>
                <rect x={PAD+INNER/2} y={PAD+INNER/2} width={INNER/2} height={INNER/2} fill="rgba(42,107,74,0.04)"/>

                {/* Grid */}
                {[-4,-3,-2,-1,1,2,3,4].map(v=>{
                  const px=cx(v), py=cy(v);
                  return(<g key={v}>
                    <line x1={px} y1={PAD} x2={px} y2={PAD+INNER} stroke="rgba(212,206,196,0.05)" strokeWidth="1"/>
                    <line x1={PAD} y1={py} x2={PAD+INNER} y2={py} stroke="rgba(212,206,196,0.05)" strokeWidth="1"/>
                  </g>);
                })}

                {/* Axes */}
                <line x1={PAD} y1={H/2} x2={PAD+INNER} y2={H/2} stroke="rgba(212,206,196,0.25)" strokeWidth="1.5"/>
                <line x1={W/2} y1={PAD} x2={W/2} y2={PAD+INNER} stroke="rgba(212,206,196,0.25)" strokeWidth="1.5"/>

                {/* Axis labels */}
                {[[PAD+4,H/2-7,'start','◀ Left'],[PAD+INNER-4,H/2-7,'end','Right ▶'],[W/2,PAD-7,'middle','▲ Auth'],[W/2,PAD+INNER+16,'middle','▼ Lib']].map(([x,y,a,t])=>(
                  <text key={t} x={x} y={y} textAnchor={a} fill="rgba(212,206,196,0.35)" fontSize={small?8:10} fontFamily="monospace">{t}</text>
                ))}
                {[[PAD+6,PAD+16,'start','AUTH LEFT'],[PAD+INNER-6,PAD+16,'end','AUTH RIGHT'],[PAD+6,PAD+INNER-6,'start','LIB LEFT'],[PAD+INNER-6,PAD+INNER-6,'end','LIB RIGHT']].map(([x,y,a,t])=>(
                  <text key={t} x={x} y={y} textAnchor={a} fill="rgba(212,206,196,0.1)" fontSize={small?7:9} fontFamily="monospace">{t}</text>
                ))}

                {/* Org dots */}
                {filteredOrgs.map((org,i)=>{
                  const x=cx(org.econ), y=cy(org.auth);
                  const color=TIER_COLORS[org.composite_tier]||'#888';
                  const isH=hovered?.id===org.id, isS=selected?.id===org.id;
                  return(<g key={org.id||i}>
                    {(isH||isS)&&<circle cx={x} cy={y} r={15} fill={color} opacity={0.15}/>}
                    <circle cx={x} cy={y} r={isH||isS?7:4.5} fill={color} fillOpacity={isH||isS?1:0.75}
                      stroke={isS?'var(--gold)':isH?'rgba(244,240,232,0.7)':'rgba(26,23,20,0.4)'} strokeWidth={isS?2:1}
                      style={{cursor:'pointer',transition:'r 0.1s'}}
                      onMouseEnter={()=>setHovered(org)} onMouseLeave={()=>setHovered(null)}
                      onClick={e=>{e.stopPropagation();setSelected(s=>s?.id===org.id?null:org);}}/>
                  </g>);
                })}

                {/* Historical regime diamonds */}
                {showRegimes&&regimes.map((r,i)=>{
                  const x=cx(parseFloat(r.economic_axis)), y=cy(parseFloat(r.authority_axis));
                  const isH=hovered?.id===r.id, isS=selected?.id===r.id;
                  const sz=isH||isS?9:6.5;
                  return(<g key={`regime-${r.id||i}`}>
                    {(isH||isS)&&<circle cx={x} cy={y} r={18} fill="rgba(200,168,75,0.12)"/>}
                    <path d={diamond(x,y,sz)} fill="rgba(200,168,75,0.15)"
                      stroke={isS?'#c8a84b':isH?'rgba(200,168,75,0.9)':'rgba(200,168,75,0.6)'} strokeWidth={isS?2:1.5}
                      style={{cursor:'pointer'}}
                      onMouseEnter={()=>setHovered(r)} onMouseLeave={()=>setHovered(null)}
                      onClick={e=>{e.stopPropagation();setSelected(s=>s?.id===r.id?null:r);}}/>
                    <text x={x} y={y+sz+11} textAnchor="middle" fill="rgba(200,168,75,0.55)" fontSize={small?7:8} fontFamily="monospace">{r.display_label}</text>
                  </g>);
                })}

                {/* Presidential era stars */}
                {showPresEras&&presidentialEras.map((era,i)=>{
                  const x=cx(parseFloat(era.economic_axis)), y=cy(parseFloat(era.authority_axis));
                  const isH=hovered?.id===era.id, isS=selected?.id===era.id;
                  const sz=isH||isS?11:8;
                  return(<g key={`era-${era.id||i}`}>
                    {(isH||isS)&&<circle cx={x} cy={y} r={20} fill="rgba(255,255,255,0.06)"/>}
                    <path d={star(x,y,sz)} fill={isH||isS?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.7)'}
                      stroke={isS?'#c8a84b':isH?'rgba(200,168,75,0.8)':'rgba(200,168,75,0.4)'} strokeWidth={isS?1.5:1}
                      style={{cursor:'pointer'}}
                      onMouseEnter={()=>setHovered(era)} onMouseLeave={()=>setHovered(null)}
                      onClick={e=>{e.stopPropagation();setSelected(s=>s?.id===era.id?null:era);}}/>
                    <text x={x} y={y+sz+11} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize={small?7:8} fontFamily="monospace">{era.display_label}</text>
                  </g>);
                })}

                {/* Tooltip */}
                {hovered&&<Tooltip item={hovered} isRegime={!!hovRegime} isPresEra={!!hovPresEra}/>}
              </svg>
            </div>

            {/* Right panel */}
            <div style={{position:'sticky',top:'120px'}}>
              {selected ? (
                <DetailPanel item={selected} isRegime={!!isRegime} isPresEra={!!isPresEra}/>
              ) : (
                <div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.65rem'}}>Tier Legend</div>
                  {TIERS.map(tier=>(
                    <div key={tier} style={{display:'flex',alignItems:'center',gap:'0.45rem',marginBottom:'0.38rem'}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:TIER_COLORS[tier],flexShrink:0}}/>
                      <span style={{fontFamily:'var(--mono)',fontSize:'0.67rem',color:'var(--muted)',flex:1}}>{tier}</span>
                      <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'rgba(212,206,196,0.3)'}}>{tierCounts[tier]||0}</span>
                    </div>
                  ))}
                  <div style={{marginTop:'0.75rem',paddingTop:'0.75rem',borderTop:'1px solid rgba(212,206,196,0.1)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.45rem',marginBottom:'0.35rem'}}>
                      <span style={{color:'rgba(200,168,75,0.7)',fontSize:'0.8rem',lineHeight:1}}>◆</span>
                      <span style={{fontFamily:'var(--mono)',fontSize:'0.67rem',color:'var(--muted)'}}>Historical regime</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'0.45rem'}}>
                      <span style={{color:'rgba(255,255,255,0.6)',fontSize:'0.8rem',lineHeight:1}}>★</span>
                      <span style={{fontFamily:'var(--mono)',fontSize:'0.67rem',color:'var(--muted)'}}>US presidential era</span>
                    </div>
                  </div>
                  <div style={{marginTop:'0.75rem',padding:'0.7rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
                    <p style={{fontFamily:'var(--mono)',fontSize:'0.61rem',color:'rgba(212,206,196,0.3)',margin:0,lineHeight:1.6}}>
                      Click any marker to pin details. Use filters to isolate by tier, trajectory, or quadrant.
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

          </div>{/* end 75% grid wrapper */}
          </div>{/* end centering flex */}

          <div style={{marginTop:'2.5rem',padding:'1.25rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
            <p style={{fontFamily:'var(--mono)',fontSize:'0.67rem',color:'var(--muted)',margin:0,lineHeight:1.7}}>
              <span style={{color:'var(--gold)'}}>r = {(typeof r === 'number' ? r : 0.67).toFixed(3)}</span> correlation between authority-axis position and composite cultiness score across the full dataset.
              Economic axis: −5 Far Left to +5 Far Right. Authority axis: −5 Libertarian to +5 Authoritarian.
              Scores reflect documented institutional behavior. Historical regimes (◆) and presidential eras (★) are reference anchors, not scored organizations.
            </p>
          </div>
      </section>
    </>
  );
}
