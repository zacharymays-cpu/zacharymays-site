'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
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

// Size tier → dot radius
const SIZE_RADIUS = {
  'micro':  4,
  'small':  6,
  'medium': 9,
  'large':  13,
  'mass':   18,
  null:     6,   // default when no size data
};

const SIZE_LABELS = {
  'micro':  '< 1,000',
  'small':  '1k – 50k',
  'medium': '50k – 1M',
  'large':  '1M – 10M',
  'mass':   '> 10M',
};

// US state abbreviations for the legend table
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

// Approximate center coordinates for each state (for state-dot fallback)
const STATE_CENTERS = {
  AL:{lat:32.8,lng:-86.8},AK:{lat:64.2,lng:-153.0},AZ:{lat:34.3,lng:-111.7},
  AR:{lat:34.9,lng:-92.4},CA:{lat:36.8,lng:-119.4},CO:{lat:39.0,lng:-105.5},
  CT:{lat:41.6,lng:-72.7},DE:{lat:39.0,lng:-75.5},FL:{lat:28.0,lng:-81.5},
  GA:{lat:32.7,lng:-83.6},HI:{lat:20.3,lng:-156.4},ID:{lat:44.4,lng:-114.5},
  IL:{lat:40.0,lng:-89.2},IN:{lat:39.9,lng:-86.3},IA:{lat:42.1,lng:-93.5},
  KS:{lat:38.5,lng:-98.4},KY:{lat:37.7,lng:-84.9},LA:{lat:31.2,lng:-91.8},
  ME:{lat:45.4,lng:-69.0},MD:{lat:39.1,lng:-76.8},MA:{lat:42.2,lng:-71.5},
  MI:{lat:44.3,lng:-85.4},MN:{lat:46.4,lng:-93.1},MS:{lat:32.7,lng:-89.7},
  MO:{lat:38.4,lng:-92.5},MT:{lat:47.0,lng:-110.4},NE:{lat:41.5,lng:-99.9},
  NV:{lat:39.3,lng:-116.6},NH:{lat:43.7,lng:-71.6},NJ:{lat:40.1,lng:-74.5},
  NM:{lat:34.8,lng:-106.2},NY:{lat:43.0,lng:-75.5},NC:{lat:35.5,lng:-79.8},
  ND:{lat:47.5,lng:-100.5},OH:{lat:40.4,lng:-82.8},OK:{lat:35.6,lng:-97.5},
  OR:{lat:44.1,lng:-120.5},PA:{lat:40.6,lng:-77.2},RI:{lat:41.7,lng:-71.5},
  SC:{lat:33.9,lng:-80.9},SD:{lat:44.4,lng:-100.2},TN:{lat:35.9,lng:-86.7},
  TX:{lat:31.0,lng:-100.0},UT:{lat:39.4,lng:-111.1},VT:{lat:44.0,lng:-72.7},
  VA:{lat:37.5,lng:-79.5},WA:{lat:47.4,lng:-120.6},WV:{lat:38.6,lng:-80.6},
  WI:{lat:44.3,lng:-89.8},WY:{lat:43.0,lng:-107.6},DC:{lat:38.9,lng:-77.0},
};

// Mercator-ish projection tuned for the contiguous US
// Maps lng[-125,-66] → [0,1], lat[24,50] → [0,1]
function project(lat, lng) {
  const x = (lng - (-125)) / ((-66) - (-125));
  const y = 1 - (lat - 24) / (50 - 24);
  return { x, y };
}

