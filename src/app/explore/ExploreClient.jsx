'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

const TIER_COLORS = {
  'Cult':'#c02020','Cult Dynamics':'#c04040','High Control':'#b07030',
  'Concerning':'#a09040','Mildly Culty':'#6a9840','Healthy Group':'#30a060',
};
const TIER_CLASS = {
  'Cult':'tier-cult','Cult Dynamics':'tier-cult-dynamics','High Control':'tier-high-control',
  'Concerning':'tier-concerning','Mildly Culty':'tier-mildly-culty','Healthy Group':'tier-healthy-group',
};
const TIERS = ['Cult','Cult Dynamics','High Control','Concerning','Mildly Culty','Healthy Group'];
const TRAJECTORIES = ['Stable','Escalating','Declining','Defunct'];
const CRITERIA = ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'];
const CRITERIA_DETAIL = {
  C1:{name:'Charismatic Leadership',desc:'Has a defined, charismatic leader — or a central authoritative idea — treated as extraordinary, directives taken as truth, dissenters discredited.'},
  C2:{name:'Sacred Assumptions',desc:'Requires shared beliefs maintained against counter-evidence, mantras repeated, alternatives dismissed. Includes self-sealing loops that prevent falsification.'},
  C3:{name:'Transcendent Mission',desc:'Pursues a mission so big it justifies sacrifice — framing that extracts sacrifice, treats doubts as betrayal, overrides individual judgment.'},
  C4:{name:'Sublimation of Individuality',desc:'Demands continual sublimation of individuality — identity demands, lifestyle conformity, rest-as-weakness, reputational double binds.'},
  C5:{name:'Isolation',desc:'Limits access to outsiders — information environment narrows, outside perspectives dismissed. Includes ecosystem isolation and algorithmic epistemic dependency.'},
  C6:{name:'Private Vernacular',desc:'Creates private vocabulary that marks membership, encodes a worldview inaccessible from outside, and terminates inquiry rather than enabling it.'},
  C7:{name:'Us-Versus-Them',desc:'Programs us-vs-them mentality — enlightened-vs-outsiders framing, defectors-as-broken, disagreement-as-bigotry. Includes institutionalized population targeting.'},
  C8:{name:'Exploitation of Labor',desc:'Exploits members\' labor — sacrifice extracted as virtue, labor monetized. Financial extraction through doctrinal framing scores equivalently to physical labor capture.'},
  C9:{name:'High Exit Costs',desc:'Departure produces social, economic, or identity costs; exit framed as betrayal. Spiritual absolutism and classified knowledge create extreme exit cost profiles.'},
  C10:{name:'Ends Justify the Means',desc:'Institutional harm tolerated in pursuit of mission, cover-ups occur, perpetrators protected. Multi-generation non-correcting patterns score at the ceiling.'},
};

