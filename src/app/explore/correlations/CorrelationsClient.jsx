'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';

const CRITERIA = ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'];
const C_NAMES = { C1:'Charismatic Leadership',C2:'Sacred Assumptions',C3:'Transcendent Mission',C4:'Sublimation of Individuality',C5:'Isolation',C6:'Private Vernacular',C7:'Us-Versus-Them',C8:'Exploitation of Labor',C9:'High Exit Costs',C10:'Ends Justify the Means' };

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a,b)=>a+b,0)/n;
  const my = ys.reduce((a,b)=>a+b,0)/n;
  let num=0, dx=0, dy=0;
  for (let i=0;i<n;i++) { num+=(xs[i]-mx)*(ys[i]-my); dx+=(xs[i]-mx)**2; dy+=(ys[i]-my)**2; }
  if (dx===0||dy===0) return 0;
  return num/Math.sqrt(dx*dy);
}

function corrColor(r) {
  if (r === null) return 'rgba(212,206,196,0.05)';
  if (r >= 0.7) return 'rgba(192,32,32,0.88)';
  if (r >= 0.5) return 'rgba(176,96,32,0.78)';
  if (r >= 0.3) return 'rgba(160,144,48,0.65)';
  if (r >= 0.1) return 'rgba(80,130,80,0.45)';
  if (r >= -0.1) return 'rgba(80,100,140,0.25)';
  if (r >= -0.3) return 'rgba(60,80,160,0.45)';
  if (r >= -0.5) return 'rgba(40,60,180,0.65)';
  return 'rgba(20,40,200,0.8)';
}