export default function MapClient({ orgs=[], withGeo=0, withSize=0 }) {
  const [tierFilter, setTierFilter]   = useState([]);
  const [scopeFilter, setScopeFilter] = useState([]);
  const [sizeMode, setSizeMode]       = useState(true);  // scale dots by size_tier
  const [hovered, setHovered]         = useState(null);
  const [selected, setSelected]       = useState(null);
  const [tooltipPos, setTooltipPos]   = useState({x:0,y:0});
  const svgRef = useRef(null);
  const [svgRect, setSvgRect]         = useState(null);

  useEffect(() => {
    const update = () => { if (svgRef.current) setSvgRect(svgRef.current.getBoundingClientRect()); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const total       = orgs.length;
  const hasGeo      = withGeo;
  const pending     = total - hasGeo;
  const pctMapped   = total > 0 ? Math.round(hasGeo/total*100) : 0;

  // Orgs with valid geo coordinates
  const geoOrgs = useMemo(() =>
    orgs.filter(o => o.hq_lat && o.hq_lng),
    [orgs]
  );

  // Filtered
  const filtered = useMemo(() => {
    return geoOrgs.filter(o => {
      if (tierFilter.length && !tierFilter.includes(o.composite_tier)) return false;
      if (scopeFilter.length && !scopeFilter.includes(o.geo_scope || 'national')) return false;
      return true;
    });
  }, [geoOrgs, tierFilter, scopeFilter]);

  const toggle = (val, state, setter) =>
    setter(state.includes(val) ? state.filter(v=>v!==val) : [...state,val]);

  // State-level count aggregation for the state heat layer
  const stateCounts = useMemo(() => {
    const c = {};
    filtered.forEach(o => {
      if (o.hq_state) c[o.hq_state] = (c[o.hq_state]||[]).concat(o);
    });
    return c;
  }, [filtered]);

  const W = 800, H = 500;
  const PLOT_X = 0, PLOT_Y = 0, PLOT_W = W, PLOT_H = H;
  const toSvg = (lat, lng) => {
    const { x, y } = project(lat, lng);
    return { x: PLOT_X + x * PLOT_W, y: PLOT_Y + y * PLOT_H };
  };

  const getRadius = (org) => {
    if (!sizeMode) return 6;
    return SIZE_RADIUS[org.size_tier] || SIZE_RADIUS[null];
  };

  const scopes = ['local','state','regional','national','international'];
  const scopeCounts = useMemo(() => {
    const c = {};
    geoOrgs.forEach(o => { const s = o.geo_scope||'national'; c[s]=(c[s]||0)+1; });
    return c;
  }, [geoOrgs]);

  return (
    <div style={{minHeight:'100vh'}}>
      {/* Header */}
      <div style={{borderBottom:'1px solid rgba(212,206,196,0.1)',padding:'2rem 0 1.5rem',
        background:'var(--ink)',position:'sticky',top:'60px',zIndex:50}}>
        <div className="container--wide">
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem',marginBottom:'1rem'}}>
            <div>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)'}}>
                <Link href="/explore" style={{color:'var(--gold)'}}>Explorer</Link> —
              </span>
              <h1 style={{fontFamily:'var(--serif)',fontSize:'clamp(1.3rem,3vw,2rem)',color:'var(--paper)',display:'inline',marginLeft:'0.4rem'}}>
                Geographic Map
              </h1>
            </div>
            {/* Coverage indicator */}
            <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.75rem',color:'var(--gold)',fontWeight:700}}>{hasGeo} <span style={{color:'var(--muted)',fontWeight:400}}>/ {total}</span></div>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',color:'rgba(212,206,196,0.3)'}}>organizations mapped</div>
              </div>
              <div style={{width:60,height:6,background:'rgba(212,206,196,0.1)',borderRadius:3,overflow:'hidden'}}>
                <div style={{width:`${pctMapped}%`,height:'100%',background:'var(--gold)',borderRadius:3,opacity:0.7}}/>
              </div>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.7rem',color:'var(--gold)'}}>{pctMapped}%</div>
            </div>
          </div>

          {/* Controls */}
          <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',alignItems:'center'}}>
            {/* Tier filter */}
            <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap'}}>
              {TIERS.map(t=>(
                <button key={t} onClick={()=>toggle(t,tierFilter,setTierFilter)}
                  style={{fontFamily:'var(--mono)',fontSize:'0.58rem',padding:'0.2rem 0.5rem',
                    background:tierFilter.includes(t)?`rgba(${hexRgb(TIER_COLORS[t])},0.18)`:'transparent',
                    border:`1px solid ${tierFilter.includes(t)?TIER_COLORS[t]:'rgba(212,206,196,0.15)'}`,
                    color:tierFilter.includes(t)?TIER_COLORS[t]:'var(--muted)',cursor:'pointer'}}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{width:1,height:20,background:'rgba(212,206,196,0.1)'}}/>
            {/* Scope filter */}
            {scopes.map(s=>(
              <button key={s} onClick={()=>toggle(s,scopeFilter,setScopeFilter)}
                style={{fontFamily:'var(--mono)',fontSize:'0.58rem',padding:'0.2rem 0.5rem',
                  background:scopeFilter.includes(s)?'rgba(200,168,75,0.12)':'transparent',
                  border:`1px solid ${scopeFilter.includes(s)?'rgba(200,168,75,0.4)':'rgba(212,206,196,0.15)'}`,
                  color:scopeFilter.includes(s)?'var(--gold)':'var(--muted)',cursor:'pointer'}}>
                {s} {scopeCounts[s]?`(${scopeCounts[s]})`:''}
              </button>
            ))}
            <div style={{width:1,height:20,background:'rgba(212,206,196,0.1)'}}/>
            <label style={{display:'flex',alignItems:'center',gap:'0.4rem',cursor:'pointer'}}>
              <input type="checkbox" checked={sizeMode} onChange={e=>setSizeMode(e.target.checked)} style={{accentColor:'var(--gold)'}}/>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)'}}>Scale by membership size</span>
            </label>
            {(tierFilter.length||scopeFilter.length)&&(
              <button onClick={()=>{setTierFilter([]);setScopeFilter([]);}}
                style={{fontFamily:'var(--mono)',fontSize:'0.6rem',padding:'0.2rem 0.5rem',background:'transparent',
                  border:'1px solid rgba(212,206,196,0.2)',color:'var(--muted)',cursor:'pointer'}}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container--wide" style={{paddingTop:'1.5rem',paddingBottom:'4rem'}}>

        {/* Map SVG */}
        <div style={{position:'relative',marginBottom:'1.5rem'}}>
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
            style={{width:'100%',display:'block',background:'rgba(244,240,232,0.015)',
              border:'1px solid rgba(212,206,196,0.08)',cursor:'crosshair'}}>

            {/* US boundary placeholder — simple rect with state grid hint */}
            {/* Real SVG US map paths would go here; using coordinate-accurate dots for now */}
            <rect x={0} y={0} width={W} height={H} fill="rgba(244,240,232,0.008)"/>

            {/* Grid lines at round lat/lng values */}
            {[25,30,35,40,45,50].map(lat=>{
              const {y} = toSvg(lat,-95.5);
              return <line key={lat} x1={0} y1={y} x2={W} y2={y}
                stroke="rgba(212,206,196,0.05)" strokeWidth="0.5" strokeDasharray="3 6"/>;
            })}
            {[-120,-110,-100,-90,-80,-70].map(lng=>{
              const {x} = toSvg(37,lng);
              return <line key={lng} x1={x} y1={0} x2={x} y2={H}
                stroke="rgba(212,206,196,0.05)" strokeWidth="0.5" strokeDasharray="3 6"/>;
            })}

            {/* State center markers (very faint, orientation only) */}
            {Object.entries(STATE_CENTERS).filter(([s])=>s!=='AK'&&s!=='HI').map(([state,{lat,lng}])=>{
              const {x,y}=toSvg(lat,lng);
              if(x<0||x>W||y<0||y>H) return null;
              return <text key={state} x={x} y={y+3} textAnchor="middle"
                fill="rgba(212,206,196,0.1)" fontSize={8} fontFamily="monospace">{state}</text>;
            })}

            {/* Org dots — render lower composite behind higher */}
            {[...filtered]
              .sort((a,b)=>parseFloat(a.composite_score)-parseFloat(b.composite_score))
              .map(org=>{
                const lat=parseFloat(org.hq_lat), lng=parseFloat(org.hq_lng);
                if(lat<24||lat>50||lng<-125||lng>-66) return null; // outside CONUS
                const {x,y}=toSvg(lat,lng);
                const r=getRadius(org);
                const tc=TIER_COLORS[org.composite_tier]||'#888';
                const isH=hovered?.id===org.id, isS=selected?.id===org.id;
                return (
                  <g key={org.id}>
                    {(isH||isS)&&<circle cx={x} cy={y} r={r+8} fill={tc} fillOpacity={0.1}/>}
                    <circle cx={x} cy={y} r={r}
                      fill={tc} fillOpacity={isH||isS?0.95:0.75}
                      stroke={isS?'rgba(200,168,75,0.9)':isH?'rgba(244,240,232,0.6)':'rgba(20,14,10,0.4)'}
                      strokeWidth={isS?1.5:0.75}
                      style={{cursor:'pointer',transition:'r 0.1s'}}
                      onMouseEnter={e=>{setHovered(org);setTooltipPos({x:e.clientX,y:e.clientY});}}
                      onMouseLeave={()=>setHovered(null)}
                      onClick={e=>{e.stopPropagation();setSelected(s=>s?.id===org.id?null:org);}}
                    />
                  </g>
                );
            })}

            {/* AK/HI inset labels */}
            <text x={60} y={H-18} fill="rgba(212,206,196,0.2)" fontSize={9} fontFamily="monospace">AK / HI not shown</text>
            <text x={W-6} y={H-6} textAnchor="end" fill="rgba(212,206,196,0.15)" fontSize={8} fontFamily="monospace">
              {filtered.length} plotted · {pending} pending geo data
            </text>
          </svg>

          {/* Hover tooltip */}
          {hovered&&(
            <div style={{position:'fixed',left:tooltipPos.x+12,top:tooltipPos.y-52,
              background:'rgba(18,14,10,0.97)',border:'1px solid rgba(200,168,75,0.5)',
              padding:'0.5rem 0.75rem',pointerEvents:'none',zIndex:9999,fontFamily:'monospace',fontSize:'0.7rem',maxWidth:220}}>
              <div style={{color:'var(--paper)',fontWeight:600,marginBottom:'2px'}}>{hovered.name}</div>
              <div style={{color:TIER_COLORS[hovered.composite_tier],marginBottom:'2px'}}>{hovered.composite_tier} · {parseFloat(hovered.composite_score).toFixed(0)}%</div>
              <div style={{color:'rgba(212,206,196,0.5)'}}>{hovered.hq_city}{hovered.hq_state?`, ${hovered.hq_state}`:''}</div>
              {hovered.size_tier&&<div style={{color:'rgba(212,206,196,0.4)',marginTop:'2px'}}>Size: {hovered.size_tier} ({SIZE_LABELS[hovered.size_tier]})</div>}
            </div>
          )}
        </div>

        {/* Two-column below map: selected detail + legend */}
        <div style={{display:'grid',gridTemplateColumns:selected?'1fr 1fr':'1fr',gap:'1.5rem',alignItems:'start'}}>

          {/* Selected org detail */}
          {selected&&(
            <div style={{padding:'1.25rem',background:'rgba(244,240,232,0.03)',border:'1px solid rgba(212,206,196,0.15)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.6rem'}}>
                <div>
                  <div style={{fontFamily:'var(--serif)',fontSize:'1rem',fontWeight:700,color:'var(--paper)',lineHeight:1.2,marginBottom:'0.3rem'}}>{selected.name}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)'}}>{selected.category}</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:'transparent',border:'none',color:'var(--muted)',cursor:'pointer',fontFamily:'var(--mono)',fontSize:'0.7rem'}}>✕</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'0.5rem',marginBottom:'0.75rem'}}>
                {[
                  ['Composite',`${parseFloat(selected.composite_score).toFixed(0)}%`],
                  ['Tier',selected.composite_tier],
                  ['Headquarters',`${selected.hq_city||'—'}${selected.hq_state?`, ${selected.hq_state}`:''}`],
                  ['Scope',selected.geo_scope||'—'],
                  ['Size tier',selected.size_tier||'—'],
                  ['Members',selected.membership_count ? selected.membership_count.toLocaleString() : '—'],
                ].map(([k,v])=>(
                  <div key={k}>
                    <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.15rem'}}>{k}</div>
                    <div style={{fontFamily:'var(--mono)',fontSize:'0.75rem',color:'var(--gold)'}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:TIER_COLORS[selected.composite_tier]||'#888'}}/>
                <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:TIER_COLORS[selected.composite_tier]||'#888'}}>{selected.composite_tier}</span>
              </div>
            </div>
          )}

          {/* Legend + coverage */}
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
              {/* Tier legend */}
              <div style={{padding:'0.9rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.6rem'}}>Tier (color)</div>
                {TIERS.map(t=>(
                  <div key={t} style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.3rem'}}>
                    <div style={{width:9,height:9,borderRadius:'50%',background:TIER_COLORS[t],flexShrink:0}}/>
                    <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--muted)',flex:1}}>{t}</span>
                    <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'rgba(212,206,196,0.3)'}}>
                      {filtered.filter(o=>o.composite_tier===t).length}
                    </span>
                  </div>
                ))}
              </div>
              {/* Size legend */}
              <div style={{padding:'0.9rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.6rem'}}>Size (dot radius)</div>
                {Object.entries(SIZE_LABELS).map(([tier,label])=>(
                  <div key={tier} style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.3rem'}}>
                    <svg viewBox="0 0 16 16" style={{width:16,height:16,flexShrink:0}}>
                      <circle cx={8} cy={8} r={SIZE_RADIUS[tier]} fill="rgba(212,206,196,0.3)"/>
                    </svg>
                    <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)',flex:1,lineHeight:1.2}}>{tier}</span>
                    <span style={{fontFamily:'var(--mono)',fontSize:'0.58rem',color:'rgba(212,206,196,0.3)'}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coverage status */}
            <div style={{padding:'0.9rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.6rem'}}>Data Coverage</div>
              {[
                ['Total organizations', orgs.length],
                ['With geo coordinates', withGeo],
                ['With size data', withSize],
                ['Pending geo data', orgs.length - withGeo],
              ].map(([label,val])=>(
                <div key={label} style={{display:'flex',justifyContent:'space-between',marginBottom:'0.3rem'}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--muted)'}}>{label}</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color: label.includes('Pending') ? 'rgba(212,206,196,0.3)' : 'var(--gold)'}}>{val}</span>
                </div>
              ))}
              {withGeo === 0 && (
                <div style={{marginTop:'0.75rem',padding:'0.6rem',background:'rgba(200,168,75,0.06)',border:'1px solid rgba(200,168,75,0.15)'}}>
                  <p style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'rgba(200,168,75,0.6)',margin:0,lineHeight:1.6}}>
                    Geographic data is being added in a parallel session. This page will populate automatically as hq_lat / hq_lng values are written to the organizations table.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function hexRgb(hex) {
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r?`${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`:'128,128,128';
}
