'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';

const TIER_ORDER = ['Cult','Cult Dynamics','High Control','Concerning','Mildly Culty','Healthy Group'];
const TIER_COLORS = {
  'Cult':          '#c02020',
  'Cult Dynamics': '#c04040',
  'High Control':  '#b07030',
  'Concerning':    '#a09040',
  'Mildly Culty':  '#6a9840',
  'Healthy Group': '#30a060',
};
const TIER_RANGES = {
  'Cult':'85–100%','Cult Dynamics':'71–84%','High Control':'56–70%',
  'Concerning':'41–55%','Mildly Culty':'21–40%','Healthy Group':'0–20%',
};
const TIER_THRESH = [
  {x:20,label:'Healthy Group'},
  {x:40,label:'Mildly Culty'},
  {x:55,label:'Concerning'},
  {x:70,label:'High Control'},
  {x:85,label:'Cult'},
];
const ANNOTATIONS = [
  {score:19, label:'NAACP 19%'},
  {score:36, label:'Dem. Party 36%'},
  {score:58, label:'Heritage Fdn 58%'},
  {score:87, label:'MAGA 87%'},
  {score:100,label:'Scientology 100%'},
];

function useWindowWidth() {
  if (typeof window === 'undefined') return 1200;
  const [w, setW] = useState(window.innerWidth);
  return w;
}

// Simple stats helpers (no external deps)
function mean(arr) { return arr.reduce((a,b)=>a+b,0)/arr.length; }
function stddev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a,b)=>a+(b-m)**2,0)/arr.length);
}
function skewness(arr) {
  const m = mean(arr), s = stddev(arr);
  if (s === 0) return 0;
  return arr.reduce((a,b)=>a+((b-m)/s)**3,0)/arr.length;
}
function normalPDF(x, mu, sigma) {
  return (1/(sigma*Math.sqrt(2*Math.PI)))*Math.exp(-0.5*((x-mu)/sigma)**2);
}