export default function CorrelationsClient({ orgs=[], scoreMap={} }) {
  const [selected, setSelected] = useState(null); // {a, b, r, pairs}
  const [includeComposite, setIncludeComposite] = useState(true);

  // Build correlation matrix
  const matrix = useMemo(() => {
    const cols = [...CRITERIA];
    if (includeComposite) cols.push('COMPOSITE');

    // Build vectors: one per column, only using orgs that have both values
    const getVec = (c) => {
      if (c === 'COMPOSITE') return orgs.map(o => parseFloat(o.composite_score));
      return orgs.map(o => scoreMap[o.id]?.[c] ?? null);
    };

    const result = {};
    for (const a of cols) {
      result[a] = {};
      const va = getVec(a);
      for (const b of cols) {
        if (a === b) { result[a][b] = 1; continue; }
        const vb = getVec(b);
        // Only use rows where both are non-null
        const pairs = orgs.map((o,i) => [va[i], vb[i]]).filter(([x,y]) => x!==null && y!==null);
        const xs = pairs.map(p=>p[0]), ys = pairs.map(p=>p[1]);
        result[a][b] = pearson(xs, ys);
      }
    }
    return { matrix: result, cols };
  }, [orgs, scoreMap, includeComposite]);

  const { matrix: mat, cols } = matrix;

  const CELL = 46;
  const LABEL_W = 110;
  const W = LABEL_W + cols.length * CELL + 20;
  const H = LABEL_W + cols.length * CELL + 20;

  const getScatterPairs = (a, b) => {
    const va = a === 'COMPOSITE' ? orgs.map(o=>parseFloat(o.composite_score)) : orgs.map(o=>scoreMap[o.id]?.[a]??null);
    const vb = b === 'COMPOSITE' ? orgs.map(o=>parseFloat(o.composite_score)) : orgs.map(o=>scoreMap[o.id]?.[b]??null);
    return orgs.map((o,i)=>({name:o.name,tier:o.composite_tier,x:va[i],y:vb[i]})).filter(p=>p.x!==null&&p.y!==null);
  };

  const handleCellClick = (a, b) => {
    if (a === b) return;
    const r = mat[a]?.[b];
    const pairs = getScatterPairs(a, b);
    setSelected(sel => sel?.a===a&&sel?.b===b ? null : {a, b, r, pairs});
  };

  const TIER_COLORS = { 'Cult':'#c02020','Cult Dynamics':'#c04040','High Control':'#b07030','Concerning':'#a09040','Mildly Culty':'#6a9840','Healthy Group':'#30a060' };

  return (
    <div style={{minHeight:'100vh'}}>
      <div style={{borderBottom:'1px solid rgba(212,206,196,0.1)',padding:'2rem 0 1.5rem',background:'var(--ink)',position:'sticky',top:'60px',zIndex:50}}>
        <div className="container--wide">
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
            <div>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)'}}>
                <Link href="/explore" style={{color:'var(--gold)'}}>Explorer</Link> —
              </span>
              <h1 style={{fontFamily:'var(--serif)',fontSize:'clamp(1.3rem,3vw,2rem)',color:'var(--paper)',display:'inline',marginLeft:'0.4rem'}}>Criterion Correlations</h1>
            </div>
          </div>
          <div style={{display:'flex',gap:'1rem',marginTop:'1rem',alignItems:'center'}}>
            <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer'}}>
              <input type="checkbox" checked={includeComposite} onChange={e=>setIncludeComposite(e.target.checked)} style={{accentColor:'var(--gold)'}}/>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.68rem',color:'var(--muted)'}}>Include composite score column</span>
            </label>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'rgba(212,206,196,0.3)',marginLeft:'auto'}}>Click any cell to see scatter</span>
          </div>
        </div>
      </div>

      <div className="container--wide" style={{paddingTop:'1.5rem',paddingBottom:'4rem'}}>
        {/* Color scale */}
        <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'1.25rem',flexWrap:'wrap'}}>
          <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'var(--muted)'}}>r =</span>
          {[-1,-0.7,-0.5,-0.3,-0.1,0,0.1,0.3,0.5,0.7,1].map(r=>(
            <div key={r} style={{display:'flex',alignItems:'center',gap:'3px'}}>
              <div style={{width:16,height:16,background:corrColor(r),border:'1px solid rgba(212,206,196,0.08)'}}/>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.58rem',color:'rgba(212,206,196,0.4)'}}>{r>0?`+${r}`:r}</span>
            </div>
          ))}
        </div>

        <div style={{overflowX:'auto'}}>
          <div style={{position:'relative',display:'inline-block'}}>
            {/* Column header labels (rotated) */}
            <div style={{display:'flex',paddingLeft:LABEL_W,marginBottom:'2px'}}>
              {cols.map(c=>(
                <div key={c} style={{width:CELL,flexShrink:0,height:90,display:'flex',alignItems:'flex-end',justifyContent:'center',paddingBottom:'4px'}}>
                  <span style={{display:'block',transform:'rotate(-60deg)',transformOrigin:'bottom center',
                    fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)',whiteSpace:'nowrap'}}>
                    {c==='COMPOSITE'?'Composite':c}
                  </span>
                </div>
              ))}
            </div>

            {/* Matrix rows */}
            {cols.map((rowC, ri) => (
              <div key={rowC} style={{display:'flex',alignItems:'center',marginBottom:'1px'}}>
                {/* Row label */}
                <div style={{width:LABEL_W,flexShrink:0,fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)',paddingRight:'8px',textAlign:'right',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                  {rowC==='COMPOSITE'?'Composite':rowC}
                </div>
                {/* Cells */}
                {cols.map((colC, ci) => {
                  const r = mat[rowC]?.[colC] ?? null;
                  const isDiag = rowC === colC;
                  const isSel = selected?.a===rowC&&selected?.b===colC;
                  return (
                    <div key={colC}
                      onClick={()=>handleCellClick(rowC,colC)}
                      style={{width:CELL,height:CELL,flexShrink:0,
                        background:isDiag?'rgba(200,168,75,0.12)':corrColor(r),
                        border:`1px solid ${isSel?'rgba(200,168,75,0.8)':'rgba(212,206,196,0.06)'}`,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        cursor:isDiag?'default':'pointer',
                        outline:isSel?'2px solid rgba(200,168,75,0.5)':'none',
                        transition:'transform 0.1s',
                        transform:isSel?'scale(1.05)':'scale(1)',
                        zIndex:isSel?2:0,position:'relative',
                      }}>
                      {!isDiag&&r!==null&&(
                        <span style={{fontFamily:'var(--mono)',fontSize:'0.58rem',
                          color:Math.abs(r)>0.5?'rgba(255,255,255,0.9)':'rgba(212,206,196,0.7)',
                          fontWeight:Math.abs(r)>0.7?700:400}}>
                          {r>0?'+':''}{r.toFixed(2)}
                        </span>
                      )}
                      {isDiag&&<span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'rgba(200,168,75,0.7)'}}>—</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Selected cell scatter */}
        {selected&&(()=>{
          const {a,b,r,pairs} = selected;
          const maxA = a==='COMPOSITE'?100:10, maxB = b==='COMPOSITE'?100:10;
          const SW=360, SH=300, SP=36;
          const sx = v => SP + (v/maxA)*(SW-SP*2);
          const sy = v => SH-SP - (v/maxB)*(SH-SP*2);
          return (
            <div style={{marginTop:'2rem',display:'grid',gridTemplateColumns:'360px 1fr',gap:'2rem',alignItems:'start'}}>
              <div>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'var(--gold)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:'0.5rem'}}>
                  {a} vs {b} · r = {r!==null?(r>0?'+':'')+r.toFixed(3):'—'}
                </div>
                <svg viewBox={`0 0 ${SW} ${SH}`} style={{width:'100%',display:'block',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.1)'}}>
                  {[0,0.25,0.5,0.75,1].map(f=>(
                    <g key={f}>
                      <line x1={SP} y1={sy(maxB*f)} x2={SW-SP} y2={sy(maxB*f)} stroke="rgba(212,206,196,0.06)" strokeWidth="1"/>
                      <line x1={sx(maxA*f)} y1={SP} x2={sx(maxA*f)} y2={SH-SP} stroke="rgba(212,206,196,0.06)" strokeWidth="1"/>
                      <text x={SP-4} y={sy(maxB*f)+4} textAnchor="end" fill="rgba(212,206,196,0.3)" fontSize={8}>{(maxB*f).toFixed(0)}</text>
                      <text x={sx(maxA*f)} y={SH-SP+12} textAnchor="middle" fill="rgba(212,206,196,0.3)" fontSize={8}>{(maxA*f).toFixed(0)}</text>
                    </g>
                  ))}
                  <line x1={SP} y1={SH-SP} x2={SW-SP} y2={SH-SP} stroke="rgba(212,206,196,0.2)" strokeWidth="1"/>
                  <line x1={SP} y1={SP} x2={SP} y2={SH-SP} stroke="rgba(212,206,196,0.2)" strokeWidth="1"/>
                  {pairs.map((p,i)=>(
                    <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3}
                      fill={TIER_COLORS[p.tier]||'#888'} fillOpacity={0.65} stroke="none">
                      <title>{p.name}: ({p.x}, {p.y})</title>
                    </circle>
                  ))}
                  <text x={SW/2} y={SH-4} textAnchor="middle" fill="rgba(212,206,196,0.3)" fontSize={9}>{a==='COMPOSITE'?'Composite %':a+' score'}</text>
                  <text x={10} y={SH/2} textAnchor="middle" fill="rgba(212,206,196,0.3)" fontSize={9} transform={`rotate(-90,10,${SH/2})`}>{b==='COMPOSITE'?'Composite %':b+' score'}</text>
                </svg>
              </div>
              <div style={{padding:'1rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.1)'}}>
                <div style={{fontFamily:'var(--serif)',fontSize:'1rem',fontWeight:700,color:'var(--paper)',marginBottom:'0.75rem'}}>
                  {a==='COMPOSITE'?'Composite Score':C_NAMES[a]} × {b==='COMPOSITE'?'Composite Score':C_NAMES[b]}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                  {[['r',r!==null?(r>0?'+':'')+r.toFixed(3):'—'],['r²',r!==null?(r*r).toFixed(3):'—'],['n',pairs.length+' orgs'],['Strength',!r?'—':Math.abs(r)>=0.7?'Strong':Math.abs(r)>=0.4?'Moderate':Math.abs(r)>=0.2?'Weak':'Negligible']].map(([k,v])=>(
                    <div key={k}>
                      <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{k}</div>
                      <div style={{fontFamily:'var(--mono)',fontSize:'0.9rem',color:'var(--gold)'}}>{v}</div>
                    </div>
                  ))}
                </div>
                <p style={{fontFamily:'var(--mono)',fontSize:'0.67rem',color:'rgba(212,206,196,0.4)',lineHeight:1.7,margin:0}}>
                  {r===null?'Insufficient data.'
                    :r>=0.7?`Strong positive correlation. Organizations that score high on ${a} tend strongly to score high on ${b}.`
                    :r>=0.4?`Moderate positive correlation between ${a} and ${b}.`
                    :r>=0.2?`Weak positive correlation.`
                    :r>=-0.2?`Near zero correlation — these criteria appear independent across the dataset.`
                    :r>=-0.4?`Weak negative correlation.`
                    :r>=-0.7?`Moderate negative correlation.`
                    :`Strong negative correlation — high ${a} scores tend to associate with low ${b} scores.`}
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