// ── Criterion row inside the modal ──────────────────────────────────────────
function CriterionRow({ code, score, bodyText }) {
  const [expanded, setExpanded] = useState(false);
  const detail = CRITERIA_DETAIL[code];
  const isNA = score === null || score === undefined;
  const pct = !isNA ? (score/10)*100 : 0;
  const color = !isNA ? (score>=8?'#c02020':score>=6?'#b07030':score>=4?'#a09040':'#30a060') : 'transparent';

  return (
    <div style={{borderBottom:'1px solid rgba(212,206,196,0.08)'}}>
      <div onClick={()=>setExpanded(e=>!e)}
        style={{display:'grid',gridTemplateColumns:'2.2rem 1fr 2.8rem auto',gap:'0.6rem',alignItems:'center',
          padding:'0.75rem 0',cursor:'pointer',userSelect:'none'}}>
        <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--gold)',letterSpacing:'0.05em'}}>{code}</span>
        <div>
          <div style={{fontSize:'0.83rem',color:'var(--paper)',fontFamily:'var(--serif)',marginBottom:'0.3rem',lineHeight:1.2}}>{detail.name}</div>
          <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
            <div style={{flex:1,height:'3px',background:'rgba(212,206,196,0.1)',borderRadius:'2px'}}>
              {!isNA&&<div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:'2px',transition:'width 0.3s'}}/>}
            </div>
          </div>
        </div>
        <span style={{fontFamily:'var(--mono)',fontSize:'0.75rem',
          color:isNA?'rgba(212,206,196,0.3)':'var(--paper)',textAlign:'right',letterSpacing:'-0.02em'}}>
          {isNA ? 'N/A' : `${score}/10`}
        </span>
        <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'rgba(212,206,196,0.3)'}}>{expanded?'▲':'▼'}</span>
      </div>
      {expanded&&(
        <div style={{padding:'0 0 1rem 2.8rem'}}>
          <p style={{fontSize:'0.78rem',color:'rgba(212,206,196,0.45)',fontStyle:'italic',lineHeight:1.65,marginBottom:bodyText?'0.75rem':0}}>
            {detail.desc}
          </p>
          {bodyText ? (
            <div style={{background:'rgba(244,240,232,0.03)',border:'1px solid rgba(212,206,196,0.1)',padding:'0.9rem',marginTop:'0.4rem'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.5rem'}}>Analytical Notes</div>
              <p style={{fontSize:'0.81rem',color:'var(--muted)',lineHeight:1.75,margin:0}}>{bodyText}</p>
            </div>
          ) : (
            <div style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'rgba(212,206,196,0.22)',fontStyle:'italic',marginTop:'0.35rem'}}>
              Analytical notes pending review
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Radar / Spider Chart ──────────────────────────────────────────────────────
function RadarChart({ scores }) {
  const CRITERIA = ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'];
  const N = CRITERIA.length;
  const SIZE = 160;
  const CX = SIZE/2, CY = SIZE/2, R = 62, R_INNER = 12;

  const angle = (i) => (Math.PI * 2 * i / N) - Math.PI/2;
  const pt = (i, r) => {
    const a = angle(i);
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
  };

  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const polyPts = CRITERIA.map((c,i) => {
    const v = scores[c]?.score ?? null;
    const r = v !== null ? R_INNER + (v/10) * (R - R_INNER) : R_INNER;
    return pt(i, r);
  });

  const polyPath = polyPts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+'Z';

  // Color by average score
  const validScores = CRITERIA.map(c=>scores[c]?.score).filter(v=>v!=null);
  const avg = validScores.length ? validScores.reduce((a,b)=>a+b,0)/validScores.length : 0;
  const fill = avg>=8?'rgba(192,32,32,0.25)':avg>=6?'rgba(176,96,32,0.22)':avg>=4?'rgba(160,144,48,0.2)':'rgba(48,160,96,0.18)';
  const stroke = avg>=8?'rgba(192,32,32,0.8)':avg>=6?'rgba(176,96,32,0.75)':avg>=4?'rgba(160,144,48,0.7)':'rgba(48,160,96,0.6)';

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{width:'100%',maxWidth:SIZE,display:'block',margin:'0 auto'}}>
      {/* Rings */}
      {rings.map(f=>{
        const ringPts = CRITERIA.map((_,i)=>pt(i,R_INNER+(R-R_INNER)*f));
        const path=ringPts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+'Z';
        return <path key={f} d={path} fill="none" stroke="rgba(212,206,196,0.1)" strokeWidth="0.5"/>;
      })}
      {/* Spokes */}
      {CRITERIA.map((_,i)=>{
        const outer=pt(i,R+8);
        return <line key={i} x1={CX} y1={CY} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)} stroke="rgba(212,206,196,0.1)" strokeWidth="0.5"/>;
      })}
      {/* Data polygon */}
      <path d={polyPath} fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Data points */}
      {CRITERIA.map((c,i)=>{
        const v=scores[c]?.score??null;
        if(v===null) return null;
        const p=pt(i, R_INNER+(v/10)*(R-R_INNER));
        return <circle key={c} cx={p.x} cy={p.y} r={2.5} fill={stroke} stroke="rgba(26,20,14,0.6)" strokeWidth="0.5"/>;
      })}
      {/* Criterion labels */}
      {CRITERIA.map((c,i)=>{
        const lp=pt(i,R+14);
        const v=scores[c]?.score??null;
        return (
          <g key={c}>
            <text x={lp.x} y={lp.y+3} textAnchor="middle" fill={v===null?'rgba(212,206,196,0.25)':'rgba(212,206,196,0.65)'} fontSize={7} fontFamily="monospace">{c}</text>
          </g>
        );
      })}
      {/* Center dot */}
      <circle cx={CX} cy={CY} r={2} fill="rgba(212,206,196,0.2)"/>
    </svg>
  );
}


// ── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ org, criterionScores, loading, onClose }) {
  const scores = criterionScores[org?.id] || {};
  const tierColor = TIER_COLORS[org?.composite_tier] || '#888';
  const composite = org ? parseFloat(org.composite_score).toFixed(1) : '—';

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!org) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:'fixed',inset:0,background:'rgba(10,8,6,0.75)',zIndex:1000,
        backdropFilter:'blur(2px)',
        animation:'fadeIn 0.18s ease',
      }}/>

      {/* Panel — slides in from right */}
      <div style={{
        position:'fixed',top:0,right:0,bottom:0,
        width:'min(680px,100vw)',
        background:'#1c1814',
        borderLeft:'1px solid rgba(212,206,196,0.15)',
        zIndex:1001,
        overflowY:'auto',
        overflowX:'hidden',
        animation:'slideIn 0.22s cubic-bezier(0.22,1,0.36,1)',
        boxShadow:'-20px 0 60px rgba(0,0,0,0.5)',
      }}>

        {/* Header */}
        <div style={{
          position:'sticky',top:0,background:'#1c1814',
          borderBottom:'1px solid rgba(212,206,196,0.12)',
          padding:'1.25rem 1.5rem',
          display:'flex',alignItems:'flex-start',justifyContent:'space-between',
          zIndex:2,
        }}>
          <div style={{flex:1,paddingRight:'1rem'}}>
            <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.4rem'}}>
              {org.category}
            </div>
            <h2 style={{fontFamily:'var(--serif)',fontSize:'clamp(1.1rem,3vw,1.5rem)',color:'var(--paper)',lineHeight:1.2,margin:0}}>
              {org.name}
            </h2>
          </div>
          <button onClick={onClose} style={{
            background:'transparent',border:'1px solid rgba(212,206,196,0.15)',
            color:'var(--muted)',fontFamily:'var(--mono)',fontSize:'0.75rem',
            cursor:'pointer',padding:'0.4rem 0.7rem',flexShrink:0,lineHeight:1,
          }}>✕ ESC</button>
        </div>

        <div style={{padding:'1.5rem'}}>

          {/* Tier + trajectory badge row */}
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.35rem 0.75rem',
              background:`rgba(${hexToRgb(tierColor)},0.15)`,
              border:`1px solid rgba(${hexToRgb(tierColor)},0.4)`}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:tierColor}}/>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.1em',color:tierColor}}>{org.composite_tier}</span>
            </div>
            {org.trajectory&&(
              <div style={{padding:'0.35rem 0.75rem',border:'1px solid rgba(212,206,196,0.15)'}}>
                <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.08em',color:'var(--muted)'}}>{org.trajectory}</span>
              </div>
            )}
          </div>

          {/* Score cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'rgba(212,206,196,0.08)',marginBottom:'1.75rem'}}>
            {[
              {label:'Composite',value:`${composite}%`,color:'var(--gold)'},
              {label:"Young's",value:`${org.youngs_score}/10`,color:'var(--paper)'},
              {label:"Young's Band",value:org.youngs_band||'—',color:'var(--muted)'},
            ].map((s,i)=>(
              <div key={i} style={{background:'#1c1814',padding:'1rem 0.75rem',textAlign:'center'}}>
                <div style={{fontFamily:'var(--serif)',fontSize:'1.35rem',fontWeight:700,color:s.color,lineHeight:1,marginBottom:'0.3rem'}}>{s.value}</div>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)'}}>{s.label}</div>
              </div>
            ))}
          </div>

          
          {/* Radar chart */}
          {!loading && Object.keys(scores).length > 0 && (
            <div style={{marginBottom:'1.75rem',padding:'1rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.75rem',textAlign:'center'}}>Criterion Profile</div>
              <RadarChart scores={scores} />
              <div style={{display:'flex',justifyContent:'space-between',marginTop:'0.5rem',paddingTop:'0.5rem',borderTop:'1px solid rgba(212,206,196,0.07)'}}>
                <span style={{fontFamily:'var(--mono)',fontSize:'0.58rem',color:'rgba(212,206,196,0.3)'}}>1 inner</span>
                <span style={{fontFamily:'var(--mono)',fontSize:'0.58rem',color:'rgba(212,206,196,0.3)'}}>10 outer · N/A = center</span>
              </div>
            </div>
          )}

