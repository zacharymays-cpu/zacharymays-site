'use client';
import { useState, useMemo } from 'react';

const CRITERIA = ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'];
const C_NAMES = { C1:'Leadership',C2:'Sacred Assumptions',C3:'Mission',C4:'Individuality',C5:'Isolation',C6:'Vernacular',C7:'Us/Them',C8:'Labor',C9:'Exit Costs',C10:'Ends/Means' };
const TIERS = ['Super Culty','Kinda Culty','Not Culty'];
const TIER_COLORS = { 'Super Culty':'#e8574d','Kinda Culty':'#d99b3e','Not Culty':'#5cb878' };

function scoreColor(v) {
  if (v === null || v === undefined) return 'rgba(212,206,196,0.05)';
  if (v >= 9) return 'rgba(232,87,77,0.95)';
  if (v >= 8) return 'rgba(232,87,77,0.78)';
  if (v >= 7) return 'rgba(217,155,62,0.82)';
  if (v >= 6) return 'rgba(217,155,62,0.78)';
  if (v >= 5) return 'rgba(92,184,120,0.7)';
  if (v >= 4) return 'rgba(80,140,80,0.65)';
  if (v >= 3) return 'rgba(92,184,120,0.55)';
  if (v >= 2) return 'rgba(92,184,120,0.38)';
  return 'rgba(92,184,120,0.22)';
}

