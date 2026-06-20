'use client';
import { useState, useMemo } from 'react';

const CRITERIA = ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'];
const C_SHORT = { C1:'Leadership',C2:'Sacred Assump.',C3:'Mission',C4:'Individuality',C5:'Isolation',C6:'Vernacular',C7:'Us/Them',C8:'Labor',C9:'Exit Costs',C10:'Ends/Means' };
const TIER_COLORS = { 'Super Culty':'#e8574d','Kinda Culty':'#d99b3e','Not Culty':'#5cb878' };
// Softer reader-facing labels for the DB tier enum (keys are unchanged).
const TIER_LABELS = { 'Super Culty':'High-Control','Kinda Culty':'Moderate-Control','Not Culty':'Low-Control' };
const lbl = (t) => TIER_LABELS[t] || t;

// Pre-populated pairs that illustrate the book's core arguments
const PRESET_PAIRS = [
  {
    label: 'MAGA vs. Antifa',
    desc: 'The headline asymmetry — identical framework, radically different scores',
    a: 'MAGA (political identity)',
    b: 'Antifa',
  },
  {
    label: 'Fox News vs. MSNBC',
    desc: 'Same industry, opposite formation architecture',
    a: 'Fox News (employer culture)',
    b: 'MSNBC',
  },
  {
    label: 'KKK vs. NAACP',
    desc: 'Formation-in-resistance vs. formation-in-service-of-dominant-culture — maximum contrast',
    a: 'Ku Klux Klan',
    b: 'NAACP',
  },
  {
    label: 'Heritage Foundation vs. ACLU',
    desc: 'Right-wing political mobilization vs. civil liberties formation — a methodological benchmark pair',
    a: 'Heritage Foundation',
    b: 'ACLU (American Civil Liberties Union)',
  },
  {
    label: 'SBC vs. NAACP',
    desc: 'Same broad tradition; formation-in-resistance produces a categorically different institutional architecture',
    a: 'SBC (Southern Baptist Convention)',
    b: 'NAACP',
  },
  {
    label: 'Scouts of America vs. Girl Scouts',
    desc: 'Same category, same era, opposite institutional architecture',
    a: 'Scouts of America (BSA)',
    b: 'Girl Scouts',
  },
  {
    label: 'Republican Party vs. Democratic Party',
    desc: 'Institutional parties without movement architecture — both near the floor, but different dimensions',
    a: 'Republican Party (institutional)',
    b: 'Democratic Party (institutional)',
  },
];

function scoreColor(side) {
  return side === 'a' ? '#e8574d' : '#5cb878';
}

function CompositeBar({ score, side, maxScore=100 }) {
  const pct = (parseFloat(score)||0)/maxScore*100;
  const color = scoreColor(side);
  return (
    <div style={{position:'relative',height:6,background:'rgba(212,206,196,0.08)',borderRadius:3,overflow:'hidden'}}>
      <div style={{position:'absolute',[side==='a'?'right':'left']:0,width:`${pct}%`,height:'100%',background:color,borderRadius:3,opacity:0.8}}/>
    </div>
  );
}

