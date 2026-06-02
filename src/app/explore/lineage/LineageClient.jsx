'use client';
import { useState } from 'react';
import Link from 'next/link';

// Etiological chain data — documented formation lineages from methodology files
const CHAINS = [
  {
    id: 'white-supremacist',
    label: 'White Supremacist Formation Pipeline',
    color: '#8b1c1c',
    nodes: [
      { id:'kn', name:'Know-Nothings', years:'1844–1860', score:71, tier:'Cult Dynamics', x:0, y:0 },
      { id:'kkk1', name:'Ku Klux Klan (1st)', years:'1865–1871', score:87, tier:'Cult', x:1, y:0 },
      { id:'bl', name:'Black Legion', years:'1925–1940', score:81, tier:'Cult Dynamics', x:2, y:0 },
      { id:'kkk2', name:'KKK (Revival)', years:'1915–present', score:87, tier:'Cult', x:2, y:1 },
      { id:'jbs', name:'John Birch Society', years:'1958–present', score:62, tier:'High Control', x:3, y:0 },
      { id:'pf', name:'Patriot Front', years:'2017–present', score:89, tier:'Cult', x:4, y:0 },
      { id:'3p', name:'Three Percenters', years:'2008–present', score:76, tier:'Cult Dynamics', x:4, y:1 },
      { id:'ok', name:'Oath Keepers', years:'2009–present', score:74, tier:'Cult Dynamics', x:4, y:2 },
    ],
    edges: [
      ['kn','kkk1'],['kkk1','bl'],['kkk1','kkk2'],['bl','jbs'],['kkk2','jbs'],
      ['jbs','pf'],['jbs','3p'],['jbs','ok'],
    ],
  },
  {
    id: 'media-pipeline',
    label: 'Conservative Media Formation Pipeline',
    color: '#6b3a1c',
    nodes: [
      { id:'cou', name:'Coughlinism', years:'1926–1942', score:68, tier:'High Control', x:0, y:0 },
      { id:'ctr', name:'Conservative Talk Radio', years:'1988–present', score:58, tier:'High Control', x:1, y:0 },
      { id:'fox', name:'Fox News', years:'1996–present', score:67, tier:'High Control', x:2, y:0 },
      { id:'dw', name:'Daily Wire', years:'2015–present', score:59, tier:'High Control', x:3, y:0 },
      { id:'maga', name:'MAGA', years:'2015–present', score:84, tier:'Cult Dynamics', x:4, y:0 },
    ],
    edges: [['cou','ctr'],['ctr','fox'],['fox','dw'],['fox','maga'],['dw','maga']],
  },
  {
    id: 'high-control-religious',
    label: 'High-Control Religious Formation Pipeline',
    color: '#6b4a1c',
    nodes: [
      { id:'woff', name:'Word of Faith Fellowship', years:'1979–present', score:93, tier:'Cult', x:0, y:0 },
      { id:'tti', name:'Troubled Teen Industry', years:'1960s–present', score:91, tier:'Cult', x:1, y:0 },
      { id:'ct', name:'Conversion Therapy Network', years:'1970s–present', score:82, tier:'Cult Dynamics', x:2, y:0 },
      { id:'cn', name:'Christian Nationalism Pipeline', years:'1980s–present', score:76, tier:'Cult Dynamics', x:3, y:0 },
    ],
    edges: [['woff','tti'],['tti','ct'],['ct','cn'],['woff','cn']],
  },
  {
    id: 'surveillance',
    label: 'Surveillance Infrastructure Formation (V4.0)',
    color: '#1c3a6b',
    nodes: [
      { id:'ic', name:'Post-9/11 Intelligence Community', years:'2001–present', score:72, tier:'Cult Dynamics', x:0, y:0 },
      { id:'pal', name:'Palantir Technologies', years:'2003–present', score:85, tier:'Cult', x:1, y:0 },
      { id:'doge', name:'DOGE-Era Gov AI Integration', years:'2025–present', score:82, tier:'Cult Dynamics', x:2, y:0 },
      { id:'pop', name:'Population-Scale Algorithmic Control', years:'2020s–present', score:88, tier:'Cult', x:3, y:0 },
    ],
    edges: [['ic','pal'],['pal','doge'],['pal','pop'],['doge','pop']],
  },
];

