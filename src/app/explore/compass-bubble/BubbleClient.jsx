'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

const TIERS = ['Cult','Cult Dynamics','High Control','Concerning','Mildly Culty','Healthy Group'];
const TC = {
  'Cult':          {fill:'#ff4466',stroke:'#cc1133',hi:'#ff99aa',bg:'rgba(255,68,102,0.1)',text:'#cc1133'},
  'Cult Dynamics': {fill:'#ff7733',stroke:'#cc4400',hi:'#ffaa77',bg:'rgba(255,119,51,0.1)',text:'#cc4400'},
  'High Control':  {fill:'#e6a800',stroke:'#b38200',hi:'#ffdd66',bg:'rgba(230,168,0,0.1)', text:'#9b6f00'},
  'Concerning':    {fill:'#7c5cbf',stroke:'#5a3a9e',hi:'#ccbbff',bg:'rgba(124,92,191,0.1)',text:'#5a3a9e'},
  'Mildly Culty':  {fill:'#1aaa80',stroke:'#117755',hi:'#66ffcc',bg:'rgba(26,170,128,0.1)',text:'#117755'},
  'Healthy Group': {fill:'#1a8fbf',stroke:'#116688',hi:'#66ddff',bg:'rgba(26,143,191,0.1)',text:'#116688'},
};

