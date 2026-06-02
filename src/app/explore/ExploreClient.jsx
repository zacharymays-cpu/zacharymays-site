'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

const TIER_COLORS = {
  'Cult':          '#6b1010',
  'Cult Dynamics': '#8b2020',
  'High Control':  '#7a4a1a',
  'Concerning':    '#7a6a2a',
  'Mildly Culty':  '#4a6a2a',
  'Healthy Group': '#2a6b4a',
};
const TIERS = ['Cult','Cult Dynamics','High Control','Concerning','Mildly Culty','Healthy Group'];
const TRAJECTORIES = ['Stable','Escalating','Declining','Defunct'];
const CRITERIA = ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'];

const CRITERIA_DETAIL = {
  C1:  { name: 'Charismatic Leadership',         desc: 'Has a defined, charismatic leader — or a central authoritative idea functioning in place of a person — treated as extraordinary, its directives taken as truth, and dissenters discredited.' },
  C2:  { name: 'Sacred Assumptions',             desc: 'Requires a shared "sacred assumption" — beliefs maintained against counter-evidence, with mantras repeated and alternatives dismissed. Includes self-sealing feedback loops that prevent falsification.' },
  C3:  { name: 'Transcendent Mission',            desc: 'Pursues a transcendent mission so big it justifies sacrifice — mission framing that extracts sacrifice, treats doubts as betrayal, and gives meaning in ways that override individual judgment.' },
  C4:  { name: 'Sublimation of Individuality',   desc: 'Demands continual sublimation of individuality — identity demands, appearance/behavior/lifestyle conformity, rest-as-weakness, and reputational double binds.' },
  C5:  { name: 'Isolation',                      desc: 'Limits members\' access to outsiders — information environment narrows, outside perspectives dismissed, world shrinks. Includes ecosystem isolation and algorithmic epistemic dependency.' },
  C6:  { name: 'Private Vernacular',             desc: 'Creates a private vernacular — specialized vocabulary that marks membership, encodes a worldview inaccessible from outside, and terminates inquiry rather than enabling it.' },
  C7:  { name: 'Us-Versus-Them',                 desc: 'Programs an us-versus-them mentality — more-enlightened-than-outsiders framing, defectors-as-broken, and disagreement-as-bigotry. Includes institutionalized population targeting.' },
  C8:  { name: 'Exploitation of Labor',          desc: 'Exploits members\' labor — sacrifice extracted as virtue, labor monetized through institutional control. Financial extraction coerced through doctrinal framing scores equivalently to physical labor capture.' },
  C9:  { name: 'High Exit Costs',                desc: 'Enforces high exit costs — departure produces social, economic, or identity costs, exit framed as betrayal. Spiritual absolutism and classified knowledge create extreme exit cost profiles.' },
  C10: { name: 'Ends Justify the Means',         desc: 'Justifies extreme behavior as endgame nears — institutional harm tolerated in pursuit of mission, cover-ups occur, perpetrators protected. Multi-generation non-correcting patterns score at the ceiling.' },
};

function TierBadge({ tier, small }) {
  const color = TIER_COLORS[tier] || '#555';
  return (
    <span style={{fontFamily:'var(--mono)',fontSize:small?'0.62rem':'0.68rem',letterSpacing:'0.08em',textTransform:'uppercase',padding:small?'0.2rem 0.5rem':'0.25rem 0.65rem',background:color,color:'#faf8f3',display:'inline-block',whiteSpace:'nowrap'}}>
      {tier}
    </span>
  );
}