{/* Summary */}
          {org.summary_text&&(
            <div style={{marginBottom:'1.75rem',padding:'1rem 1.1rem',background:'rgba(244,240,232,0.03)',borderLeft:`3px solid ${tierColor}`,borderRight:'1px solid rgba(212,206,196,0.08)',borderTop:'1px solid rgba(212,206,196,0.08)',borderBottom:'1px solid rgba(212,206,196,0.08)'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.6rem'}}>Assessment</div>
              <p style={{fontSize:'0.86rem',color:'var(--muted)',lineHeight:1.75,margin:0}}>{org.summary_text}</p>
            </div>
          )}

          {/* Criteria */}
          <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.75rem'}}>
            Criterion Scores
            <span style={{color:'rgba(212,206,196,0.3)',marginLeft:'0.5rem',fontSize:'0.55rem'}}>— click any row to expand</span>
          </div>

          {loading ? (
            <div style={{padding:'2rem 0',textAlign:'center',fontFamily:'var(--mono)',fontSize:'0.75rem',color:'var(--muted)'}}>
              Loading criteria…
            </div>
          ) : (
            <div style={{marginBottom:'1.25rem'}}>
              {CRITERIA.map(c=>(
                <CriterionRow key={c} code={c} score={scores[c]?.score} bodyText={scores[c]?.bodyText}/>
              ))}
            </div>
          )}

          {/* N/A note */}
          <div style={{padding:'0.75rem 1rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.07)',marginBottom:'1.5rem'}}>
            <p style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'rgba(212,206,196,0.3)',margin:0,lineHeight:1.65}}>
              N/A indicates structural inapplicability — the criterion describes a dynamic that is absent by design or whose documented behavior is the structural opposite of the criterion. It is not a low score.
            </p>
          </div>

          {/* Scope / membership */}
          {org.membership_scope && (
            <div style={{marginBottom:'1.5rem'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.35rem'}}>Scope</div>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.75rem',color:'var(--muted)',lineHeight:1.6}}>{org.membership_scope}</div>
            </div>
          )}

          {/* Close footer */}
          <div style={{paddingTop:'1rem',borderTop:'1px solid rgba(212,206,196,0.08)',display:'flex',justifyContent:'flex-end'}}>
            <button onClick={onClose} style={{
              fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.1em',textTransform:'uppercase',
              padding:'0.55rem 1.25rem',background:'transparent',
              border:'1px solid rgba(212,206,196,0.2)',color:'var(--muted)',cursor:'pointer',
            }}>Close ✕</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }
      `}</style>
    </>
  );
}

// Simple hex to rgb helper for rgba()
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1],16)},${parseInt(result[2],16)},${parseInt(result[3],16)}` : '128,128,128';
}