export default function FindingsClient({ orgs=[] }) {
  const [varianceView, setVarianceView] = useState('all');
  const [nOrgs, setNOrgs] = useState(30);
  const [hoveredDist, setHoveredDist] = useState(null);
  const [hoveredScatter, setHoveredScatter] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({x:0,y:0});

  const validOrgs = useMemo(() =>
    orgs.filter(o => o.composite_score != null && !isNaN(parseFloat(o.composite_score))),
    [orgs]
  );

  const scores = useMemo(() => validOrgs.map(o => parseFloat(o.composite_score)), [validOrgs]);
  const mu = useMemo(() => mean(scores), [scores]);
  const sigma = useMemo(() => stddev(scores), [scores]);
  const skew = useMemo(() => skewness(scores), [scores]);

  // Histogram bins (5-point)
  const bins = useMemo(() => {
    const b = [];
    for (let i = 0; i < 100; i += 5) {
      const center = i + 2.5;
      const count = scores.filter(s => s >= i && s < i+5).length;
      let tier = 'Healthy Group';
      if (center >= 85) tier = 'Cult';
      else if (center >= 71) tier = 'Cult Dynamics';
      else if (center >= 56) tier = 'High Control';
      else if (center >= 41) tier = 'Concerning';
      else if (center >= 21) tier = 'Mildly Culty';
      b.push({start:i, center, count, tier});
    }
    return b;
  }, [scores]);

  const maxCount = useMemo(() => Math.max(...bins.map(b=>b.count)), [bins]);

  // Normal curve points
  const normalPoints = useMemo(() => {
    const pts = [];
    for (let x = 0; x <= 100; x += 0.5) {
      pts.push({x, y: normalPDF(x, mu, sigma) * scores.length * 5});
    }
    return pts;
  }, [mu, sigma, scores.length]);

  const maxNormalY = useMemo(() => Math.max(...normalPoints.map(p=>p.y)), [normalPoints]);
  const chartMaxY = useMemo(() => Math.max(maxCount, maxNormalY) * 1.15, [maxCount, maxNormalY]);

  // Headline stats
  const above56 = scores.filter(s=>s>=56).length;
  const above71 = scores.filter(s=>s>=71).length;
  const above85 = scores.filter(s=>s>=85).length;
  const pct = (n) => `${(100*n/scores.length).toFixed(0)}%`;

  // Instrument variance
  const varianceOrgs = useMemo(() =>
    orgs.filter(o => o.composite_score != null && o.youngs_score != null && !isNaN(parseFloat(o.youngs_score)))
      .map(o => ({
        ...o,
        composite: parseFloat(o.composite_score),
        youngsNorm: parseFloat(o.youngs_score) * 10,
        variance: parseFloat(o.composite_score) - parseFloat(o.youngs_score) * 10,
      })),
    [orgs]
  );

  const meanVariance = useMemo(() => mean(varianceOrgs.map(o=>o.variance)), [varianceOrgs]);
  const stdVariance = useMemo(() => stddev(varianceOrgs.map(o=>o.variance)), [varianceOrgs]);
  const maxPositive = useMemo(() => Math.max(...varianceOrgs.map(o=>o.variance)), [varianceOrgs]);
  const maxNegative = useMemo(() => Math.min(...varianceOrgs.map(o=>o.variance)), [varianceOrgs]);

  // Variance bar chart data
  const varianceBars = useMemo(() => {
    let sorted;
    if (varianceView === 'composite') sorted = [...varianceOrgs].sort((a,b)=>b.variance-a.variance).slice(0,nOrgs);
    else if (varianceView === 'youngs') sorted = [...varianceOrgs].sort((a,b)=>a.variance-b.variance).slice(0,nOrgs);
    else sorted = [...varianceOrgs].sort((a,b)=>Math.abs(b.variance)-Math.abs(a.variance)).slice(0,nOrgs).sort((a,b)=>b.variance-a.variance);
    return sorted;
  }, [varianceOrgs, varianceView, nOrgs]);

  const maxAbsVariance = useMemo(() => Math.max(...varianceBars.map(o=>Math.abs(o.variance)), 1), [varianceBars]);

  // SVG layout helpers
  const HIST_W = 800, HIST_H = 320, HIST_PAD = {l:52,r:20,t:30,b:44};
  const HIST_INNER_W = HIST_W - HIST_PAD.l - HIST_PAD.r;
  const HIST_INNER_H = HIST_H - HIST_PAD.t - HIST_PAD.b;
  const histX = (score) => HIST_PAD.l + (score/100)*HIST_INNER_W;
  const histY = (count) => HIST_PAD.t + HIST_INNER_H - (count/chartMaxY)*HIST_INNER_H;

  const BAR_W = HIST_INNER_W / 20 - 1; // 20 bins of 5

  // Scatter layout
  const SC_W = 600, SC_H = 500, SC_PAD = {l:60,r:20,t:20,b:60};
  const SC_IW = SC_W - SC_PAD.l - SC_PAD.r;
  const SC_IH = SC_H - SC_PAD.t - SC_PAD.b;
  const scX = (v) => SC_PAD.l + (v/100)*SC_IW;
  const scY = (v) => SC_PAD.t + SC_IH - (v/100)*SC_IH;

  return (
    <section className="section">
      <div className="container--wide">

        {/* Headline stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'3rem'}}>
          {[
            ['Organizations', scores.length, ''],
            ['High Control or above', pct(above56), '≥ 56%'],
            ['Cult Dynamics or above', pct(above71), '≥ 71%'],
            ['Cult tier', pct(above85), '≥ 85%'],
          ].map(([label,value,sub])=>(
            <div key={label} style={{padding:'1.25rem',background:'rgba(244,240,232,0.03)',border:'1px solid rgba(212,206,196,0.12)'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.4rem'}}>{label}</div>
              <div style={{fontFamily:'var(--serif)',fontSize:'2rem',fontWeight:700,color:'var(--gold)',lineHeight:1}}>{value}</div>
              {sub&&<div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'rgba(212,206,196,0.35)',marginTop:'0.3rem'}}>{sub}</div>}
            </div>
          ))}
        </div>

        {/* ── CHART 1: Distribution histogram ── */}
        <div style={{marginBottom:'3rem'}}>
          <div style={{fontFamily:'var(--mono)',fontSize:'0.63rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.4rem'}}>Distribution</div>
          <h2 style={{fontFamily:'var(--serif)',fontSize:'1.5rem',fontWeight:700,color:'var(--paper)',marginBottom:'0.3rem',marginTop:0}}>Composite Score Distribution</h2>
          <p style={{fontFamily:'var(--mono)',fontSize:'0.68rem',color:'var(--muted)',marginBottom:'1.5rem',lineHeight:1.6}}>
            Organization counts per 5-point bin. Dashed curve: normal distribution (μ={mu.toFixed(1)}, σ={sigma.toFixed(1)}).
            Tier thresholds marked. Hover bars for details.
          </p>

          <div style={{overflowX:'auto'}}>
            <svg viewBox={`0 0 ${HIST_W} ${HIST_H}`} style={{width:'100%',maxWidth:HIST_W,display:'block',fontFamily:'monospace'}}>

              {/* Tier background shading */}
              {[
                [0,20,'Healthy Group'],[20,40,'Mildly Culty'],[40,55,'Concerning'],
                [55,70,'High Control'],[70,85,'Cult Dynamics'],[85,100,'Cult'],
              ].map(([x0,x1,tier])=>(
                <rect key={tier}
                  x={histX(x0)} y={HIST_PAD.t}
                  width={histX(x1)-histX(x0)} height={HIST_INNER_H}
                  fill={TIER_COLORS[tier]} fillOpacity={0.07}/>
              ))}

              {/* Y grid lines */}
              {[0.25,0.5,0.75,1].map(frac=>{
                const y = HIST_PAD.t + HIST_INNER_H*(1-frac);
                const gridCount = Math.round(chartMaxY*frac);
                return (<g key={frac}>
                  <line x1={HIST_PAD.l} y1={y} x2={HIST_PAD.l+HIST_INNER_W} y2={y}
                    stroke="rgba(212,206,196,0.07)" strokeWidth="1"/>
                  <text x={HIST_PAD.l-6} y={y+4} textAnchor="end"
                    fill="rgba(212,206,196,0.35)" fontSize={10}>{gridCount}</text>
                </g>);
              })}

              {/* Bars */}
              {bins.map(bin=>{
                if (bin.count === 0) return null;
                const x = histX(bin.start);
                const barH = (bin.count/chartMaxY)*HIST_INNER_H;
                const y = HIST_PAD.t + HIST_INNER_H - barH;
                const isHovered = hoveredDist?.center === bin.center;
                return(
                  <rect key={bin.start}
                    x={x+0.5} y={y}
                    width={BAR_W} height={barH}
                    fill={TIER_COLORS[bin.tier]}
                    fillOpacity={isHovered ? 1 : 0.8}
                    stroke={isHovered ? 'rgba(244,240,232,0.6)' : 'rgba(26,23,20,0.3)'}
                    strokeWidth={isHovered ? 1.5 : 0.5}
                    style={{cursor:'pointer'}}
                    onMouseEnter={(e)=>{setHoveredDist(bin);setTooltipPos({x:e.clientX,y:e.clientY});}}
                    onMouseLeave={()=>setHoveredDist(null)}
                  />
                );
              })}

              {/* Normal curve */}
              {(()=>{
                const pts = normalPoints.filter(p=>p.x>=0&&p.x<=100);
                const d = pts.map((p,i)=>`${i===0?'M':'L'}${histX(p.x).toFixed(1)},${histY(p.y).toFixed(1)}`).join(' ');
                return <path d={d} fill="none" stroke="rgba(212,206,196,0.4)" strokeWidth="1.5" strokeDasharray="4 3"/>;
              })()}

              {/* Tier threshold lines */}
              {TIER_THRESH.map(({x,label})=>(
                <g key={x}>
                  <line x1={histX(x)} y1={HIST_PAD.t} x2={histX(x)} y2={HIST_PAD.t+HIST_INNER_H}
                    stroke="rgba(212,206,196,0.2)" strokeWidth="1" strokeDasharray="3 3"/>
                  <text x={histX(x)-3} y={HIST_PAD.t+8} textAnchor="end"
                    fill="rgba(212,206,196,0.25)" fontSize={8} transform={`rotate(-90,${histX(x)-3},${HIST_PAD.t+8})`}>{label}</text>
                </g>
              ))}

              {/* Annotations for notable orgs */}
              {ANNOTATIONS.map(({score,label})=>{
                const binIdx = Math.min(Math.floor(score/5), bins.length-1);
                const bh = bins[binIdx]?.count || 0;
                const barTopY = histY(bh);
                const ax = histX(score);
                const side = score > 50 ? -1 : 1;
                return(<g key={label}>
                  <circle cx={ax} cy={barTopY-4} r={2} fill="rgba(200,168,75,0.7)"/>
                  <text x={ax + side*8} y={barTopY-10} textAnchor={side>0?'start':'end'}
                    fill="rgba(200,168,75,0.65)" fontSize={8.5}>{label}</text>
                </g>);
              })}

              {/* X axis */}
              <line x1={HIST_PAD.l} y1={HIST_PAD.t+HIST_INNER_H} x2={HIST_PAD.l+HIST_INNER_W} y2={HIST_PAD.t+HIST_INNER_H}
                stroke="rgba(212,206,196,0.25)" strokeWidth="1"/>
              {[0,10,20,30,40,50,60,70,80,90,100].map(t=>(
                <text key={t} x={histX(t)} y={HIST_PAD.t+HIST_INNER_H+14}
                  textAnchor="middle" fill="rgba(212,206,196,0.35)" fontSize={9}>{t}%</text>
              ))}

              {/* Axis labels */}
              <text x={HIST_PAD.l+HIST_INNER_W/2} y={HIST_H-6}
                textAnchor="middle" fill="rgba(212,206,196,0.3)" fontSize={10}>Composite Cultiness Score</text>
              <text x={14} y={HIST_PAD.t+HIST_INNER_H/2}
                textAnchor="middle" fill="rgba(212,206,196,0.3)" fontSize={10}
                transform={`rotate(-90,14,${HIST_PAD.t+HIST_INNER_H/2})`}>Organizations</text>

              {/* Normal curve legend */}
              <line x1={HIST_W-140} y1={HIST_PAD.t+14} x2={HIST_W-118} y2={HIST_PAD.t+14}
                stroke="rgba(212,206,196,0.4)" strokeWidth="1.5" strokeDasharray="4 3"/>
              <text x={HIST_W-112} y={HIST_PAD.t+18} fill="rgba(212,206,196,0.35)" fontSize={9}>
                Normal (μ={mu.toFixed(1)}, σ={sigma.toFixed(1)})
              </text>
            </svg>
          </div>

          {/* Shape callout */}
          <div style={{marginTop:'1rem',padding:'0.9rem 1.1rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)',fontFamily:'var(--mono)',fontSize:'0.68rem',color:'var(--muted)',lineHeight:1.7}}>
            <span style={{color:'var(--gold)'}}>Shape: </span>
            Mean {mu.toFixed(1)}% · Std dev {sigma.toFixed(1)} · Skewness {skew > 0 ? '+' : ''}{skew.toFixed(3)}
            {Math.abs(skew) < 0.5 ? ' (near-symmetric)' : skew > 0 ? ' (right-skewed)' : ' (left-skewed)'}.
            {' '}The distribution is <strong style={{color:'var(--paper)'}}>roughly bimodal</strong> — a healthy-group cluster below 20% and a
            mildly-culty-to-high-control cluster in the 30–70% range — with Cult-tier outliers pulling the right tail.
          </div>
        </div>

        {/* ── Tier distribution table ── */}
        <div style={{marginBottom:'3rem'}}>
          <div style={{fontFamily:'var(--mono)',fontSize:'0.63rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'1rem'}}>By Tier</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.75rem'}}>
            {TIER_ORDER.map(tier=>{
              const count = validOrgs.filter(o=>o.composite_tier===tier).length;
              const pctTier = scores.length ? (100*count/scores.length).toFixed(1) : '0';
              return(
                <div key={tier} style={{padding:'0.75rem 1rem',borderLeft:`3px solid ${TIER_COLORS[tier]}`,background:'rgba(244,240,232,0.02)'}}>
                  <div style={{fontFamily:'var(--serif)',fontSize:'0.9rem',fontWeight:700,color:'var(--paper)',marginBottom:'0.15rem'}}>{tier}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'var(--muted)',marginBottom:'0.35rem'}}>{TIER_RANGES[tier]}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'1.1rem',fontWeight:700,color:TIER_COLORS[tier]}}>{count}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'rgba(212,206,196,0.4)'}}>{pctTier}% of dataset</div>
                </div>
              );
            })}
          </div>
        </div>

        <hr style={{border:'none',borderTop:'1px solid rgba(212,206,196,0.1)',margin:'3rem 0'}}/>

        {/* ── CHART 2: Instrument variance scatter ── */}
        <div style={{marginBottom:'2rem'}}>
          <div style={{fontFamily:'var(--mono)',fontSize:'0.63rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.4rem'}}>Instrument Variance</div>
          <h2 style={{fontFamily:'var(--serif)',fontSize:'1.5rem',fontWeight:700,color:'var(--paper)',marginBottom:'0.3rem',marginTop:0}}>Composite vs. Young's Score</h2>
          <p style={{fontFamily:'var(--mono)',fontSize:'0.68rem',color:'var(--muted)',marginBottom:'1.5rem',lineHeight:1.6}}>
            Young's score (0–10) normalized to 0–100 (×10) for direct comparison.
            Points above the diagonal: composite exceeds Young's. Below: Young's exceeds composite.
            Divergence is analytically meaningful — not an error to collapse.
          </p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem',marginBottom:'3rem',alignItems:'start'}}>

          {/* Scatter plot */}
          <div>
            <div style={{overflowX:'auto'}}>
              <svg viewBox={`0 0 ${SC_W} ${SC_H}`} style={{width:'100%',maxWidth:SC_W,display:'block'}}>
                {/* Diagonal reference */}
                <line x1={scX(0)} y1={scY(0)} x2={scX(100)} y2={scY(100)}
                  stroke="rgba(212,206,196,0.2)" strokeWidth="1" strokeDasharray="4 3"/>

                {/* Grid */}
                {[20,40,60,80,100].map(v=>(
                  <g key={v}>
                    <line x1={scX(0)} y1={scY(v)} x2={scX(100)} y2={scY(v)} stroke="rgba(212,206,196,0.05)" strokeWidth="1"/>
                    <line x1={scX(v)} y1={scY(0)} x2={scX(v)} y2={scY(100)} stroke="rgba(212,206,196,0.05)" strokeWidth="1"/>
                    <text x={scX(0)-5} y={scY(v)+4} textAnchor="end" fill="rgba(212,206,196,0.3)" fontSize={9}>{v}</text>
                    <text x={scX(v)} y={scY(0)+14} textAnchor="middle" fill="rgba(212,206,196,0.3)" fontSize={9}>{v}</text>
                  </g>
                ))}

                {/* Axes */}
                <line x1={scX(0)} y1={scY(0)} x2={scX(100)} y2={scY(0)} stroke="rgba(212,206,196,0.2)" strokeWidth="1"/>
                <line x1={scX(0)} y1={scY(0)} x2={scX(0)} y2={scY(100)} stroke="rgba(212,206,196,0.2)" strokeWidth="1"/>

                {/* Dots by tier */}
                {TIER_ORDER.map(tier=>(
                  varianceOrgs.filter(o=>o.composite_tier===tier).map((o,i)=>{
                    const isH = hoveredScatter?.name === o.name;
                    return(
                      <circle key={`${tier}-${i}`}
                        cx={scX(o.youngsNorm)} cy={scY(o.composite)}
                        r={isH ? 6 : 4}
                        fill={TIER_COLORS[tier]} fillOpacity={isH ? 1 : 0.7}
                        stroke={isH ? 'var(--gold)' : 'rgba(26,23,20,0.4)'} strokeWidth={isH ? 1.5 : 0.5}
                        style={{cursor:'pointer'}}
                        onMouseEnter={(e)=>{setHoveredScatter(o);setTooltipPos({x:e.clientX,y:e.clientY});}}
                        onMouseLeave={()=>setHoveredScatter(null)}
                      />
                    );
                  })
                ))}

                {/* Axis labels */}
                <text x={scX(50)} y={SC_H-8} textAnchor="middle" fill="rgba(212,206,196,0.3)" fontSize={10}>
                  Young's Score (normalized 0–100)
                </text>
                <text x={14} y={scY(50)} textAnchor="middle" fill="rgba(212,206,196,0.3)" fontSize={10}
                  transform={`rotate(-90,14,${scY(50)})`}>Composite Score (%)</text>

                {/* Region labels */}
                <text x={scX(75)} y={scY(90)} textAnchor="middle" fill="rgba(212,206,196,0.2)" fontSize={9}>Composite &gt;&gt; Young's</text>
                <text x={scX(75)} y={scY(55)} textAnchor="middle" fill="rgba(212,206,196,0.2)" fontSize={9}>Young's &gt;&gt; Composite</text>
              </svg>
            </div>

            {/* Scatter stats */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginTop:'0.75rem'}}>
              {[
                ['Mean variance', `${meanVariance > 0 ? '+' : ''}${meanVariance.toFixed(1)}`],
                ['Std deviation', stdVariance.toFixed(1)],
                ['Max composite ≫ Young\'s', `+${maxPositive.toFixed(0)}`],
                ['Max Young\'s ≫ composite', `${maxNegative.toFixed(0)}`],
              ].map(([k,v])=>(
                <div key={k} style={{padding:'0.6rem 0.8rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',color:'var(--muted)',marginBottom:'0.2rem'}}>{k}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.9rem',color:'var(--gold)'}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Variance bar chart */}
          <div>
            {/* Controls */}
            <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem',flexWrap:'wrap',alignItems:'center'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'var(--muted)'}}>Show:</div>
              {[['all','Largest divergence'],['composite','Composite ≫ Young\'s'],['youngs','Young\'s ≫ Composite']].map(([v,l])=>(
                <button key={v} onClick={()=>setVarianceView(v)}
                  style={{fontFamily:'var(--mono)',fontSize:'0.62rem',padding:'0.25rem 0.6rem',
                    background:varianceView===v?'rgba(200,168,75,0.15)':'transparent',
                    border:`1px solid ${varianceView===v?'rgba(200,168,75,0.4)':'rgba(212,206,196,0.2)'}`,
                    color:varianceView===v?'var(--gold)':'var(--muted)',cursor:'pointer'}}>
                  {l}
                </button>
              ))}
              <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'var(--muted)'}}>Top</span>
                <input type="range" min={10} max={50} value={nOrgs} onChange={e=>setNOrgs(Number(e.target.value))}
                  style={{width:60}}/>
                <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'var(--gold)',minWidth:'2ch'}}>{nOrgs}</span>
              </div>
            </div>

            <div style={{maxHeight:460,overflowY:'auto'}}>
              {varianceBars.map((o,i)=>{
                const barW = Math.abs(o.variance) / maxAbsVariance * 100;
                const isPos = o.variance >= 0;
                return(
                  <div key={i} style={{marginBottom:'3px',display:'flex',alignItems:'center',gap:'6px'}}>
                    <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)',width:160,flexShrink:0,
                      whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',textAlign:'right'}}
                      title={o.name}>{o.name}</div>
                    <div style={{flex:1,height:16,position:'relative',display:'flex',alignItems:'center'}}>
                      <div style={{
                        position:'absolute',
                        [isPos?'left':'right']:'50%',
                        width:`${barW/2}%`,
                        height:14,
                        background:TIER_COLORS[o.composite_tier]||'#888',
                        opacity:0.8,
                      }}/>
                      <div style={{position:'absolute',left:'50%',top:0,bottom:0,width:1,background:'rgba(212,206,196,0.15)'}}/>
                    </div>
                    <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:isPos?'var(--gold)':'rgba(160,140,200,0.8)',
                      width:36,flexShrink:0,textAlign:'right'}}>{isPos?'+':''}{o.variance.toFixed(0)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Methodology note */}
        <div style={{padding:'1.25rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)',marginBottom:'2rem'}}>
          <p style={{fontFamily:'var(--mono)',fontSize:'0.68rem',color:'var(--muted)',margin:0,lineHeight:1.7}}>
            <span style={{color:'var(--gold)'}}>Instrument design: </span>
            The two instruments measure different things. Young's Original Score is a binary checklist — each criterion
            either fires or it doesn't. The Composite Score captures intensity across all criteria. Large positive variance
            (composite ≫ Young's) typically signals broad, distributed moderate-intensity dynamics. Large negative variance
            (Young's ≫ composite) typically signals narrow but extreme dynamics — a few criteria at high intensity with low breadth.
            Neither direction is a scoring error on its own; divergence is the signal.
          </p>
        </div>

        <div style={{textAlign:'center'}}>
          <Link href="/explore" className="btn-secondary" style={{marginRight:'1rem'}}>Explore the Full Dataset</Link>
          <Link href="/compass" className="btn-secondary">Political Compass</Link>
        </div>

      </div>

      {/* Tooltips */}
      {hoveredDist&&(
        <div style={{position:'fixed',left:tooltipPos.x+12,top:tooltipPos.y-40,
          background:'rgba(18,15,12,0.97)',border:'1px solid rgba(200,168,75,0.5)',
          padding:'0.5rem 0.75rem',pointerEvents:'none',zIndex:9999,fontFamily:'monospace',fontSize:'0.7rem'}}>
          <div style={{color:'var(--paper)',fontWeight:600}}>{hoveredDist.center-2.5}–{hoveredDist.center+2.5}%</div>
          <div style={{color:TIER_COLORS[hoveredDist.tier]}}>{hoveredDist.tier}</div>
          <div style={{color:'rgba(212,206,196,0.6)'}}>{hoveredDist.count} organizations</div>
        </div>
      )}
      {hoveredScatter&&(
        <div style={{position:'fixed',left:tooltipPos.x+12,top:tooltipPos.y-50,
          background:'rgba(18,15,12,0.97)',border:'1px solid rgba(200,168,75,0.5)',
          padding:'0.5rem 0.75rem',pointerEvents:'none',zIndex:9999,fontFamily:'monospace',fontSize:'0.7rem',maxWidth:220}}>
          <div style={{color:'var(--paper)',fontWeight:600,marginBottom:'0.2rem'}}>{hoveredScatter.name}</div>
          <div style={{color:TIER_COLORS[hoveredScatter.composite_tier]}}>{hoveredScatter.composite_tier}</div>
          <div style={{color:'rgba(200,168,75,0.8)'}}>Composite: {hoveredScatter.composite.toFixed(0)}%</div>
          <div style={{color:'rgba(200,168,75,0.8)'}}>Young's: {hoveredScatter.youngs_score}/10 (norm. {hoveredScatter.youngsNorm})</div>
          <div style={{color:hoveredScatter.variance>0?'var(--gold)':'rgba(160,140,200,0.8)',marginTop:'0.15rem'}}>
            Variance: {hoveredScatter.variance>0?'+':''}{hoveredScatter.variance.toFixed(0)}
          </div>
        </div>
      )}
    </section>
  );
}