export default function HeatmapClient({ orgs=[], scoreMap={} }) {
  const [tierFilter, setTierFilter] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortMode, setSortMode] = useState('composite'); // composite | tier | C1..C10
  const [hovered, setHovered] = useState(null); // {org, criterion, score, x, y}

  const categories = useMemo(() => {
    const s = new Set(orgs.map(o=>o.category)); return [...s].sort();
  }, [orgs]);

  const filtered = useMemo(() => {
    let r = orgs;
    if (tierFilter.length) r = r.filter(o => tierFilter.includes(o.composite_tier));
    if (categoryFilter) r = r.filter(o => o.category === categoryFilter);
    if (sortMode === 'composite') return [...r].sort((a,b) => parseFloat(b.composite_score)-parseFloat(a.composite_score));
    if (sortMode === 'tier') return [...r].sort((a,b) => TIERS.indexOf(a.composite_tier)-TIERS.indexOf(b.composite_tier));
    // sort by criterion
    if (CRITERIA.includes(sortMode)) return [...r].sort((a,b) => {
      const av = scoreMap[a.id]?.[sortMode] ?? -1;
      const bv = scoreMap[b.id]?.[sortMode] ?? -1;
      return bv - av;
    });
    return r;
  }, [orgs, tierFilter, categoryFilter, sortMode, scoreMap]);

  const toggle = (v, state, setter) => setter(state.includes(v) ? state.filter(x=>x!==v) : [...state, v]);

  const ROW_H = 18;
  const LABEL_W = 180;
  const HEADER_H = 80;
  const totalH = HEADER_H + filtered.length * ROW_H;

  return (
    <div style={{minHeight:'100vh'}}>
      {/* Header */}
      <div style={{padding:'1.25rem 0 0.75rem'}}>
        <div className="container--wide">
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
            <div style={{fontFamily:'var(--mono)',fontSize:'0.68rem',color:'var(--muted)'}}>
              {filtered.length} organizations · hover cells for detail
            </div>
          </div>
          <p style={{fontSize:'0.82rem',color:'rgba(212,206,196,0.72)',lineHeight:1.5,maxWidth:'54rem',marginTop:'0.6rem'}}>
            Each row is an organization and each column is one of the ten “cultiness” criteria (C1–C10:
            Leadership, Sacred Assumptions, Mission, Individuality, Isolation, Vernacular, Us/Them, Labor,
            Exit Costs, Ends/Means). A cell is that org's score on that criterion, 0–10 —
            <span style={{color:'#5cb878'}}> green = low</span>,
            <span style={{color:'#d99b3e'}}> amber = moderate</span>,
            <span style={{color:'#e8574d'}}> red = high</span>; the right column is the overall composite.
            Hover a cell for its criterion name; click a column header to sort by it.
          </p>
          {/* Controls */}
          <div style={{display:'flex',gap:'1rem',marginTop:'1rem',flexWrap:'wrap',alignItems:'center'}}>
            <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
              {TIERS.map(t=>(
                <button key={t} onClick={()=>toggle(t,tierFilter,setTierFilter)}
                  style={{fontFamily:'var(--mono)',fontSize:'0.6rem',padding:'0.25rem 0.55rem',
                    background:tierFilter.includes(t)?`rgba(${hexRgb(TIER_COLORS[t])},0.2)`:'transparent',
                    border:`1px solid ${tierFilter.includes(t)?TIER_COLORS[t]:'rgba(212,206,196,0.18)'}`,
                    color:tierFilter.includes(t)?TIER_COLORS[t]:'var(--muted)',cursor:'pointer'}}>
                  {t}
                </button>
              ))}
            </div>
            <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}
              style={{fontFamily:'var(--mono)',fontSize:'0.68rem',background:'rgba(244,240,232,0.04)',border:'1px solid rgba(212,206,196,0.2)',color:'var(--muted)',padding:'0.3rem 0.6rem',cursor:'pointer'}}>
              <option value=''>All categories</option>
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{display:'flex',gap:'0.4rem',alignItems:'center'}}>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'var(--muted)'}}>Sort:</span>
              {['composite','tier',...CRITERIA].map(s=>(
                <button key={s} onClick={()=>setSortMode(s)}
                  style={{fontFamily:'var(--mono)',fontSize:'0.6rem',padding:'0.2rem 0.45rem',
                    background:sortMode===s?'rgba(200,168,75,0.15)':'transparent',
                    border:`1px solid ${sortMode===s?'rgba(200,168,75,0.4)':'rgba(212,206,196,0.15)'}`,
                    color:sortMode===s?'var(--gold)':'var(--muted)',cursor:'pointer'}}>
                  {s==='composite'?'Score':s==='tier'?'Tier':s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container--wide" style={{paddingTop:'1.5rem',paddingBottom:'4rem',overflowX:'auto'}}>
        {/* Color scale legend */}
        <div style={{display:'flex',gap:'2px',alignItems:'center',marginBottom:'1.25rem',flexWrap:'wrap',gap:'0.75rem'}}>
          <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'var(--muted)'}}>Score:</span>
          {[null,1,2,3,4,5,6,7,8,9,10].map(v=>(
            <div key={v ?? 'na'} style={{display:'flex',alignItems:'center',gap:'4px'}}>
              <div style={{width:14,height:14,background:scoreColor(v),border:'1px solid rgba(212,206,196,0.1)'}}/>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.58rem',color:'rgba(212,206,196,0.4)'}}>{v===null?'N/A':v}</span>
            </div>
          ))}
        </div>

        <div style={{position:'relative'}}>
          {/* Column headers */}
          <div style={{display:'flex',position:'sticky',top:0,zIndex:10,background:'var(--ink)',borderBottom:'1px solid rgba(212,206,196,0.12)',paddingBottom:'0.4rem'}}>
            <div style={{width:LABEL_W,flexShrink:0,fontFamily:'var(--mono)',fontSize:'0.58rem',color:'var(--muted)',letterSpacing:'0.1em',textTransform:'uppercase',paddingTop:'0.5rem'}}>Organization</div>
            {CRITERIA.map(c=>(
              <div key={c} style={{flex:1,minWidth:38,textAlign:'center'}}>
                <button onClick={()=>setSortMode(c)}
                  style={{background:'transparent',border:'none',cursor:'pointer',padding:'2px 0',width:'100%'}}>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:sortMode===c?'var(--gold)':'var(--muted)',fontWeight:sortMode===c?700:400}}>{c}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.52rem',color:'rgba(212,206,196,0.3)',marginTop:'2px',maxWidth:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{C_NAMES[c]}</div>
                </button>
              </div>
            ))}
            <div style={{width:56,flexShrink:0,fontFamily:'var(--mono)',fontSize:'0.58rem',color:'var(--muted)',textAlign:'right',paddingTop:'0.5rem'}}>Score</div>
          </div>

          {/* Rows */}
          {filtered.map((org,i) => {
            const scores = scoreMap[org.id] || {};
            const tc = TIER_COLORS[org.composite_tier] || '#666';
            return (
              <div key={org.id} style={{display:'flex',alignItems:'center',borderBottom:'1px solid rgba(212,206,196,0.04)',
                background:i%2===0?'transparent':'rgba(244,240,232,0.01)'}}>
                {/* Label */}
                <div style={{width:LABEL_W,flexShrink:0,display:'flex',alignItems:'center',gap:'6px',paddingRight:'8px',minWidth:0}}>
                  <div style={{width:3,height:ROW_H-2,background:tc,flexShrink:0,borderRadius:1}}/>
                  <span style={{fontFamily:'var(--serif)',fontSize:'0.72rem',color:'var(--paper)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}} title={org.name}>{org.name}</span>
                </div>
                {/* Criterion cells */}
                {CRITERIA.map(c => {
                  const v = scores[c] ?? null;
                  return (
                    <div key={c} style={{flex:1,minWidth:38,height:ROW_H,display:'flex',alignItems:'center',justifyContent:'center',padding:'1px'}}
                      onMouseEnter={e=>setHovered({org,criterion:c,score:v,x:e.clientX,y:e.clientY})}
                      onMouseLeave={()=>setHovered(null)}>
                      <div style={{width:'100%',height:'100%',background:scoreColor(v),display:'flex',alignItems:'center',justifyContent:'center',cursor:'default'}}>
                        {v!==null&&<span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'rgba(255,255,255,0.7)',lineHeight:1}}>{v}</span>}
                      </div>
                    </div>
                  );
                })}
                {/* Score */}
                <div style={{width:56,flexShrink:0,fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--gold)',textAlign:'right',paddingRight:4}}>
                  {parseFloat(org.composite_score).toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover tooltip */}
      {hovered&&(
        <div style={{position:'fixed',left:hovered.x+12,top:hovered.y-44,
          background:'rgba(18,14,10,0.97)',border:'1px solid rgba(200,168,75,0.5)',
          padding:'0.45rem 0.7rem',pointerEvents:'none',zIndex:9999,fontFamily:'monospace',fontSize:'0.7rem'}}>
          <div style={{color:'var(--paper)',fontWeight:600,marginBottom:'2px'}}>{hovered.org.name}</div>
          <div style={{color:'var(--gold)'}}>{hovered.criterion} · {C_NAMES[hovered.criterion]}</div>
          <div style={{color:'rgba(212,206,196,0.6)',marginTop:'2px'}}>{hovered.score !== null ? `${hovered.score}/10` : 'N/A'}</div>
        </div>
      )}
    </div>
  );
}

function hexRgb(hex) {
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r?`${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`:'128,128,128';
}