const TIER_COLORS = { 'Cult':'#c02020','Cult Dynamics':'#c04040','High Control':'#b07030','Concerning':'#a09040','Mildly Culty':'#6a9840','Healthy Group':'#30a060' };

const NODE_W = 110, NODE_H = 52, COL_W = 150, ROW_H = 80, PAD = 28;

function ChainViz({ chain, selected, onSelect }) {
  const maxX = Math.max(...chain.nodes.map(n=>n.x));
  const maxY = Math.max(...chain.nodes.map(n=>n.y));
  const W = PAD*2 + (maxX+1)*COL_W;
  const H = PAD*2 + (maxY+1)*ROW_H + 20;

  const nodePos = (n) => ({
    cx: PAD + n.x*COL_W + NODE_W/2,
    cy: PAD + n.y*ROW_H + NODE_H/2,
    x: PAD + n.x*COL_W,
    y: PAD + n.y*ROW_H,
  });

  return (
    <div style={{marginBottom:'2.5rem'}}>
      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <div style={{width:12,height:12,background:chain.color,borderRadius:2}}/>
        <div style={{fontFamily:'var(--serif)',fontSize:'1rem',fontWeight:700,color:'var(--paper)'}}>{chain.label}</div>
      </div>
      <div style={{overflowX:'auto'}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',minWidth:W,maxWidth:W,display:'block'}}>
          {/* Edges */}
          {chain.edges.map(([fromId,toId],i) => {
            const from = chain.nodes.find(n=>n.id===fromId);
            const to = chain.nodes.find(n=>n.id===toId);
            if (!from||!to) return null;
            const fp = nodePos(from), tp = nodePos(to);
            const x1 = fp.x+NODE_W, y1 = fp.cy;
            const x2 = tp.x, y2 = tp.cy;
            const mx = (x1+x2)/2;
            return (
              <g key={i}>
                <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                  fill="none" stroke={`rgba(${hexRgb(chain.color)},0.4)`} strokeWidth="1.5"
                  markerEnd="url(#arr)"/>
              </g>
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="rgba(212,206,196,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
          </defs>

          {/* Nodes */}
          {chain.nodes.map(node => {
            const {x,y,cx,cy} = nodePos(node);
            const tc = TIER_COLORS[node.tier]||'#888';
            const isSel = selected?.id===node.id&&selected?.chainId===chain.id;
            return (
              <g key={node.id} style={{cursor:'pointer'}}
                onClick={()=>onSelect(isSel?null:{...node,chainId:chain.id})}>
                {isSel&&<rect x={x-3} y={y-3} width={NODE_W+6} height={NODE_H+6} rx={5}
                  fill="none" stroke="rgba(200,168,75,0.7)" strokeWidth="1.5"/>}
                <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={4}
                  fill={`rgba(${hexRgb(tc)},${isSel?0.2:0.1})`}
                  stroke={`rgba(${hexRgb(tc)},${isSel?0.9:0.4})`} strokeWidth={isSel?1.5:1}/>
                {/* Score bar */}
                <rect x={x+4} y={y+NODE_H-7} width={(NODE_W-8)*(node.score/100)} height={3} rx={1.5}
                  fill={`rgba(${hexRgb(tc)},0.7)`}/>
                <rect x={x+4} y={y+NODE_H-7} width={NODE_W-8} height={3} rx={1.5}
                  fill="none" stroke={`rgba(${hexRgb(tc)},0.25)`} strokeWidth="1"/>
                {/* Name */}
                <text x={cx} y={y+13} textAnchor="middle" fill="var(--paper)" fontSize={9.5} fontFamily="monospace" fontWeight="600">
                  {node.name.length>18?node.name.slice(0,16)+'…':node.name}
                </text>
                {/* Years */}
                <text x={cx} y={y+25} textAnchor="middle" fill="rgba(212,206,196,0.45)" fontSize={8} fontFamily="monospace">
                  {node.years}
                </text>
                {/* Score */}
                <text x={cx} y={y+36} textAnchor="middle" fill={tc} fontSize={9} fontFamily="monospace" fontWeight="700">
                  {node.score}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function hexRgb(hex) {
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r?`${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`:'128,128,128';
}

export default function LineageClient() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{minHeight:'100vh'}}>
      <div style={{borderBottom:'1px solid rgba(212,206,196,0.1)',padding:'2rem 0 1.5rem',background:'var(--ink)',position:'sticky',top:'60px',zIndex:50}}>
        <div className="container--wide">
          <div>
            <span style={{fontFamily:'var(--mono)',fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)'}}>
              <Link href="/explore" style={{color:'var(--gold)'}}>Explorer</Link> —
            </span>
            <h1 style={{fontFamily:'var(--serif)',fontSize:'clamp(1.3rem,3vw,2rem)',color:'var(--paper)',display:'inline',marginLeft:'0.4rem'}}>Etiological Chains</h1>
          </div>
          <p style={{fontFamily:'var(--mono)',fontSize:'0.68rem',color:'var(--muted)',marginTop:'0.6rem',lineHeight:1.6,maxWidth:700}}>
            Documented formation lineages — organizational genealogies where the later formation explicitly inherited institutional architecture, leadership networks, or ideological framework from the prior one. Node width reflects composite score. Click any node for detail.
          </p>
        </div>
      </div>

      <div className="container--wide" style={{paddingTop:'2rem',paddingBottom:'4rem'}}>
        {/* Score legend */}
        <div style={{display:'flex',gap:'1.5rem',marginBottom:'2rem',flexWrap:'wrap'}}>
          {Object.entries(TIER_COLORS).map(([t,c])=>(
            <div key={t} style={{display:'flex',alignItems:'center',gap:'5px'}}>
              <div style={{width:10,height:10,background:c,borderRadius:2}}/>
              <span style={{fontFamily:'var(--mono)',fontSize:'0.62rem',color:'var(--muted)'}}>{t}</span>
            </div>
          ))}
        </div>

        {CHAINS.map(chain=>(
          <ChainViz key={chain.id} chain={chain} selected={selected} onSelect={setSelected}/>
        ))}

        {/* Selected node detail */}
        {selected&&(
          <div style={{marginTop:'1rem',padding:'1.25rem',background:'rgba(244,240,232,0.03)',border:`1px solid rgba(${hexRgb(TIER_COLORS[selected.tier]||'#888')},0.3)`,maxWidth:480}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.75rem'}}>
              <div style={{fontFamily:'var(--serif)',fontSize:'1.05rem',fontWeight:700,color:'var(--paper)'}}>{selected.name}</div>
              <button onClick={()=>setSelected(null)} style={{background:'transparent',border:'none',color:'var(--muted)',cursor:'pointer',fontFamily:'var(--mono)',fontSize:'0.7rem'}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem'}}>
              {[['Years',selected.years],['Composite',`${selected.score}%`],['Tier',selected.tier]].map(([k,v])=>(
                <div key={k}>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.58rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.2rem'}}>{k}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'0.82rem',color:k==='Tier'?TIER_COLORS[v]:'var(--gold)'}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{marginTop:'2.5rem',padding:'1.1rem',background:'rgba(244,240,232,0.02)',border:'1px solid rgba(212,206,196,0.08)',maxWidth:700}}>
          <p style={{fontFamily:'var(--mono)',fontSize:'0.67rem',color:'rgba(212,206,196,0.4)',margin:0,lineHeight:1.7}}>
            Lineages reflect documented formation inheritance — leadership recruitment, organizational templates, funding networks, or explicit doctrinal adoption. Scores are composite cultiness percentages. The surveillance pipeline (V4.0) is a new analytical category introduced in the May 2026 methodology revision.
          </p>
        </div>
      </div>
    </div>
  );
}