export default function CompareClient({ orgs=[], scoreMap={} }) {
  const [orgA, setOrgA] = useState(PRESET_PAIRS[0].a);
  const [orgB, setOrgB] = useState(PRESET_PAIRS[0].b);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);
  const [activePreset, setActivePreset] = useState(0);

  const find = (name) => orgs.find(o => o.name === name);
  const dataA = useMemo(() => find(orgA), [orgA, orgs]);
  const dataB = useMemo(() => find(orgB), [orgB, orgs]);

  const scoresA = useMemo(() => dataA ? (scoreMap[dataA.id] || {}) : {}, [dataA, scoreMap]);
  const scoresB = useMemo(() => dataB ? (scoreMap[dataB.id] || {}) : {}, [dataB, scoreMap]);

  const filteredA = useMemo(() => orgs.filter(o => o.name.toLowerCase().includes(searchA.toLowerCase())).slice(0, 30), [orgs, searchA]);
  const filteredB = useMemo(() => orgs.filter(o => o.name.toLowerCase().includes(searchB.toLowerCase())).slice(0, 30), [orgs, searchB]);

  const applyPreset = (i) => {
    setActivePreset(i);
    setOrgA(PRESET_PAIRS[i].a);
    setOrgB(PRESET_PAIRS[i].b);
    setSearchA(''); setSearchB('');
    setOpenA(false); setOpenB(false);
  };

  const swap = () => { setOrgA(orgB); setOrgB(orgA); setActivePreset(null); };

  // Criteria rows with deltas
  const criteriaRows = CRITERIA.map(c => {
    const va = scoresA[c] ?? null;
    const vb = scoresB[c] ?? null;
    const delta = va !== null && vb !== null ? va - vb : null;
    return { c, va, vb, delta };
  });

  const tierColorA = TIER_COLORS[dataA?.composite_tier] || '#888';
  const tierColorB = TIER_COLORS[dataB?.composite_tier] || '#888';

  const OrgPicker = ({ side, value, search, setSearch, open, setOpen, filtered, onSelect }) => {
    const data = side === 'a' ? dataA : dataB;
    const color = scoreColor(side);
    return (
      <div style={{position:'relative',flex:1}}>
        <div style={{padding:'0.85rem 1rem',background:`rgba(${hexRgb(color)},0.07)`,
          border:`1px solid rgba(${hexRgb(color)},0.3)`,cursor:'pointer',userSelect:'none'}}
          onClick={()=>{ setOpen(o=>!o); if(!open) setSearch(''); }}>
          <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',
            color:`rgba(${hexRgb(color)},0.7)`,marginBottom:'0.3rem'}}>
            {side === 'a' ? 'Group A' : 'Group B'}
          </div>
          <div style={{fontFamily:'var(--serif)',fontSize:'0.95rem',fontWeight:700,color:'var(--paper)',
            lineHeight:1.2,marginBottom:'0.35rem'}}>{value || '—'}</div>
          {data && (
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:TIER_COLORS[data.composite_tier]||'#888',flexShrink:0}}/>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)'}}>
                {lbl(data.composite_tier)} · {parseFloat(data.composite_score).toFixed(0)}%
              </span>
            </div>
          )}
          <div style={{position:'absolute',top:'0.85rem',right:'0.75rem',fontFamily:'var(--mono)',fontSize:'0.65rem',color:'rgba(212,206,196,0.3)'}}>
            {open ? '▲' : '▼'}
          </div>
        </div>
        {open && (
          <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#1e1a16',
            border:'1px solid rgba(212,206,196,0.2)',zIndex:100,maxHeight:280,overflowY:'auto',
            boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
            <div style={{padding:'0.5rem',borderBottom:'1px solid rgba(212,206,196,0.1)',position:'sticky',top:0,background:'#1e1a16'}}>
              <input autoFocus value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search organizations..."
                style={{width:'100%',background:'rgba(244,240,232,0.05)',border:'1px solid rgba(212,206,196,0.2)',
                  color:'var(--paper)',fontFamily:'var(--mono)',fontSize:'0.75rem',padding:'0.35rem 0.6rem',outline:'none',boxSizing:'border-box'}}/>
            </div>
            {filtered.map(o => (
              <div key={o.id} onClick={()=>{ onSelect(o.name); setOpen(false); setSearch(''); setActivePreset(null); }}
                style={{padding:'0.5rem 0.75rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem',
                  background:o.name===value?'rgba(212,206,196,0.06)':'transparent',
                  borderBottom:'1px solid rgba(212,206,196,0.04)'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(212,206,196,0.05)'}
                onMouseLeave={e=>e.currentTarget.style.background=o.name===value?'rgba(212,206,196,0.06)':'transparent'}>
                <div style={{width:6,height:6,borderRadius:'50%',background:TIER_COLORS[o.composite_tier]||'#888',flexShrink:0}}/>
                <span style={{fontFamily:'var(--serif)',fontSize:'0.82rem',color:'var(--paper)',flex:1,lineHeight:1.3}}>{o.name}</span>
                <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)',flexShrink:0}}>{parseFloat(o.composite_score).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{minHeight:'100vh'}} onClick={e=>{ if(!e.target.closest('.picker-a')) { setOpenA(false); } if(!e.target.closest('.picker-b')) { setOpenB(false); } }}>
      {/* Header */}
      <div style={{padding:'1.25rem 0 0.75rem'}}>
        <div className="container--wide">
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem',marginBottom:'1.25rem'}}>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'rgba(212,206,196,0.35)'}}>
              {orgs.length} organizations available
            </span>
          </div>

          {/* Org pickers */}
          <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:'0.75rem',alignItems:'start'}}>
            <div className="picker-a">
              <OrgPicker side="a" value={orgA} search={searchA} setSearch={setSearchA}
                open={openA} setOpen={setOpenA} filtered={filteredA} onSelect={setOrgA}/>
            </div>
            <button onClick={swap}
              style={{background:'transparent',border:'1px solid rgba(212,206,196,0.2)',color:'var(--muted)',
                fontFamily:'var(--mono)',fontSize:'0.75rem',cursor:'pointer',padding:'0.6rem 0.75rem',
                alignSelf:'center',transition:'color 0.15s,border-color 0.15s',marginTop:'1.8rem'}}
              title="Swap groups">
              ⇄
            </button>
            <div className="picker-b">
              <OrgPicker side="b" value={orgB} search={searchB} setSearch={setSearchB}
                open={openB} setOpen={setOpenB} filtered={filteredB} onSelect={setOrgB}/>
            </div>
          </div>
        </div>
      </div>

      <div className="container--wide" style={{paddingTop:'1.5rem',paddingBottom:'5rem'}}>

        {/* Preset pairs */}
        <div style={{marginBottom:'2rem'}}>
          <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',
            color:'var(--muted)',marginBottom:'0.6rem'}}>Featured comparisons</div>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            {PRESET_PAIRS.map((p,i)=>(
              <button key={i} onClick={()=>applyPreset(i)}
                style={{fontFamily:'var(--mono)',fontSize:'0.65rem',padding:'0.35rem 0.75rem',
                  background:activePreset===i?'rgba(200,168,75,0.12)':'transparent',
                  border:`1px solid ${activePreset===i?'rgba(200,168,75,0.5)':'rgba(212,206,196,0.18)'}`,
                  color:activePreset===i?'var(--gold)':'var(--muted)',cursor:'pointer',lineHeight:1.3,
                  transition:'all 0.15s'}}>
                {p.label}
              </button>
            ))}
          </div>
          {activePreset !== null && PRESET_PAIRS[activePreset] && (
            <p style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'rgba(212,206,196,0.4)',
              marginTop:'0.5rem',lineHeight:1.6,maxWidth:600}}>
              {PRESET_PAIRS[activePreset].desc}
            </p>
          )}
        </div>

        {dataA && dataB ? (
          <>
            {/* Composite score headline */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 80px 1fr',gap:'0',marginBottom:'2rem',
              border:'1px solid rgba(212,206,196,0.1)'}}>
              {[
                {d:dataA, side:'a', align:'left'},
                null,
                {d:dataB, side:'b', align:'right'},
              ].map((item,i) => item ? (
                <div key={i} style={{padding:'1.25rem 1.5rem',background:'rgba(244,240,232,0.02)',
                  textAlign:item.align,borderRight:i===0?'1px solid rgba(212,206,196,0.08)':'none',
                  borderLeft:i===2?'1px solid rgba(212,206,196,0.08)':'none'}}>
                  <div style={{fontFamily:'var(--serif)',fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:700,
                    color:scoreColor(item.side),lineHeight:1,marginBottom:'0.4rem'}}>
                    {parseFloat(item.d.composite_score).toFixed(0)}%
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'0.4rem',justifyContent:item.align==='right'?'flex-end':'flex-start',marginBottom:'0.25rem'}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:TIER_COLORS[item.d.composite_tier]||'#888'}}/>
                    <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--muted)'}}>{lbl(item.d.composite_tier)}</span>
                  </div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'rgba(212,206,196,0.35)'}}>
                    Young's {item.d.youngs_score}/10 · {item.d.trajectory}
                  </div>
                </div>
              ) : (
                <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                  background:'rgba(244,240,232,0.01)',padding:'1rem 0'}}>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.1em',textTransform:'uppercase',
                    color:'rgba(212,206,196,0.2)',marginBottom:'0.5rem'}}>vs</div>
                  {(() => {
                    const diff = parseFloat(dataA.composite_score) - parseFloat(dataB.composite_score);
                    return (
                      <div style={{fontFamily:'var(--serif)',fontSize:'1.2rem',fontWeight:700,
                        color:Math.abs(diff)>20?scoreColor(diff>0?'a':'b'):'rgba(212,206,196,0.4)'}}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>

            {/* Butterfly chart */}
            <div style={{marginBottom:'2rem'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',
                color:'var(--gold)',marginBottom:'1rem'}}>Per-Criterion Comparison</div>

              {/* Column headers */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 130px 1fr',marginBottom:'0.4rem'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:scoreColor('a'),textAlign:'right',paddingRight:'0.75rem',
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{dataA.name}</div>
                <div/>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:scoreColor('b'),textAlign:'left',paddingLeft:'0.75rem',
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{dataB.name}</div>
              </div>

              {criteriaRows.map(({ c, va, vb, delta }) => {
                const barA = va !== null ? (va/10)*100 : 0;
                const barB = vb !== null ? (vb/10)*100 : 0;
                const absDelta = delta !== null ? Math.abs(delta) : null;
                const biggerSide = delta !== null ? (delta > 0 ? 'a' : delta < 0 ? 'b' : null) : null;
                return (
                  <div key={c} style={{display:'grid',gridTemplateColumns:'1fr 130px 1fr',
                    marginBottom:'3px',alignItems:'center',
                    background:absDelta > 4 ? `rgba(${hexRgb(scoreColor(biggerSide))},0.04)` : 'transparent'}}>

                    {/* Left bar (A) */}
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem',justifyContent:'flex-end'}}>
                      <span style={{fontFamily:'var(--mono)',fontSize:'0.68rem',
                        color:va===null?'rgba(212,206,196,0.2)':scoreColor('a'),minWidth:'2.5rem',textAlign:'right'}}>
                        {va===null?'N/A':`${va}/10`}
                      </span>
                      <div style={{width:120,height:18,position:'relative',display:'flex',alignItems:'center'}}>
                        <div style={{position:'absolute',right:0,width:`${barA}%`,height:12,
                          background:scoreColor('a'),opacity:va===null?0:0.75,borderRadius:'2px 0 0 2px'}}/>
                      </div>
                    </div>

                    {/* Centre label */}
                    <div style={{textAlign:'center',padding:'0 0.25rem'}}>
                      <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',fontWeight:700,
                        color:'rgba(212,206,196,0.5)'}}>{c}</span>
                      <div style={{fontFamily:'var(--mono)',fontSize:'0.55rem',color:'rgba(212,206,196,0.25)',
                        lineHeight:1.2,marginTop:'1px'}}>{C_SHORT[c]}</div>
                      {absDelta !== null && absDelta > 0 && (
                        <div style={{fontFamily:'var(--mono)',fontSize:'0.55rem',marginTop:'2px',
                          color:`rgba(${hexRgb(scoreColor(biggerSide))},0.6)`}}>
                          Δ{absDelta.toFixed(0)}
                        </div>
                      )}
                    </div>

                    {/* Right bar (B) */}
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem',justifyContent:'flex-start'}}>
                      <div style={{width:120,height:18,position:'relative',display:'flex',alignItems:'center'}}>
                        <div style={{position:'absolute',left:0,width:`${barB}%`,height:12,
                          background:scoreColor('b'),opacity:vb===null?0:0.75,borderRadius:'0 2px 2px 0'}}/>
                      </div>
                      <span style={{fontFamily:'var(--mono)',fontSize:'0.68rem',
                        color:vb===null?'rgba(212,206,196,0.2)':scoreColor('b'),minWidth:'2.5rem'}}>
                        {vb===null?'N/A':`${vb}/10`}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Composite total row */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 130px 1fr',marginTop:'0.75rem',
                paddingTop:'0.75rem',borderTop:'1px solid rgba(212,206,196,0.12)',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem',justifyContent:'flex-end'}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:'0.82rem',fontWeight:700,color:scoreColor('a')}}>
                    {parseFloat(dataA.composite_score).toFixed(0)}%
                  </span>
                  <div style={{width:120,height:18,position:'relative',display:'flex',alignItems:'center'}}>
                    <div style={{position:'absolute',right:0,
                      width:`${parseFloat(dataA.composite_score)}%`,height:12,
                      background:scoreColor('a'),opacity:0.8,borderRadius:'2px 0 0 2px'}}/>
                  </div>
                </div>
                <div style={{textAlign:'center',fontFamily:'var(--mono)',fontSize:'0.6rem',
                  letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(212,206,196,0.4)'}}>YM Composite</div>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem',justifyContent:'flex-start'}}>
                  <div style={{width:120,height:18,position:'relative',display:'flex',alignItems:'center'}}>
                    <div style={{position:'absolute',left:0,
                      width:`${parseFloat(dataB.composite_score)}%`,height:12,
                      background:scoreColor('b'),opacity:0.8,borderRadius:'0 2px 2px 0'}}/>
                  </div>
                  <span style={{fontFamily:'var(--mono)',fontSize:'0.82rem',fontWeight:700,color:scoreColor('b')}}>
                    {parseFloat(dataB.composite_score).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Largest deltas callout */}
            {(() => {
              const significant = criteriaRows
                .filter(r => r.delta !== null && Math.abs(r.delta) >= 3)
                .sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta))
                .slice(0, 4);
              if (!significant.length) return null;
              return (
                <div style={{padding:'1.25rem',background:'rgba(244,240,232,0.02)',
                  border:'1px solid rgba(212,206,196,0.1)',marginBottom:'2rem'}}>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.14em',
                    textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.75rem'}}>
                    Largest divergences
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.75rem'}}>
                    {significant.map(({c,va,vb,delta}) => {
                      const bigger = delta > 0 ? dataA : dataB;
                      const biggerScore = delta > 0 ? va : vb;
                      const biggerColor = scoreColor(delta > 0 ? 'a' : 'b');
                      return (
                        <div key={c} style={{padding:'0.75rem',background:'rgba(244,240,232,0.02)',
                          borderLeft:`3px solid rgba(${hexRgb(biggerColor)},0.5)`}}>
                          <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'var(--gold)',marginBottom:'0.2rem'}}>
                            {c} — {C_SHORT[c]}
                          </div>
                          <div style={{fontFamily:'var(--serif)',fontSize:'0.78rem',color:biggerColor,lineHeight:1.3}}>
                            {bigger.name} scores {biggerScore}/10
                          </div>
                          <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',color:'rgba(212,206,196,0.35)',marginTop:'0.2rem'}}>
                            Δ = {Math.abs(delta).toFixed(0)} points
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Radar side by side */}
            <div style={{marginBottom:'2rem'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.14em',
                textTransform:'uppercase',color:'var(--gold)',marginBottom:'1rem'}}>Criterion Profile Overlay</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',maxWidth:480,margin:'0 auto'}}>
                {[{d:dataA,sc:scoresA,side:'a'},{d:dataB,sc:scoresB,side:'b'}].map(({d,sc,side})=>(
                  <div key={side} style={{padding:'1rem',background:'rgba(244,240,232,0.02)',border:`1px solid rgba(${hexRgb(scoreColor(side))},0.2)`}}>
                    <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:scoreColor(side),
                      textAlign:'center',marginBottom:'0.6rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {d.name}
                    </div>
                    <MiniRadar scores={sc} color={scoreColor(side)}/>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{textAlign:'center',padding:'4rem 0',fontFamily:'var(--mono)',fontSize:'0.8rem',color:'var(--muted)'}}>
            Select two organizations above to compare.
          </div>
        )}
      </div>
    </div>
  );
}

function MiniRadar({ scores, color }) {
  const CRITERIA = ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'];
  const N = CRITERIA.length;
  const SIZE = 160, CX = SIZE/2, CY = SIZE/2, R = 62, RI = 12;
  const angle = i => (Math.PI*2*i/N) - Math.PI/2;
  const pt = (i,r) => ({ x: CX+r*Math.cos(angle(i)), y: CY+r*Math.sin(angle(i)) });

  const polyPts = CRITERIA.map((c,i) => {
    const v = scores[c] ?? null;
    return pt(i, v !== null ? RI+(v/10)*(R-RI) : RI);
  });
  const polyPath = polyPts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+'Z';

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{width:'100%',maxWidth:SIZE,display:'block',margin:'0 auto'}}>
      {[0.2,0.4,0.6,0.8,1].map(f=>{
        const rpts = CRITERIA.map((_,i)=>pt(i,RI+(R-RI)*f));
        const p = rpts.map((pt,i)=>`${i===0?'M':'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ')+'Z';
        return <path key={f} d={p} fill="none" stroke="rgba(212,206,196,0.08)" strokeWidth="0.5"/>;
      })}
      {CRITERIA.map((_,i)=>{
        const o=pt(i,R+8); return <line key={i} x1={CX} y1={CY} x2={o.x.toFixed(1)} y2={o.y.toFixed(1)} stroke="rgba(212,206,196,0.08)" strokeWidth="0.5"/>;
      })}
      <path d={polyPath} fill={`${color}30`} stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      {CRITERIA.map((c,i)=>{
        const v=scores[c]??null; if(!v) return null;
        const p=pt(i,RI+(v/10)*(R-RI));
        return <circle key={c} cx={p.x} cy={p.y} r={2.5} fill={color} stroke="rgba(20,14,8,0.6)" strokeWidth="0.5"/>;
      })}
      {CRITERIA.map((c,i)=>{
        const lp=pt(i,R+14);
        return <text key={c} x={lp.x} y={lp.y+3} textAnchor="middle" fill="rgba(212,206,196,0.5)" fontSize={7} fontFamily="monospace">{c}</text>;
      })}
      <circle cx={CX} cy={CY} r={2} fill="rgba(212,206,196,0.15)"/>
    </svg>
  );
}

function hexRgb(hex) {
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r?`${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`:'128,128,128';
}