// ── Main Explorer ─────────────────────────────────────────────────────────────
export default function ExploreClient({ initialOrgs=[] }) {
  const [orgs] = useState(initialOrgs);
  const [criterionScores, setCriterionScores] = useState({});
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState([]);
  const [trajFilter, setTrajFilter] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [sortBy, setSortBy] = useState('composite_score');
  const [sortDir, setSortDir] = useState('desc');
  const [scoreMin, setScoreMin] = useState(0);
  const [scoreMax, setScoreMax] = useState(100);

  const categories = useMemo(() => {
    const counts = {};
    orgs.forEach(o => { counts[o.category] = (counts[o.category]||0)+1; });
    return Object.entries(counts).sort((a,b) => b[1]-a[1]);
  }, [orgs]);

  const openDetail = (org) => {
    setSelected(org);
    if (criterionScores[org.id]) return;
    setLoadingDetail(true);
    fetch(`${SUPABASE_URL}/rest/v1/criterion_scores?org_id=eq.${org.id}&select=criterion,score,body_text&order=criterion`,
      {headers:{apikey:ANON_KEY,Authorization:`Bearer ${ANON_KEY}`}})
      .then(r=>r.json())
      .then(data=>{
        const map={};
        data.forEach(d=>{map[d.criterion]={score:d.score!==null?parseFloat(d.score):null,bodyText:d.body_text||null};});
        setCriterionScores(prev=>({...prev,[org.id]:map}));
        setLoadingDetail(false);
      }).catch(()=>setLoadingDetail(false));
  };

  const closeDetail = () => setSelected(null);

  const toggle = (val,state,setter) =>
    setter(state.includes(val)?state.filter(v=>v!==val):[...state,val]);

  const hasFilters = search||tierFilter.length||trajFilter.length||categoryFilter.length||scoreMin>0||scoreMax<100;

  const filtered = useMemo(()=>{
    let result = orgs.filter(o=>{
      if(search&&!o.name.toLowerCase().includes(search.toLowerCase())&&
         !o.category.toLowerCase().includes(search.toLowerCase())) return false;
      if(tierFilter.length&&!tierFilter.includes(o.composite_tier)) return false;
      if(trajFilter.length&&!trajFilter.includes(o.trajectory)) return false;
      if(categoryFilter.length&&!categoryFilter.includes(o.category)) return false;
      const s=parseFloat(o.composite_score);
      if(s<scoreMin||s>scoreMax) return false;
      return true;
    });
    return [...result].sort((a,b)=>{
      let av=a[sortBy],bv=b[sortBy];
      if(typeof av==='string'){av=av.toLowerCase();bv=bv.toLowerCase();}
      if(av<bv) return sortDir==='asc'?-1:1;
      if(av>bv) return sortDir==='asc'?1:-1;
      return 0;
    });
  },[orgs,search,tierFilter,trajFilter,categoryFilter,sortBy,sortDir,scoreMin,scoreMax]);

  const handleSort=(col)=>{
    if(sortBy===col) setSortDir(d=>d==='asc'?'desc':'asc');
    else{setSortBy(col);setSortDir('desc');}
  };
  const SortIcon=({col})=>sortBy!==col
    ?<span style={{color:'rgba(212,206,196,0.2)'}}>↕</span>
    :<span style={{color:'var(--gold)'}}>{sortDir==='asc'?'↑':'↓'}</span>;

  return (
    <div style={{minHeight:'100vh'}}>
      {/* Sticky header */}
      <div style={{borderBottom:'1px solid rgba(212,206,196,0.1)',padding:'2rem 0 1.5rem',background:'var(--ink)',position:'sticky',top:'60px',zIndex:50}}>
        <div className="container--wide">
          <div className="explore-header-row">
            <div>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--gold)'}}>
                <Link href="/cultiness" style={{color:'var(--gold)'}}>The Cultiness Spectrum</Link>{' '}—{' '}
              </span>
              <h1 style={{fontFamily:'var(--serif)',fontSize:'clamp(1.4rem,3vw,2.2rem)',color:'var(--paper)',display:'inline',marginLeft:'0.4rem'}}>
                Dataset Explorer
              </h1>
            </div>
            <div style={{display:'flex',gap:'1.5rem',alignItems:'center'}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontFamily:'var(--serif)',fontSize:'1.4rem',fontWeight:700,color:'var(--gold)',lineHeight:1}}>{filtered.length}</div>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)'}}>Showing</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontFamily:'var(--serif)',fontSize:'1.4rem',fontWeight:700,color:'var(--paper)',lineHeight:1}}>{orgs.length}</div>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)'}}>Total</div>
              </div>
              <Link href="/compass" className="explore-compass-link" style={{fontFamily:'var(--mono)',fontSize:'0.68rem',letterSpacing:'0.1em',textTransform:'uppercase',padding:'0.45rem 0.9rem',border:'1px solid rgba(200,168,75,0.4)',color:'var(--gold)',textDecoration:'none'}}>
                Compass →
              </Link>
            </div>
          </div>
          <div style={{marginTop:'1.25rem'}}>
            <input type="text" placeholder="Search organizations or categories..." value={search}
              onChange={e=>setSearch(e.target.value)}
              style={{width:'100%',maxWidth:'480px',background:'rgba(244,240,232,0.04)',border:'1px solid rgba(212,206,196,0.2)',color:'var(--paper)',fontFamily:'var(--body)',fontSize:'0.9rem',padding:'0.6rem 1rem',outline:'none'}}/>
          </div>
        </div>
      </div>

      <div className="container--wide" style={{paddingTop:'2rem',paddingBottom:'4rem'}}>
        <div className={`explore-layout${sidebarOpen?'':' collapsed'}`}>

          {/* Sidebar */}
          <div className="explore-sidebar">
            <button className="explore-filter-toggle" onClick={()=>setSidebarOpen(o=>!o)}>
              <span className="filter-label">
                Filters{hasFilters?` (${tierFilter.length+trajFilter.length+categoryFilter.length+(search?1:0)} active)`:''}
              </span>
              <span style={{fontSize:'0.8rem'}}>{sidebarOpen?'◀':'▶'}</span>
            </button>

            <div className="explore-sidebar-body">
              {/* Tier */}
              <div style={{marginBottom:'1.25rem'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.5rem'}}>Tier</div>
                {TIERS.map(t=>(
                  <label key={t} style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.3rem',cursor:'pointer'}}>
                    <input type="checkbox" checked={tierFilter.includes(t)} onChange={()=>toggle(t,tierFilter,setTierFilter)} style={{accentColor:TIER_COLORS[t]}}/>
                    <span style={{fontSize:'0.77rem',color:tierFilter.includes(t)?'var(--paper)':'var(--muted)',flex:1}}>{t}</span>
                    <span style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'var(--muted)'}}>{orgs.filter(o=>o.composite_tier===t).length}</span>
                  </label>
                ))}
              </div>

              {/* Category */}
              <div style={{marginBottom:'1.25rem'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.5rem'}}>Category</div>
                <div style={{maxHeight:'200px',overflowY:'auto',paddingRight:'0.25rem'}}>
                  {categories.map(([cat,count])=>(
                    <label key={cat} style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.3rem',cursor:'pointer'}}>
                      <input type="checkbox" checked={categoryFilter.includes(cat)} onChange={()=>toggle(cat,categoryFilter,setCategoryFilter)}/>
                      <span style={{fontSize:'0.77rem',color:categoryFilter.includes(cat)?'var(--paper)':'var(--muted)',flex:1,lineHeight:1.3}}>{cat}</span>
                      <span style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'var(--muted)',flexShrink:0}}>{count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Trajectory */}
              <div style={{marginBottom:'1.25rem'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.5rem'}}>Trajectory</div>
                {TRAJECTORIES.map(t=>(
                  <label key={t} style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.3rem',cursor:'pointer'}}>
                    <input type="checkbox" checked={trajFilter.includes(t)} onChange={()=>toggle(t,trajFilter,setTrajFilter)}/>
                    <span style={{fontSize:'0.77rem',color:trajFilter.includes(t)?'var(--paper)':'var(--muted)',flex:1}}>{t}</span>
                    <span style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'var(--muted)'}}>{orgs.filter(o=>o.trajectory===t).length}</span>
                  </label>
                ))}
              </div>

              {/* Score range */}
              <div style={{marginBottom:'1.25rem'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.5rem'}}>
                  Score: {scoreMin}%–{scoreMax}%
                </div>
                <input type="range" min="0" max="100" value={scoreMin} onChange={e=>setScoreMin(Math.min(Number(e.target.value),scoreMax-5))} style={{width:'100%',marginBottom:'0.35rem',accentColor:'var(--gold)'}}/>
                <input type="range" min="0" max="100" value={scoreMax} onChange={e=>setScoreMax(Math.max(Number(e.target.value),scoreMin+5))} style={{width:'100%',accentColor:'var(--gold)'}}/>
              </div>

              {hasFilters&&(
                <button onClick={()=>{setSearch('');setTierFilter([]);setTrajFilter([]);setCategoryFilter([]);setScoreMin(0);setScoreMax(100);}}
                  style={{fontFamily:'var(--mono)',fontSize:'0.63rem',letterSpacing:'0.1em',textTransform:'uppercase',padding:'0.45rem 0.9rem',width:'100%',background:'transparent',border:'1px solid rgba(212,206,196,0.25)',color:'var(--muted)',cursor:'pointer'}}>
                  Clear All
                </button>
              )}

              {/* Hint */}
              <div style={{marginTop:'1.5rem',padding:'0.75rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.07)'}}>
                <p style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'rgba(212,206,196,0.3)',margin:0,lineHeight:1.65}}>
                  Click any row to open the full detail panel. Press Esc to close.
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div>
            <div style={{overflowX:'auto',overflowY:'auto',maxHeight:'70vh',border:'1px solid rgba(212,206,196,0.1)'}}>
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:'500px'}}>
                <thead style={{position:'sticky',top:0,background:'#1a1512',zIndex:1}}>
                  <tr style={{borderBottom:'1px solid rgba(212,206,196,0.2)'}}>
                    {[['name','Organization'],['composite_score','Score'],['youngs_score',"Young's"],['category','Category'],['trajectory','Trajectory']].map(([col,label])=>(
                      <th key={col} onClick={()=>handleSort(col)} className={col==='category'||col==='trajectory'?'explore-table-hide-mobile':''} style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',textAlign:'left',padding:'0.6rem 0.75rem',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}>
                        {label} <SortIcon col={col}/>
                      </th>
                    ))}
                    <th style={{fontFamily:'var(--mono)',fontSize:'0.6rem',color:'rgba(212,206,196,0.2)',padding:'0.6rem 0.75rem',textAlign:'right'}}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((org,i)=>(
                    <tr key={org.id} onClick={()=>openDetail(org)}
                      className={TIER_CLASS[org.composite_tier]||''}
                      style={{borderBottom:'1px solid rgba(212,206,196,0.07)',
                        background:selected?.id===org.id?'rgba(200,168,75,0.05)':i%2===0?'transparent':'rgba(244,240,232,0.012)',
                        cursor:'pointer',transition:'background 0.1s'}}>
                      <td style={{padding:'0.65rem 0.75rem',color:'var(--paper)',fontSize:'0.88rem',fontFamily:'var(--serif)'}}>{org.name}</td>
                      <td style={{padding:'0.65rem 0.75rem',fontFamily:'var(--mono)',fontSize:'0.82rem',color:'var(--paper)',whiteSpace:'nowrap'}}>{parseFloat(org.composite_score).toFixed(1)}%</td>
                      <td style={{padding:'0.65rem 0.75rem',fontFamily:'var(--mono)',fontSize:'0.82rem',color:'var(--muted)'}}>{org.youngs_score}/10</td>
                      <td className="explore-table-hide-mobile" style={{padding:'0.65rem 0.75rem',color:'var(--muted)',fontSize:'0.75rem',fontFamily:'var(--mono)',whiteSpace:'nowrap'}}>{org.category}</td>
                      <td className="explore-table-hide-mobile" style={{padding:'0.65rem 0.75rem',fontFamily:'var(--mono)',fontSize:'0.72rem',color:'var(--muted)',whiteSpace:'nowrap'}}>{org.trajectory}</td>
                      <td style={{padding:'0.65rem 0.75rem',textAlign:'right',fontFamily:'var(--mono)',fontSize:'0.65rem',color:'rgba(200,168,75,0.35)'}}>→</td>
                    </tr>
                  ))}
                  {filtered.length===0&&(
                    <tr><td colSpan={6} style={{padding:'3rem',textAlign:'center',color:'var(--muted)',fontFamily:'var(--mono)',fontSize:'0.8rem'}}>No organizations match current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:'0.6rem',fontFamily:'var(--mono)',fontSize:'0.62rem',color:'rgba(212,206,196,0.25)',textAlign:'right'}}>
              {filtered.length} of {orgs.length} organizations · click any row for full detail
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selected&&(
        <DetailModal
          org={selected}
          criterionScores={criterionScores}
          loading={loadingDetail}
          onClose={closeDetail}
        />
      )}
    </div>
  );
}
