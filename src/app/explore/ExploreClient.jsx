'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

const TIER_COLORS = {
  'Cult': '#6b1010', 'Cult Dynamics': '#8b2020', 'High Control': '#7a4a1a',
  'Concerning': '#7a6a2a', 'Mildly Culty': '#4a6a2a', 'Healthy Group': '#2a6b4a',
};
const TIERS = ['Cult','Cult Dynamics','High Control','Concerning','Mildly Culty','Healthy Group'];
const TRAJECTORIES = ['Stable','Escalating','Declining','Defunct'];
const CRITERIA = ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'];
const CRITERIA_DETAIL = {
  C1:  { name:'Charismatic Leadership',       desc:'Has a defined, charismatic leader — or a central authoritative idea — treated as extraordinary, directives taken as truth, dissenters discredited.' },
  C2:  { name:'Sacred Assumptions',           desc:'Requires shared beliefs maintained against counter-evidence, mantras repeated, alternatives dismissed. Includes self-sealing loops that prevent falsification.' },
  C3:  { name:'Transcendent Mission',         desc:'Pursues a mission so big it justifies sacrifice — framing that extracts sacrifice, treats doubts as betrayal, overrides individual judgment.' },
  C4:  { name:'Sublimation of Individuality', desc:'Demands continual sublimation of individuality — identity demands, lifestyle conformity, rest-as-weakness, reputational double binds.' },
  C5:  { name:'Isolation',                    desc:'Limits access to outsiders — information environment narrows, outside perspectives dismissed. Includes ecosystem isolation and algorithmic epistemic dependency.' },
  C6:  { name:'Private Vernacular',           desc:'Creates private vocabulary that marks membership, encodes a worldview inaccessible from outside, and terminates inquiry rather than enabling it.' },
  C7:  { name:'Us-Versus-Them',               desc:'Programs us-vs-them mentality — enlightened-vs-outsiders framing, defectors-as-broken, disagreement-as-bigotry. Includes institutionalized population targeting.' },
  C8:  { name:'Exploitation of Labor',        desc:'Exploits members\' labor — sacrifice extracted as virtue, labor monetized. Financial extraction through doctrinal framing scores equivalently to physical labor capture.' },
  C9:  { name:'High Exit Costs',              desc:'Departure produces social, economic, or identity costs; exit framed as betrayal. Spiritual absolutism and classified knowledge create extreme exit cost profiles.' },
  C10: { name:'Ends Justify the Means',       desc:'Institutional harm tolerated in pursuit of mission, cover-ups occur, perpetrators protected. Multi-generation non-correcting patterns score at the ceiling.' },
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
      <div onClick={() => setExpanded(e => !e)} style={{display:'grid',gridTemplateColumns:'2rem 1fr auto',gap:'0.75rem',alignItems:'center',padding:'0.7rem 0',cursor:'pointer'}}>
        <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'var(--gold)',letterSpacing:'0.05em'}}>{code}</span>
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
        <span style={{fontFamily:'var(--mono)',fontSize:'0.65rem',color:'rgba(212,206,196,0.35)',userSelect:'none'}}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{padding:'0 0 1rem 2.75rem'}}>
          <p style={{fontSize:'0.8rem',color:'rgba(212,206,196,0.5)',fontStyle:'italic',lineHeight:1.6,marginBottom:bodyText?'0.75rem':0}}>{detail.desc}</p>
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
  const [filtersOpen, setFiltersOpen] = useState(false);
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
    fetch(`${SUPABASE_URL}/rest/v1/criterion_scores?org_id=eq.${org.id}&select=criterion,score,body_text&order=criterion`, {
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

  const hasActiveFilters = search || tierFilter.length || trajFilter.length || scoreMin > 0 || scoreMax < 100;

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

  const FiltersInner = () => (
    <>
      {/* Tier */}
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

      {/* Trajectory */}
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

      {/* Score range */}
      <div style={{marginBottom:'1.5rem'}}>
        <div style={{fontFamily:'var(--mono)',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.6rem'}}>
          Score: {scoreMin}%–{scoreMax}%
        </div>
        <input type="range" min="0" max="100" value={scoreMin} onChange={e=>setScoreMin(Math.min(Number(e.target.value),scoreMax-5))} style={{width:'100%',marginBottom:'0.4rem',accentColor:'var(--gold)'}} />
        <input type="range" min="0" max="100" value={scoreMax} onChange={e=>setScoreMax(Math.max(Number(e.target.value),scoreMin+5))} style={{width:'100%',accentColor:'var(--gold)'}} />
      </div>

      {hasActiveFilters && (
        <button onClick={()=>{setSearch('');setTierFilter([]);setTrajFilter([]);setScoreMin(0);setScoreMax(100);}}
          style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.1em',textTransform:'uppercase',padding:'0.5rem 1rem',width:'100%',background:'transparent',border:'1px solid rgba(212,206,196,0.25)',color:'var(--muted)',cursor:'pointer'}}>
          Clear Filters
        </button>
      )}
    </>
  );

  return (
    <div style={{minHeight:'100vh'}}>

      {/* Sticky header */}
      <div style={{borderBottom:'1px solid rgba(212,206,196,0.1)',padding:'2rem 0 1.5rem',background:'var(--ink)',position:'sticky',top:'60px',zIndex:50}}>
        <div className="container">
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
              onChange={e => setSearch(e.target.value)}
              style={{width:'100%',maxWidth:'480px',background:'rgba(244,240,232,0.04)',border:'1px solid rgba(212,206,196,0.2)',color:'var(--paper)',fontFamily:'var(--body)',fontSize:'0.9rem',padding:'0.6rem 1rem',outline:'none'}} />
          </div>
        </div>
      </div>

      <div className="container" style={{paddingTop:'2rem',paddingBottom:'4rem'}}>
        <div className="explore-layout">

          {/* Sidebar — desktop: sticky column, mobile: collapsible drawer */}
          <div className="explore-sidebar">
            {/* Mobile toggle */}
            <button className="explore-filter-toggle" onClick={() => setFiltersOpen(o => !o)}>
              <span>Filters {hasActiveFilters ? `(${tierFilter.length + trajFilter.length + (search?1:0)} active)` : ''}</span>
              <span>{filtersOpen ? '▲' : '▼'}</span>
            </button>
            <div className={`explore-sidebar-inner${filtersOpen ? ' open' : ''}`}>
              <div style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'1rem'}}>Filters</div>
              <FiltersInner />
            </div>
          </div>

          {/* Main content */}
          <div>
            {/* Scrollable table */}
            <div style={{overflowX:'auto',overflowY:'auto',maxHeight:'480px',marginBottom:'2rem',border:'1px solid rgba(212,206,196,0.1)'}}>
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:'500px'}}>
                <thead style={{position:'sticky',top:0,background:'var(--ink)',zIndex:1}}>
                  <tr style={{borderBottom:'1px solid rgba(212,206,196,0.2)'}}>
                    <th onClick={()=>handleSort('name')} style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',textAlign:'left',padding:'0.6rem 0.75rem',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}>
                      Organization <SortIcon col="name" />
                    </th>

                    <th onClick={()=>handleSort('composite_score')} style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',textAlign:'left',padding:'0.6rem 0.75rem',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}>
                      Score <SortIcon col="composite_score" />
                    </th>
                    <th onClick={()=>handleSort('youngs_score')} className="explore-table-hide-mobile" style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',textAlign:'left',padding:'0.6rem 0.75rem',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}>
                      Young's <SortIcon col="youngs_score" />
                    </th>
                    <th onClick={()=>handleSort('category')} className="explore-table-hide-mobile" style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',textAlign:'left',padding:'0.6rem 0.75rem',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}>
                      Category <SortIcon col="category" />
                    </th>
                    <th onClick={()=>handleSort('trajectory')} className="explore-table-hide-mobile" style={{fontFamily:'var(--mono)',fontSize:'0.65rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--muted)',textAlign:'left',padding:'0.6rem 0.75rem',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}>
                      Trajectory <SortIcon col="trajectory" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((org,i) => (
                    <tr key={org.id} onClick={()=>loadDetail(org)}
                      style={{borderBottom:'1px solid rgba(212,206,196,0.07)',borderLeft:`3px solid ${TIER_COLORS[org.composite_tier]||'transparent'}`,background:selected?.id===org.id?'rgba(200,168,75,0.06)':i%2===0?'transparent':'rgba(244,240,232,0.015)',cursor:'pointer'}}>
                      <td style={{padding:'0.65rem 0.75rem',color:'var(--paper)',fontSize:'0.88rem',fontFamily:'var(--serif)'}}>{org.name}</td>

                      <td style={{padding:'0.65rem 0.75rem',fontFamily:'var(--mono)',fontSize:'0.82rem',color:'var(--paper)',whiteSpace:'nowrap'}}>{parseFloat(org.composite_score).toFixed(1)}%</td>
                      <td className="explore-table-hide-mobile" style={{padding:'0.65rem 0.75rem',fontFamily:'var(--mono)',fontSize:'0.82rem',color:'var(--muted)'}}>{org.youngs_score}/10</td>
                      <td className="explore-table-hide-mobile" style={{padding:'0.65rem 0.75rem',color:'var(--muted)',fontSize:'0.75rem',fontFamily:'var(--mono)',whiteSpace:'nowrap'}}>{org.category}</td>
                      <td className="explore-table-hide-mobile" style={{padding:'0.65rem 0.75rem',fontFamily:'var(--mono)',fontSize:'0.72rem',color:'var(--muted)',whiteSpace:'nowrap'}}>{org.trajectory}</td>
                    </tr>
                  ))}
                  {filtered.length===0 && (
                    <tr><td colSpan={5} style={{padding:'3rem',textAlign:'center',color:'var(--muted)',fontFamily:'var(--mono)',fontSize:'0.8rem'}}>No organizations match current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Detail panel */}
            {selected && (
              <div style={{border:'1px solid rgba(200,168,75,0.25)',background:'rgba(244,240,232,0.02)',padding:'1.5rem',position:'relative'}}>
                <button onClick={()=>setSelected(null)} style={{position:'absolute',top:'1rem',right:'1rem',background:'transparent',border:'none',color:'var(--muted)',fontFamily:'var(--mono)',fontSize:'0.75rem',cursor:'pointer',letterSpacing:'0.1em'}}>
                  ✕
                </button>

                <div style={{marginBottom:'1.25rem',paddingRight:'2rem'}}>
                  <h2 style={{fontFamily:'var(--serif)',fontSize:'clamp(1.1rem,2.5vw,1.6rem)',color:'var(--paper)',marginBottom:'0.4rem'}}>{selected.name}</h2>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.7rem',color:'var(--muted)',letterSpacing:'0.06em',marginBottom:'0.6rem'}}>{selected.category} · {selected.trajectory}</div>
                  <div style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
                    <div style={{width:'10px',height:'10px',borderRadius:'50%',background:TIER_COLORS[selected.composite_tier]||'#555',flexShrink:0}} />
                    <span style={{fontFamily:'var(--mono)',fontSize:'0.68rem',letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--paper)'}}>{selected.composite_tier}</span>
                  </div>
                </div>

                {/* Score summary */}
                <div className="explore-score-grid" style={{gap:'1px',background:'rgba(212,206,196,0.1)',marginBottom:'2rem'}}>
                  {[
                    {label:'Composite',  value:`${parseFloat(selected.composite_score).toFixed(1)}%`},
                    {label:"Young's",    value:`${selected.youngs_score}/10`},
                    {label:'Scope',      value:selected.membership_scope||'Active'},
                  ].map((s,i) => (
                    <div key={i} style={{background:'var(--ink)',padding:'0.85rem',textAlign:'center'}}>
                      <div style={{fontFamily:'var(--serif)',fontSize:'1.25rem',fontWeight:700,color:'var(--gold)',lineHeight:1,marginBottom:'0.25rem'}}>{s.value}</div>
                      <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)'}}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {selected.summary_text && (
                  <div style={{marginBottom:'1.75rem',padding:'1rem',background:'rgba(244,240,232,0.03)',border:'1px solid rgba(212,206,196,0.1)'}}>
                    <div style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.5rem'}}>Summary</div>
                    <p style={{fontSize:'0.85rem',color:'var(--muted)',lineHeight:1.7,margin:0}}>{selected.summary_text}</p>
                  </div>
                )}
                <div style={{fontFamily:'var(--mono)',fontSize:'0.63rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.6rem'}}>
                  Criterion Scores — tap to expand
                </div>

                {loadingDetail ? (
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.75rem',color:'var(--muted)',padding:'1rem 0'}}>Loading...</div>
                ) : criterionScores[selected.id] ? (
                  <div>
                    {CRITERIA.map(c => (
                      <CriterionRow key={c} code={c} score={criterionScores[selected.id][c]?.score} bodyText={criterionScores[selected.id][c]?.bodyText} />
                    ))}
                    <div style={{marginTop:'1.25rem',padding:'0.75rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)'}}>
                      <p style={{fontFamily:'var(--mono)',fontSize:'0.63rem',color:'rgba(212,206,196,0.35)',margin:0,lineHeight:1.6}}>
                        N/A indicates the criterion is structurally inapplicable — not a low score. Analytical notes populate as entries complete human review.
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