export default function BubbleClient() {
  const svgRef    = useRef(null);
  const wrapRef   = useRef(null);
  const [orgs, setOrgs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [hovered, setHovered]   = useState(null);
  const [ttPos,   setTtPos]     = useState({x:0,y:0});
  const [activeTiers, setActiveTiers] = useState(new Set(TIERS));
  const [showLabels,  setShowLabels]  = useState(false);
  const [showGrid,    setShowGrid]    = useState(true);
  const [showQuad,    setShowQuad]    = useState(true);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/political_scores?select=economic_axis,authority_axis,political_quadrant,organizations(name,slug,category,composite_tier,composite_score)`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } })
      .then(r => r.json())
      .then(data => {
        const mapped = (Array.isArray(data) ? data : [])
          .filter(d => d.organizations && d.economic_axis != null)
          .map(d => ({
            name:  d.organizations.name,
            slug:  d.organizations.slug,
            cat:   d.organizations.category,
            tier:  d.organizations.composite_tier || 'Healthy Group',
            score: parseFloat(d.organizations.composite_score || 0),
            econ:  parseFloat(d.economic_axis),
            auth:  parseFloat(d.authority_axis),
            quad:  d.political_quadrant,
          }));
        setOrgs(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleTier = useCallback(tier => {
    setActiveTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) { if (next.size > 1) next.delete(tier); }
      else next.add(tier);
      return next;
    });
  }, []);

  const filtered = orgs.filter(o => activeTiers.has(o.tier));

  // SVG coordinate helpers — responsive via viewBox
  const VW = 640, VH = 560;
  const PAD = { t:44, r:28, b:52, l:52 };
  const CW = VW - PAD.l - PAD.r;
  const CH = VH - PAD.t  - PAD.b;
  const sx = econ => PAD.l + (econ + 5) / 10 * CW;
  const sy = auth => PAD.t  + (5 - auth) / 10 * CH;
  const sr = score => 4 + (score / 100) * 22;

  function handleMouseMove(e, org) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHovered(org);
    setTtPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const NS = 'http://www.w3.org/2000/svg';

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ borderBottom:'1px solid rgba(212,206,196,0.1)', padding:'1.25rem 0 0.9rem',
        background:'var(--ink)', position:'sticky', top:'60px', zIndex:50 }}>
        <div className="container--wide">
          <div style={{ display:'flex', alignItems:'baseline', gap:'0.5rem', marginBottom:'0.75rem' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.6rem', letterSpacing:'0.15em',
              textTransform:'uppercase', color:'var(--gold)' }}>
              <Link href="/explore" style={{color:'var(--gold)'}}>Explorer</Link> —
            </span>
            <h1 style={{ fontFamily:'var(--serif)', fontSize:'clamp(1.2rem,2.5vw,1.8rem)',
              color:'var(--paper)', display:'inline', marginLeft:'0.4rem' }}>
              Bubble Compass
            </h1>
          </div>
          {/* Tier filter buttons */}
          <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', alignItems:'center', marginBottom:'0.5rem' }}>
            {TIERS.map(t => (
              <button key={t} onClick={() => toggleTier(t)}
                style={{ fontFamily:'var(--mono)', fontSize:'0.56rem', padding:'0.2rem 0.55rem',
                  background: activeTiers.has(t) ? TC[t].bg : 'transparent',
                  border:`1px solid ${activeTiers.has(t) ? TC[t].stroke : 'rgba(212,206,196,0.15)'}`,
                  color: activeTiers.has(t) ? TC[t].fill : 'var(--muted)',
                  cursor:'pointer', borderRadius:3, opacity: activeTiers.has(t) ? 1 : 0.45,
                  transition:'all 0.15s' }}>
                {t}
              </button>
            ))}
            <div style={{ width:1, height:18, background:'rgba(212,206,196,0.1)', margin:'0 4px' }} />
            <label style={{ display:'flex', alignItems:'center', gap:'0.3rem', cursor:'pointer',
              fontFamily:'var(--mono)', fontSize:'0.58rem', color:'var(--muted)' }}>
              <input type="checkbox" checked={showGrid} onChange={e=>setShowGrid(e.target.checked)}
                style={{accentColor:'var(--gold)'}} /> Grid
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:'0.3rem', cursor:'pointer',
              fontFamily:'var(--mono)', fontSize:'0.58rem', color:'var(--muted)' }}>
              <input type="checkbox" checked={showQuad} onChange={e=>setShowQuad(e.target.checked)}
                style={{accentColor:'var(--gold)'}} /> Quadrants
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:'0.3rem', cursor:'pointer',
              fontFamily:'var(--mono)', fontSize:'0.58rem', color:'var(--muted)' }}>
              <input type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)}
                style={{accentColor:'var(--gold)'}} /> Labels
            </label>
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.56rem', color:'var(--muted)', marginLeft:'auto' }}>
              {filtered.length} orgs · size = cultiness score
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div ref={wrapRef} style={{ flex:1, position:'relative', minHeight:400, padding:'0' }}
        onMouseLeave={() => setHovered(null)}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', minHeight:400 }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--gold)', letterSpacing:'0.2em' }}>LOADING…</span>
          </div>
        ) : (
          <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width:'100%', display:'block' }}
            xmlns={NS}>
            <defs>
              {filtered.map(org => {
                const c = TC[org.tier]; const id = 'bg'+org.slug?.replace(/[^a-z0-9]/gi,'');
                return (
                  <radialGradient key={id} id={id} cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.45" />
                    <stop offset="45%" stopColor={c.fill} stopOpacity="1" />
                    <stop offset="100%" stopColor={c.stroke} stopOpacity="1" />
                  </radialGradient>
                );
              })}
              <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Quadrant shading */}
            {showQuad && [
              {x:-5,y:5,w:5,h:10, fill:'rgba(100,140,255,0.04)', lx:-2.5, ly:4.1, label:'Authoritarian Left'},
              {x:0, y:5,w:5,h:10, fill:'rgba(255,80,80,0.05)',   lx:2.5,  ly:4.1, label:'Authoritarian Right'},
              {x:-5,y:0,w:5,h:5,  fill:'rgba(50,200,150,0.04)',  lx:-2.5, ly:-4.0,label:'Libertarian Left'},
              {x:0, y:0,w:5,h:5,  fill:'rgba(200,180,50,0.04)',  lx:2.5,  ly:-4.0,label:'Libertarian Right'},
            ].map(({x,y,w,h,fill,lx,ly,label}) => (
              <g key={label}>
                <rect x={sx(x)} y={sy(y)} width={w/10*CW} height={h/10*CH} fill={fill} rx={4} />
                <text x={sx(lx)} y={sy(ly)} textAnchor="middle"
                  fontSize={10} fill="rgba(212,206,196,0.2)" fontFamily="var(--mono)">{label}</text>
              </g>
            ))}

            {/* Grid */}
            {showGrid && [-4,-3,-2,-1,1,2,3,4].map(v => (
              <g key={v}>
                <line x1={sx(v)} y1={sy(-5)} x2={sx(v)} y2={sy(5)} stroke="rgba(212,206,196,0.07)" strokeWidth={0.5} />
                <line x1={sx(-5)} y1={sy(v)} x2={sx(5)} y2={sy(v)} stroke="rgba(212,206,196,0.07)" strokeWidth={0.5} />
              </g>
            ))}

            {/* Axes */}
            <line x1={sx(-5)} y1={sy(0)} x2={sx(5)} y2={sy(0)} stroke="rgba(212,206,196,0.25)" strokeWidth={1} />
            <line x1={sx(0)} y1={sy(-5)} x2={sx(0)} y2={sy(5)} stroke="rgba(212,206,196,0.25)" strokeWidth={1} />

            {/* Axis labels */}
            <text x={sx(5)+6}  y={sy(0)+4} fontSize={11} fill="rgba(212,206,196,0.6)" fontFamily="var(--mono)" textAnchor="start">Right →</text>
            <text x={sx(-5)-6} y={sy(0)+4} fontSize={11} fill="rgba(212,206,196,0.6)" fontFamily="var(--mono)" textAnchor="end">← Left</text>
            <text x={sx(0)} y={sy(5)-10}  fontSize={11} fill="rgba(212,206,196,0.6)" fontFamily="var(--mono)" textAnchor="middle">Authoritarian</text>
            <text x={sx(0)} y={sy(-5)+18} fontSize={11} fill="rgba(212,206,196,0.6)" fontFamily="var(--mono)" textAnchor="middle">Libertarian</text>

            {/* Axis titles */}
            <text x={PAD.l+CW/2} y={VH-6} fontSize={12} fill="rgba(212,206,196,0.5)" fontFamily="var(--mono)" textAnchor="middle" fontWeight={500}>Economic axis</text>
            <text x={14} y={PAD.t+CH/2} fontSize={12} fill="rgba(212,206,196,0.5)" fontFamily="var(--mono)" textAnchor="middle" fontWeight={500}
              transform={`rotate(-90,14,${PAD.t+CH/2})`}>Authority axis</text>

            {/* Tick labels */}
            {[-4,-2,2,4].map(v=>(
              <g key={v}>
                <text x={sx(v)} y={sy(0)+16} fontSize={9} fill="rgba(212,206,196,0.35)" fontFamily="var(--mono)" textAnchor="middle">{v>0?'+':''}{v}</text>
                <text x={sx(0)-8} y={sy(v)+4} fontSize={9} fill="rgba(212,206,196,0.35)" fontFamily="var(--mono)" textAnchor="end">{v>0?'+':''}{v}</text>
              </g>
            ))}

            {/* Bubbles — sorted small-first so large ones render on top */}
            {[...filtered].sort((a,b)=>a.score-b.score).map(org => {
              const x=sx(org.econ), y=sy(org.auth), r=sr(org.score);
              const c=TC[org.tier]; const gradId='bg'+org.slug?.replace(/[^a-z0-9]/gi,'');
              return (
                <g key={org.slug||org.name} style={{cursor:'pointer'}}
                  onMouseMove={e=>handleMouseMove(e,org)}
                  onMouseLeave={()=>setHovered(null)}>
                  {/* Glow ring */}
                  <circle cx={x} cy={y} r={r+3} fill="none" stroke={c.fill} strokeWidth={1} opacity={0.2} />
                  {/* Main bubble */}
                  <circle cx={x} cy={y} r={r} fill={`url(#${gradId})`}
                    stroke={c.stroke} strokeWidth={0.8} filter="url(#ds)"
                    opacity={hovered && hovered.slug !== org.slug ? 0.7 : 1} />
                  {/* Specular */}
                  <circle cx={x-r*0.28} cy={y-r*0.28} r={r*0.22} fill="rgba(255,255,255,0.38)" />
                  {/* Score label inside if big enough */}
                  {r >= 12 && (
                    <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle"
                      fontSize={r>=18?11:9} fill="white" fontWeight={500} fontFamily="var(--mono)"
                      style={{pointerEvents:'none'}}>
                      {Math.round(org.score)}%
                    </text>
                  )}
                  {/* Org name label */}
                  {showLabels && (
                    <text x={x+r+3} y={y+4} fontSize={9} fill="rgba(212,206,196,0.6)"
                      fontFamily="var(--mono)" style={{pointerEvents:'none'}}>
                      {org.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Tooltip */}
        {hovered && (
          <div style={{
            position:'absolute',
            left: Math.min(ttPos.x+16, (wrapRef.current?.clientWidth||600)-240),
            top:  Math.max(ttPos.y-10, 4),
            background:'var(--ink)', border:'1px solid rgba(212,206,196,0.15)',
            borderRadius:6, padding:'10px 14px', pointerEvents:'none', minWidth:200, zIndex:20
          }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:'0.82rem', fontWeight:700,
              color:'var(--paper)', marginBottom:3 }}>{hovered.name}</div>
            <div style={{ display:'inline-block', fontFamily:'var(--mono)', fontSize:'0.6rem',
              padding:'2px 8px', borderRadius:3, marginBottom:8,
              background:TC[hovered.tier]?.bg, color:TC[hovered.tier]?.text,
              border:`1px solid ${TC[hovered.tier]?.stroke}55` }}>
              {hovered.tier}
            </div>
            {[['Cultiness', Math.round(hovered.score)+'%'],
              ['Economic',  (hovered.econ>0?'+':'')+hovered.econ+(hovered.econ>0?' (Right)':hovered.econ<0?' (Left)':' (Center)')],
              ['Authority', (hovered.auth>0?'+':'')+hovered.auth+(hovered.auth>1?' (Auth)':hovered.auth<-1?' (Lib)':' (Neutral)')],
              ['Category',  hovered.cat],
            ].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:12,
                fontFamily:'var(--mono)', fontSize:'0.6rem', color:'var(--muted)', marginTop:2 }}>
                <span>{k}</span><span style={{color:'var(--paper)'}}>{v}</span>
              </div>
            ))}
            {hovered.slug && (
              <a href={`/org/${hovered.slug}`}
                style={{ display:'block', marginTop:8, fontFamily:'var(--mono)', fontSize:'0.58rem',
                  color:'var(--gold)', textDecoration:'none' }}>
                Full assessment →
              </a>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ borderTop:'1px solid rgba(212,206,196,0.08)', padding:'0.75rem 0',
        background:'rgba(244,240,232,0.01)' }}>
        <div className="container--wide">
          <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
            {TIERS.map(t=>(
              <div key={t} style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:TC[t].fill }} />
                <span style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', color:'rgba(212,206,196,0.45)' }}>{t}</span>
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginLeft:'auto',
              fontFamily:'var(--mono)', fontSize:'0.56rem', color:'rgba(212,206,196,0.3)' }}>
              Size = cultiness:
              {[20,45,80].map((s,i)=>(
                <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:sr(s)*2+'px', height:sr(s)*2+'px', maxWidth:32, maxHeight:32,
                    borderRadius:'50%', background:'rgba(212,206,196,0.2)', display:'inline-block',
                    minWidth: sr(s)+'px' }} />
                  {s}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
