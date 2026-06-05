'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';

const TIER_COLORS = { 'Super Culty':'#c02020','Kinda Culty':'#b07030','Not Culty':'#30a060' };

function boxStats(scores) {
  if (!scores.length) return null;
  const s = [...scores].sort((a,b)=>a-b);
  const n = s.length;
  const q = p => { const i=(p/100)*(n-1); const lo=Math.floor(i); const hi=Math.ceil(i); return s[lo]+(s[hi]-s[lo])*(i-lo); };
  const q1=q(25),med=q(50),q3=q(75),mean=s.reduce((a,b)=>a+b,0)/n;
  const iqr=q3-q1;
  const lo=q1-1.5*iqr, hi=q3+1.5*iqr;
  const outliers=s.filter(v=>v<lo||v>hi);
  const whiskerLo=Math.min(...s.filter(v=>v>=lo));
  const whiskerHi=Math.max(...s.filter(v=>v<=hi));
  return {q1,med,q3,mean,whiskerLo,whiskerHi,outliers,n,iqr};
}

export default function DistributionsClient({ orgs=[] }) {
  const [sortMode, setSortMode] = useState('median'); // median | name | count | iqr
  const [minOrgs, setMinOrgs] = useState(3);
  const [hovered, setHovered] = useState(null);

  const categories = useMemo(() => {
    const map = {};
    for (const o of orgs) {
      if (!map[o.category]) map[o.category] = [];
      map[o.category].push(parseFloat(o.composite_score));
    }
    return Object.entries(map)
      .map(([cat,scores])=>({cat,scores,stats:boxStats(scores)}))
      .filter(c=>c.stats && c.stats.n >= minOrgs);
  }, [orgs, minOrgs]);

  const sorted = useMemo(() => {
    return [...categories].sort((a,b)=>{
      if (sortMode==='median') return b.stats.med-a.stats.med;
      if (sortMode==='name') return a.cat.localeCompare(b.cat);
      if (sortMode==='count') return b.stats.n-a.stats.n;
      if (sortMode==='iqr') return b.stats.iqr-a.stats.iqr;
      return 0;
    });
  }, [categories, sortMode]);

  // SVG layout
  const ROW_H = 38, PAD_L = 140, PAD_R = 60, PAD_T = 40, W = 800;
  const INNER_W = W - PAD_L - PAD_R;
  const H = PAD_T + sorted.length * ROW_H + 40;
  const x = (v) => PAD_L + (v / 100) * INNER_W;
  const cy = (i) => PAD_T + i * ROW_H + ROW_H / 2;

  function tierAtScore(s) {
    if (s>=71) return 'Super Culty';
    if (s>=41) return 'Kinda Culty';
    return 'Not Culty';
  }

  return (
    <div style={{minHeight:'100vh'}}>
      <div style={{borderBottom:'1px solid rgba(212,206,196,0.1)',padding:'2rem 0 1.5rem',background:'var(--ink)',position:'sticky',top:'60px',zIndex:50}}>
        <div className="container--wide">
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
            <div>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)'}}>
                <Link href="/explore" style={{color:'var(--gold)'}}>Explorer</Link> —
              </span>
              <h1 style={{fontFamily:'var(--serif)',fontSize:'clamp(1.3rem,3vw,2rem)',color:'var(--paper)',display:'inline',marginLeft:'0.4rem'}}>Category Distributions</h1>
            </div>
          </div>
          <div style={{display:'flex',gap:'1rem',marginTop:'1rem',alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'var(--muted)'}}>Sort by:</span>
            {[['median','Median'],['iqr','Spread (IQR)'],['count','Count'],['name','Name']].map(([v,l])=>(
              <button key={v} onClick={()=>setSortMode(v)}
                style={{fontFamily:'var(--mono)',fontSize:'0.63rem',padding:'0.25rem 0.6rem',
                  background:sortMode===v?'rgba(200,168,75,0.12)':'transparent',
                  border:`1px solid ${sortMode===v?'rgba(200,168,75,0.4)':'rgba(212,206,196,0.18)'}`,
                  color:sortMode===v?'var(--gold)':'var(--muted)',cursor:'pointer'}}>{l}</button>
            ))}
            <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'var(--muted)',marginLeft:'0.5rem'}}>Min orgs:</span>
            <input type="range" min={1} max={15} value={minOrgs} onChange={e=>setMinOrgs(Number(e.target.value))} style={{width:80,accentColor:'var(--gold)'}}/>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--gold)'}}>{minOrgs}</span>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'rgba(212,206,196,0.3)',marginLeft:'auto'}}>{sorted.length} categories shown</span>
          </div>
        </div>
      </div>

      <div className="container--wide" style={{paddingTop:'1.5rem',paddingBottom:'4rem',overflowX:'auto'}}>
        <div style={{marginBottom:'1rem',display:'flex',gap:'1.5rem',alignItems:'center',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <div style={{width:28,height:2,background:'rgba(200,168,75,0.6)'}}/>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)'}}>Median</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <div style={{width:12,height:10,border:'1px solid rgba(200,168,75,0.5)',background:'rgba(200,168,75,0.08)'}}/>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)'}}>IQR (25–75%)</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <div style={{width:16,height:1,background:'rgba(212,206,196,0.3)'}}/>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)'}}>Whiskers (1.5×IQR)</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'rgba(200,168,75,0.5)'}}/>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)'}}>Outliers</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <div style={{width:8,height:8,transform:'rotate(45deg)',background:'rgba(160,210,255,0.5)'}}/>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)'}}>Mean ◆</span>
          </div>
        </div>

        <div style={{overflowX:'auto'}}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',maxWidth:W,display:'block',fontFamily:'monospace'}}>

            {/* Tier threshold background strips */}
            {[[0,41,'Not Culty'],[41,71,'Kinda Culty'],[71,100,'Super Culty']].map(([x0,x1,t])=>(
              <rect key={t} x={x(x0)} y={PAD_T-8} width={x(x1)-x(x0)} height={sorted.length*ROW_H+16}
                fill={TIER_COLORS[t]} fillOpacity={0.05}/>
            ))}

            {/* X axis grid + labels */}
            {[0,10,20,30,40,50,60,70,80,90,100].map(v=>(
              <g key={v}>
                <line x1={x(v)} y1={PAD_T-10} x2={x(v)} y2={PAD_T+sorted.length*ROW_H+6} stroke="rgba(212,206,196,0.06)" strokeWidth="1"/>
                <text x={x(v)} y={PAD_T-14} textAnchor="middle" fill="rgba(212,206,196,0.3)" fontSize={9}>{v}%</text>
              </g>
            ))}

            {/* Tier threshold lines */}
            {[21,41,56,71,85].map(v=>(
              <line key={v} x1={x(v)} y1={PAD_T-10} x2={x(v)} y2={PAD_T+sorted.length*ROW_H+6}
                stroke="rgba(212,206,196,0.15)" strokeWidth="1" strokeDasharray="2 3"/>
            ))}

            {/* Box plots */}
            {sorted.map((cat,i) => {
              const {q1,med,q3,mean,whiskerLo,whiskerHi,outliers,n} = cat.stats;
              const yc = cy(i);
              const bh = ROW_H * 0.52;
              const tierColor = TIER_COLORS[tierAtScore(med)] || '#888';
              const isH = hovered?.cat===cat.cat;
              return (
                <g key={cat.cat}
                  onMouseEnter={()=>setHovered(cat)}
                  onMouseLeave={()=>setHovered(null)}
                  style={{cursor:'default'}}>
                  {/* Row bg on hover */}
                  {isH&&<rect x={PAD_L} y={yc-ROW_H/2} width={INNER_W} height={ROW_H} fill="rgba(200,168,75,0.04)"/>}
                  {/* Whisker line */}
                  <line x1={x(whiskerLo)} y1={yc} x2={x(whiskerHi)} y2={yc} stroke="rgba(212,206,196,0.3)" strokeWidth="1"/>
                  {/* Whisker caps */}
                  <line x1={x(whiskerLo)} y1={yc-4} x2={x(whiskerLo)} y2={yc+4} stroke="rgba(212,206,196,0.35)" strokeWidth="1"/>
                  <line x1={x(whiskerHi)} y1={yc-4} x2={x(whiskerHi)} y2={yc+4} stroke="rgba(212,206,196,0.35)" strokeWidth="1"/>
                  {/* IQR box */}
                  <rect x={x(q1)} y={yc-bh/2} width={x(q3)-x(q1)} height={bh}
                    fill={`rgba(${hexRgb(tierColor)},0.12)`} stroke={`rgba(${hexRgb(tierColor)},0.5)`} strokeWidth="1"/>
                  {/* Median line */}
                  <line x1={x(med)} y1={yc-bh/2} x2={x(med)} y2={yc+bh/2}
                    stroke="rgba(200,168,75,0.85)" strokeWidth="2"/>
                  {/* Mean diamond */}
                  {(()=>{const s=5;return<path d={`M${x(mean)} ${yc-s} L${x(mean)+s} ${yc} L${x(mean)} ${yc+s} L${x(mean)-s} ${yc}Z`} fill="rgba(160,210,255,0.55)" stroke="rgba(160,210,255,0.3)" strokeWidth="0.5"/>;})()}
                  {/* Outliers */}
                  {outliers.map((v,j)=>(
                    <circle key={j} cx={x(v)} cy={yc} r={3} fill={`rgba(${hexRgb(tierColor)},0.6)`} stroke="none"/>
                  ))}
                  {/* Category label */}
                  <text x={PAD_L-6} y={yc+4} textAnchor="end" fill={isH?'var(--paper)':'rgba(212,206,196,0.6)'} fontSize={10} fontFamily="monospace">
                    {cat.cat}
                  </text>
                  {/* Count */}
                  <text x={W-PAD_R+4} y={yc+4} textAnchor="start" fill="rgba(212,206,196,0.3)" fontSize={9} fontFamily="monospace">
                    {n}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover detail */}
        {hovered&&hovered.stats&&(
          <div style={{marginTop:'1.5rem',padding:'1rem 1.25rem',background:'rgba(244,240,232,0.03)',border:'1px solid rgba(212,206,196,0.12)',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:'1rem',maxWidth:600}}>
            <div style={{gridColumn:'1/-1',fontFamily:'var(--serif)',fontSize:'1rem',fontWeight:700,color:'var(--paper)',marginBottom:'0.3rem'}}>{hovered.cat}</div>
            {[['n','Count'],[' med','Median'],[' mean','Mean'],['q1','Q1 (25th)'],['q3','Q3 (75th)'],['iqr','IQR'],['whiskerLo','Min (exc outliers)'],['whiskerHi','Max (exc outliers)']].map(([k,l])=>(
              <div key={k}>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.2rem'}}>{l}</div>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.85rem',color:'var(--gold)'}}>
                  {k.trim()==='n'?hovered.stats.n:hovered.stats[k.trim()]?.toFixed(1)+'%'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function hexRgb(hex) {
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r?`${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`:'128,128,128';
}