function CriterionRow({ code, score, bodyText }) {
  const [expanded, setExpanded] = useState(false);
  const detail = CRITERIA_DETAIL[code];
  const isNA = score === null || score === undefined;
  const scoreColor = !isNA ? (score >= 8 ? '#8b2020' : score >= 6 ? '#7a4a1a' : score >= 4 ? '#7a6a2a' : '#2a6b4a') : 'transparent';
  const pct = !isNA ? (score / 10) * 100 : 0;

  return (
    <div style={{borderBottom:'1px solid rgba(212,206,196,0.08)'}}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{display:'grid',gridTemplateColumns:'2rem 1fr auto',gap:'0.75rem',alignItems:'center',padding:'0.7rem 0',cursor:'pointer'}}
      >
        {/* Criterion code */}
        <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--gold)',letterSpacing:'0.05em'}}>{code}</span>

        {/* Name + bar */}
        <div>
          <div style={{fontSize:'0.82rem',color:'var(--paper)',fontFamily:'var(--serif)',marginBottom:'0.3rem'}}>{detail.name}</div>
          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <div style={{flex:1,height:'3px',background:'rgba(212,206,196,0.12)',borderRadius:'2px'}}>
              {!isNA && <div style={{width:`${pct}%`,height:'100%',background:scoreColor,borderRadius:'2px'}} />}
            </div>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.72rem',color:isNA?'rgba(212,206,196,0.3)':'var(--paper)',minWidth:'2.5rem',textAlign:'right'}}>
              {isNA ? 'N/A' : `${score}/10`}
            </span>
          </div>
        </div>

        {/* Expand toggle */}
        <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'rgba(212,206,196,0.35)',userSelect:'none'}}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{padding:'0 0 1rem 2.75rem'}}>
          {/* Criterion definition */}
          <p style={{fontSize:'0.8rem',color:'rgba(212,206,196,0.5)',fontStyle:'italic',lineHeight:1.6,marginBottom:bodyText?'0.75rem':0}}>
            {detail.desc}
          </p>
          {/* Body text / analytical notes */}
          {bodyText ? (
            <div style={{background:'rgba(244,240,232,0.03)',border:'1px solid rgba(212,206,196,0.1)',padding:'0.9rem',marginTop:'0.5rem'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.5rem'}}>Analytical Notes</div>
              <p style={{fontSize:'0.82rem',color:'var(--muted)',lineHeight:1.7,margin:0}}>{bodyText}</p>
            </div>
          ) : (
            <div style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'rgba(212,206,196,0.25)',marginTop:'0.4rem',fontStyle:'italic'}}>
              Detailed analytical notes pending human review
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExploreClient({ initialOrgs = [] }) {
  const [orgs] = useState(initialOrgs);
  const [criterionScores, setCriterionScores] = useState({});
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState([]);
  const [trajFilter, setTrajFilter] = useState([]);
  const [sortBy, setSortBy] = useState('composite_score');
  const [sortDir, setSortDir] = useState('desc');
  const [scoreMin, setScoreMin] = useState(0);
  const [scoreMax, setScoreMax] = useState(100);

  const loadDetail = (org) => {
    if (selected?.id === org.id) { setSelected(null); return; }
    setSelected(org);
    if (criterionScores[org.id]) return;
    setLoadingDetail(true);
    fetch(`${SUPABASE_URL}/rest/v1/calibration_criterion_scores?anchor_id=eq.${org.id}&select=criterion,score,body_text&order=criterion`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    })
      .then(r => r.json())
      .then(data => {
        const map = {};
        data.forEach(d => { map[d.criterion] = { score: d.score !== null ? parseFloat(d.score) : null, bodyText: d.body_text || null }; });
        setCriterionScores(prev => ({ ...prev, [org.id]: map }));
        setLoadingDetail(false);
      })
      .catch(() => setLoadingDetail(false));
  };

  const toggleFilter = (val, state, setter) =>
    setter(state.includes(val) ? state.filter(v => v !== val) : [...state, val]);

  const filtered = useMemo(() => {
    let result = orgs.filter(o => {
      if (search && !o.name.toLowerCase().includes(search.toLowerCase()) &&
          !o.category.toLowerCase().includes(search.toLowerCase())) return false;
      if (tierFilter.length && !tierFilter.includes(o.composite_tier)) return false;
      if (trajFilter.length && !trajFilter.includes(o.trajectory)) return false;
      const score = parseFloat(o.composite_score);
      if (score < scoreMin || score > scoreMax) return false;
      return true;
    });
    return [...result].sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orgs, search, tierFilter, trajFilter, sortBy, sortDir, scoreMin, scoreMax]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) =>
    sortBy !== col
      ? <span style={{color:'rgba(212,206,196,0.2)'}}>↕</span>
      : <span style={{color:'var(--gold)'}}>{sortDir === 'asc' ? '↑' : '↓'}</span>;

  return (
    <div style={{minHeight:'100vh'}}>
      {/* Sticky header */}
      <div style={{borderBottom:'1px solid rgba(212,206,196,0.1)',padding:'3rem 0 2rem',background:'var(--ink)',position:'sticky',top:'60px',zIndex:50}}>
        <div className="container">
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
            <div>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.68rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)'}}>
                <Link href="/cultiness" style={{color:'var(--gold)'}}>The Cultiness Spectrum</Link>{' '}—{' '}
              </span>
              <h1 style={{fontFamily:'var(--serif)',fontSize:'clamp(1.6rem, 3vw, 2.4rem)',color:'var(--paper)',display:'inline',marginLeft:'0.5rem'}}>
                Dataset Explorer
              </h1>
            </div>
            <div style={{display:'flex',gap:'2rem',alignItems:'center'}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontFamily:'var(--serif)',fontSize:'1.6rem',fontWeight:700,color:'var(--gold)',lineHeight:1}}>{filtered.length}</div>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)'}}>Showing</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontFamily:'var(--serif)',fontSize:'1.6rem',fontWeight:700,color:'var(--paper)',lineHeight:1}}>{orgs.length}</div>
                <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)'}}>Total</div>
              </div>
              <Link href="/compass" style={{fontFamily:'var(--mono)',fontSize:'0.7rem',letterSpacing:'0.1em',textTransform:'uppercase',padding:'0.5rem 1rem',border:'1px solid rgba(200,168,75,0.4)',color:'var(--gold)',textDecoration:'none'}}>
                Political Compass →
              </Link>
            </div>
          </div>
          <div style={{marginTop:'1.5rem'}}>
            <input type="text" placeholder="Search organizations or categories..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{width:'100%',maxWidth:'480px',background:'rgba(244,240,232,0.04)',border:'1px solid rgba(212,206,196,0.2)',color:'var(--paper)',fontFamily:'var(--body)',fontSize:'0.9rem',padding:'0.65rem 1rem',outline:'none'}} />
          </div>
        </div>
      </div>

      <div className="container" style={{paddingTop:'2rem',paddingBottom:'4rem'}}>
        <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:'2rem',alignItems:'start'}}>

          {/* Sidebar filters */}
          <div style={{position:'sticky',top:'200px'}}>
            <div style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'1rem'}}>Filters</div>

            <div style={{marginBottom:'1.5rem'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.6rem'}}>Tier</div>
              {TIERS.map(t => (
                <label key={t} style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.35rem',cursor:'pointer'}}>
                  <input type="checkbox" checked={tierFilter.includes(t)} onChange={() => toggleFilter(t,tierFilter,setTierFilter)} style={{accentColor:TIER_COLORS[t]}} />
                  <span style={{fontSize:'0.78rem',color:tierFilter.includes(t)?'var(--paper)':'var(--muted)'}}>{t}</span>
                  <span style={{marginLeft:'auto',fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--muted)'}}>{orgs.filter(o=>o.composite_tier===t).length}</span>
                </label>
              ))}
            </div>

            <div style={{marginBottom:'1.5rem'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.6rem'}}>Trajectory</div>
              {TRAJECTORIES.map(t => (
                <label key={t} style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.35rem',cursor:'pointer'}}>
                  <input type="checkbox" checked={trajFilter.includes(t)} onChange={() => toggleFilter(t,trajFilter,setTrajFilter)} />
                  <span style={{fontSize:'0.78rem',color:trajFilter.includes(t)?'var(--paper)':'var(--muted)'}}>{t}</span>
                  <span style={{marginLeft:'auto',fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--muted)'}}>{orgs.filter(o=>o.trajectory===t).length}</span>
                </label>
              ))}
            </div>

            <div style={{marginBottom:'1.5rem'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.6rem'}}>
                Score: {scoreMin}%–{scoreMax}%
              </div>
              <input type="range" min="0" max="100" value={scoreMin} onChange={e=>setScoreMin(Math.min(Number(e.target.value),scoreMax-5))} style={{width:'100%',marginBottom:'0.4rem',accentColor:'var(--gold)'}} />
              <input type="range" min="0" max="100" value={scoreMax} onChange={e=>setScoreMax(Math.max(Number(e.target.value),scoreMin+5))} style={{width:'100%',accentColor:'var(--gold)'}} />
            </div>

            {(search||tierFilter.length||trajFilter.length||scoreMin>0||scoreMax<100) && (
              <button onClick={()=>{setSearch('');setTierFilter([]);setTrajFilter([]);setScoreMin(0);setScoreMax(100);}}
                style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.1em',textTransform:'uppercase',padding:'0.5rem 1rem',width:'100%',background:'transparent',border:'1px solid rgba(212,206,196,0.25)',color:'var(--muted)',cursor:'pointer'}}>
                Clear Filters
              </button>
            )}
          </div>

          {/* Main content */}
          <div>
            {/* Table */}
            <div style={{overflowX:'auto',marginBottom:selected?'2rem':0}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(212,206,196,0.2)'}}>
                    {[['name','Organization'],['category','Category'],['composite_tier','Tier'],['composite_score','Score'],['youngs_score',"Young's"],['trajectory','Trajectory']].map(([col,label])=>(
                      <th key={col} onClick={()=>handleSort(col)} style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',textAlign:'left',padding:'0.6rem 0.75rem',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}>
                        {label} <SortIcon col={col} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((org,i)=>(
                    <tr key={org.id} onClick={()=>loadDetail(org)}
                      style={{borderBottom:'1px solid rgba(212,206,196,0.07)',background:selected?.id===org.id?'rgba(200,168,75,0.06)':i%2===0?'transparent':'rgba(244,240,232,0.015)',cursor:'pointer'}}>
                      <td style={{padding:'0.65rem 0.75rem',color:'var(--paper)',fontSize:'0.88rem',fontFamily:'var(--serif)'}}>{org.name}</td>
                      <td style={{padding:'0.65rem 0.75rem',color:'var(--muted)',fontSize:'0.75rem',fontFamily:'var(--mono)',whiteSpace:'nowrap'}}>{org.category}</td>
                      <td style={{padding:'0.65rem 0.75rem'}}><TierBadge tier={org.composite_tier} small /></td>
                      <td style={{padding:'0.65rem 0.75rem',fontFamily:'var(--mono)',fontSize:'0.82rem',color:'var(--paper)',whiteSpace:'nowrap'}}>{parseFloat(org.composite_score).toFixed(1)}%</td>
                      <td style={{padding:'0.65rem 0.75rem',fontFamily:'var(--mono)',fontSize:'0.82rem',color:'var(--muted)'}}>{org.youngs_score}/10</td>
                      <td style={{padding:'0.65rem 0.75rem',fontFamily:'var(--mono)',fontSize:'0.72rem',color:'var(--muted)',whiteSpace:'nowrap'}}>{org.trajectory}</td>
                    </tr>
                  ))}
                  {filtered.length===0 && (
                    <tr><td colSpan={6} style={{padding:'3rem',textAlign:'center',color:'var(--muted)',fontFamily:'var(--mono)',fontSize:'0.8rem'}}>No organizations match current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Detail panel */}
            {selected && (
              <div style={{border:'1px solid rgba(200,168,75,0.25)',background:'rgba(244,240,232,0.02)',padding:'2rem',position:'relative'}}>
                <button onClick={()=>setSelected(null)} style={{position:'absolute',top:'1rem',right:'1rem',background:'transparent',border:'none',color:'var(--muted)',fontFamily:'var(--mono)',fontSize:'0.75rem',cursor:'pointer',letterSpacing:'0.1em'}}>
                  ✕ Close
                </button>

                {/* Header */}
                <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'1rem',alignItems:'start',marginBottom:'1.5rem'}}>
                  <div>
                    <h2 style={{fontFamily:'var(--serif)',fontSize:'clamp(1.2rem,2.5vw,1.8rem)',color:'var(--paper)',marginBottom:'0.4rem'}}>{selected.name}</h2>
                    <div style={{fontFamily:'var(--mono)',fontSize:'0.72rem',color:'var(--muted)',letterSpacing:'0.06em'}}>{selected.category} · {selected.trajectory} · {selected.anchor_type}</div>
                  </div>
                  <TierBadge tier={selected.composite_tier} />
                </div>

                {/* Score summary */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'rgba(212,206,196,0.1)',marginBottom:'2.5rem'}}>
                  {[
                    {label:'Composite Score', value:`${parseFloat(selected.composite_score).toFixed(1)}%`},
                    {label:"Young's Score",   value:`${selected.youngs_score}/10`},
                    {label:'Tier',            value:selected.composite_tier},
                  ].map((s,i)=>(
                    <div key={i} style={{background:'var(--ink)',padding:'1rem',textAlign:'center'}}>
                      <div style={{fontFamily:'var(--serif)',fontSize:'1.4rem',fontWeight:700,color:'var(--gold)',lineHeight:1,marginBottom:'0.3rem'}}>{s.value}</div>
                      <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)'}}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Criterion detail */}
                <div style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.75rem'}}>
                  Criterion Scores — click any row to expand
                </div>

                {loadingDetail ? (
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.75rem',color:'var(--muted)',padding:'1rem 0'}}>Loading criterion scores...</div>
                ) : criterionScores[selected.id] ? (
                  <div>
                    {CRITERIA.map(c => (
                      <CriterionRow
                        key={c}
                        code={c}
                        score={criterionScores[selected.id][c]?.score}
                        bodyText={criterionScores[selected.id][c]?.bodyText}
                      />
                    ))}
                    <div style={{marginTop:'1.5rem',padding:'0.9rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
                      <p style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'rgba(212,206,196,0.35)',margin:0,lineHeight:1.6}}>
                        Scores are calibration anchors from the V4.0 methodology. Analytical body text is populated as entries complete human review. N/A indicates the criterion is structurally inapplicable — not a low score.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
