'use client';
import { useState, useMemo } from 'react';

const TIER_COLORS = {
  'Super Culty': '#e8574d',
  'Kinda Culty': '#d99b3e',
  'Not Culty':   '#5cb878',
};
// Softer reader-facing labels for the DB tier enum (keys are unchanged).
const TIER_LABELS = { 'Super Culty':'High-Control','Kinda Culty':'Moderate-Control','Not Culty':'Low-Control' };
const lbl = (t) => TIER_LABELS[t] || t;

// Branch (chain) palette — a qualitative set chosen so co-occurring branches are
// always distinct (National Socialist red vs White-supremacist green no longer clash).
const CHAIN_COLORS = {
  'National Socialist lineage':           '#e15759', // red
  'Neo-Nazi media lineage':               '#d774b0', // magenta
  'Racist skinhead lineage':              '#6f8fb0', // slate blue
  'Alt-right identitarian lineage':       '#f28e2b', // orange
  'Christian Identity lineage':           '#edc948', // yellow
  'Creativity lineage':                   '#4cc0b0', // teal
  'Ku Klux Klan lineage':                 '#8d6fd1', // violet
  'White supremacist formations':         '#8cc152', // green
  'Religious-political-media formations': '#d76f8f', // rose
  'High-control religious formations':    '#9c755f', // brown
  'Surveillance infrastructure formation':'#4e79a7', // blue
};
const branchColor = (c) => CHAIN_COLORS[c] || 'rgba(212,206,196,0.5)';

// Left→right lane order for the hierarchical layout: National Socialist on the far
// left, the Alt-right / Patriot Front line on the far right.
const BRANCH_ORDER = [
  'National Socialist lineage',
  'Racist skinhead lineage',
  'Neo-Nazi media lineage',
  'Creativity lineage',
  'Christian Identity lineage',
  'Ku Klux Klan lineage',
  'White supremacist formations',
  'High-control religious formations',
  'Religious-political-media formations',
  'Surveillance infrastructure formation',
  'Alt-right identitarian lineage',
];

// Manual left→right order overrides for specific nodes within their lane/level
// (lower = further left). Everything else falls back to alphabetical by name.
const NODE_ORDER = {
  'national-socialist-liberation-front': 0,
  'national-alliance': 1,
  'oath-keepers': 0,
  'three-percenters': 1,
  'proud-boys': 2,
};
const orderKey = (s) => (s in NODE_ORDER ? NODE_ORDER[s] : 1e6);

const REL_LABELS = {
  ideological_heir:        'Ideological heir',
  tactical_evolution:      'Tactical evolution',
  media_pipeline:          'Media pipeline',
  institutional_successor: 'Institutional successor',
  founded_by:              'Founded by',
  documented_influence:    'Documented influence',
};

const NAZI = 'nsdap-nazi-party';
const KKK  = 'ku-klux-klan';

// View modes: each origin is the single root of a descendant tree; "other" is the
// forest of lineages that descend from neither origin.
const MODES = [
  { id: KKK,     label: 'Ku Klux Klan' },
  { id: NAZI,    label: 'Nazi Party (NSDAP)' },
  { id: 'other', label: 'Other lineages' },
];

// Vertical cascade: depth flows top→bottom, siblings spread left→right and are
// centered within each level. H_GAP separates siblings; V_GAP separates levels.
const NODE_W = 150, NODE_H = 48, H_GAP = 16, V_GAP = 54, PAD = 12;
const safe = (s) => s.replace(/[^a-z0-9]/gi, '');

export default function LineageClient({ nodes = [], edges = [] }) {
  const [mode, setMode] = useState(NAZI);
  const [hover, setHover] = useState(null);          // hovered node slug
  const [branchHL, setBranchHL] = useState(null);    // highlighted branch (chain)

  const nodeBySlug = useMemo(() => {
    const m = {}; nodes.forEach(n => { m[n.slug] = n; }); return m;
  }, [nodes]);

  const outBySource = useMemo(() => {
    const m = {}; edges.forEach(e => { (m[e.source_slug] = m[e.source_slug] || []).push(e); }); return m;
  }, [edges]);

  // Descendant reach (BFS) of each origin — used both for its own tree and to
  // exclude those edges from the "other" forest.
  const reachOf = useMemo(() => {
    const bfs = (root) => {
      const r = new Set([root]); const q = [root];
      while (q.length) {
        const s = q.shift();
        (outBySource[s] || []).forEach(e => { if (!r.has(e.target_slug)) { r.add(e.target_slug); q.push(e.target_slug); } });
      }
      return r;
    };
    return { [NAZI]: bfs(NAZI), [KKK]: bfs(KKK) };
  }, [outBySource]);

  // Edge set + root for the selected mode.
  const { subEdges, rootSlug, nodeCount } = useMemo(() => {
    if (mode === 'other') {
      const sub = edges.filter(e => {
        const inNazi = reachOf[NAZI].has(e.source_slug) && reachOf[NAZI].has(e.target_slug);
        const inKkk  = reachOf[KKK].has(e.source_slug)  && reachOf[KKK].has(e.target_slug);
        return !inNazi && !inKkk;
      });
      const slugs = new Set(); sub.forEach(e => { slugs.add(e.source_slug); slugs.add(e.target_slug); });
      return { subEdges: sub, rootSlug: null, nodeCount: slugs.size };
    }
    const reach = reachOf[mode];
    const sub = edges.filter(e => reach.has(e.source_slug) && reach.has(e.target_slug));
    return { subEdges: sub, rootSlug: mode, nodeCount: reach.size };
  }, [mode, edges, reachOf]);

  // Longest-path layering into top→bottom levels; cluster by branch within each
  // level and centre the level horizontally so it reads as a cascade.
  const { pos, width, height, branchOf } = useMemo(() => {
    const slugs = new Set(); if (rootSlug) slugs.add(rootSlug);
    subEdges.forEach(e => { slugs.add(e.source_slug); slugs.add(e.target_slug); });

    const layer = {}; slugs.forEach(s => { layer[s] = 0; });
    for (let it = 0; it < slugs.size; it++) {
      let changed = false;
      subEdges.forEach(e => {
        const nl = layer[e.source_slug] + 1;
        if (nl > layer[e.target_slug]) { layer[e.target_slug] = nl; changed = true; }
      });
      if (!changed) break;
    }

    const branchOf = {};
    subEdges.forEach(e => { if (branchOf[e.target_slug] == null) branchOf[e.target_slug] = e.chain_name; });
    // Source-only nodes (chain roots in "Other" mode) take the branch they feed into.
    subEdges.forEach(e => { if (branchOf[e.source_slug] == null) branchOf[e.source_slug] = e.chain_name; });

    const nameKey = (s) => (nodeBySlug[s]?.name || s);

    const rows = {};
    [...slugs].forEach(s => { (rows[layer[s]] = rows[layer[s]] || []).push(s); });
    const layerNums = Object.keys(rows).map(Number).sort((a, b) => a - b);
    const maxLayer = layerNums.length ? layerNums[layerNums.length - 1] : 0;

    // Swimlanes: each branch gets a fixed horizontal lane (BRANCH_ORDER, left→right),
    // sized to the most nodes it holds in any one level. Each lineage flows straight
    // down its lane — a traditional hierarchy, not a centered tree.
    const branchesPresent = [...new Set(Object.values(branchOf))].filter(Boolean);
    const laneBranches = [
      ...BRANCH_ORDER.filter(b => branchesPresent.includes(b)),
      ...branchesPresent.filter(b => !BRANCH_ORDER.includes(b)),
    ];
    const laneWidth = {};
    laneBranches.forEach(b => { laneWidth[b] = 1; });
    layerNums.forEach(L => {
      const cnt = {};
      rows[L].forEach(s => { if (s === rootSlug) return; const b = branchOf[s]; if (b) cnt[b] = (cnt[b] || 0) + 1; });
      Object.entries(cnt).forEach(([b, c]) => { if (c > laneWidth[b]) laneWidth[b] = c; });
    });
    const laneStart = {}; let acc = 0;
    laneBranches.forEach(b => { laneStart[b] = acc; acc += laneWidth[b]; });
    const totalCols = Math.max(acc, 1);
    const totalW = totalCols * NODE_W + (totalCols - 1) * H_GAP;

    const pos = {};
    layerNums.forEach(L => {
      const byBranch = {};
      rows[L].forEach(s => {
        if (s === rootSlug) return;
        const b = branchOf[s];
        (byBranch[b] = byBranch[b] || []).push(s);
      });
      Object.entries(byBranch).forEach(([b, arr]) => {
        arr.sort((a, c) => {
          const oa = orderKey(a), oc = orderKey(c);
          return oa !== oc ? oa - oc : nameKey(a).localeCompare(nameKey(c));
        });
        arr.forEach((s, i) => {
          const col = laneStart[b] + i;
          pos[s] = { x: PAD + col * (NODE_W + H_GAP), y: PAD + L * (NODE_H + V_GAP) };
        });
      });
    });

    // Root centred across all lanes at its level.
    if (rootSlug && layer[rootSlug] != null) {
      pos[rootSlug] = { x: PAD + (totalW - NODE_W) / 2, y: PAD + layer[rootSlug] * (NODE_H + V_GAP) };
    }

    const width = PAD * 2 + totalW;
    const height = PAD * 2 + (maxLayer + 1) * NODE_H + maxLayer * V_GAP;
    return { pos, width, height, branchOf };
  }, [subEdges, rootSlug, nodeBySlug]);

  const branches = useMemo(() => {
    const m = {};
    subEdges.forEach(e => { const c = e.chain_name || 'Other formations'; m[c] = (m[c] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [subEdges]);

  const arrow = (x1, y1, x2, y2) => { const my = (y1 + y2) / 2; return `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`; };

  const dimEdge = (e) =>
    (branchHL && e.chain_name !== branchHL) ||
    (hover && hover !== e.source_slug && hover !== e.target_slug);
  const dimNode = (slug) =>
    (branchHL && slug !== rootSlug && branchOf[slug] !== branchHL) ||
    (hover && hover !== slug);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="container--wide" style={{ paddingTop: '1.25rem', paddingBottom: '3rem' }}>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginRight: '0.4rem' }}>
            Origin
          </span>
          {MODES.map(m => {
            const active = m.id === mode;
            return (
              <button key={m.id} onClick={() => { setMode(m.id); setHover(null); setBranchHL(null); }}
                style={{
                  fontFamily: 'var(--mono)', fontSize: '0.66rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                  cursor: 'pointer', padding: '0.4rem 0.8rem',
                  border: `1px solid ${active ? 'rgba(200,168,75,0.55)' : 'rgba(212,206,196,0.22)'}`,
                  color: active ? 'var(--gold)' : 'var(--muted)',
                  background: active ? 'rgba(200,168,75,0.08)' : 'transparent',
                }}>
                {m.label}
              </button>
            );
          })}
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)', marginLeft: '0.4rem' }}>
            {nodeCount} orgs · {subEdges.length} links · {branches.length} branches
          </span>
        </div>

        {/* How to read it */}
        <p style={{ fontSize: '0.82rem', color: 'rgba(212,206,196,0.72)', lineHeight: 1.6, maxWidth: '52rem', marginBottom: '1.25rem' }}>
          {mode === 'other'
            ? 'Lineages that descend from neither the Nazi Party nor the Ku Klux Klan — shown as a forest of their own roots.'
            : 'Every organization with a documented line of descent from the selected origin, combined into a single tree.'}{' '}
          Traced top → bottom through formation and ideological inheritance. Each <strong>branch</strong> (a named lineage)
          has its own color; arrows show direction of influence. Hover a branch in the key to isolate it, or a card to
          trace its links. Click any card for its full assessment. Branches converge where later groups draw on more than one line.
        </p>

        {/* Branch key (interactive) + tier key */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', alignItems: 'center' }}
            onMouseLeave={() => setBranchHL(null)}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Branches</span>
            {branches.map(([c, n]) => (
              <button key={c} onMouseEnter={() => setBranchHL(c)} onFocus={() => setBranchHL(c)}
                onClick={() => setBranchHL(branchHL === c ? null : c)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer',
                  background: 'transparent', border: 'none', padding: '0.1rem 0',
                  opacity: branchHL && branchHL !== c ? 0.4 : 1,
                }}>
                <span style={{ width: 16, height: 3, background: branchColor(c), display: 'inline-block', borderRadius: 2 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'rgba(212,206,196,0.85)' }}>{c} · {n}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Tiers</span>
            {Object.entries(TIER_COLORS).map(([tier, c]) => (
              <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: c }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'rgba(212,206,196,0.6)' }}>{lbl(tier)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Diagram — scales to page width; depth grows downward (vertical scroll) */}
        <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <svg viewBox={`0 0 ${width} ${height}`} width="100%"
            style={{ display: 'block', maxWidth: width, height: 'auto', margin: '0 auto' }}>
            <defs>
              {branches.map(([c]) => (
                <marker key={c} id={`lin-arrow-${safe(c)}`} viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill={branchColor(c)} />
                </marker>
              ))}
            </defs>

            {/* Edges (top of source → bottom of target) */}
            {subEdges.map((e, i) => {
              const s = pos[e.source_slug], t = pos[e.target_slug];
              if (!s || !t) return null;
              const x1 = s.x + NODE_W / 2, y1 = s.y + NODE_H;
              const x2 = t.x + NODE_W / 2, y2 = t.y - 1;
              return (
                <path key={i} d={arrow(x1, y1, x2, y2)} fill="none" stroke={branchColor(e.chain_name)}
                  strokeWidth={1.6} markerEnd={`url(#lin-arrow-${safe(e.chain_name || 'Other formations')})`}
                  opacity={dimEdge(e) ? 0.08 : 0.72} />
              );
            })}

            {/* Nodes */}
            {Object.entries(pos).map(([slug, p]) => {
              const n = nodeBySlug[slug];
              const name = n?.name || slug;
              const isRoot = slug === rootSlug;
              const tierColor = TIER_COLORS[n?.composite_tier] || '#888';
              const bColor = isRoot ? 'var(--gold)' : branchColor(branchOf[slug]);
              const hasScore = n && n.composite_score != null && !Number.isNaN(parseFloat(n.composite_score));
              const score = hasScore ? parseFloat(n.composite_score) : null;
              const tierText = n?.composite_tier || (n ? 'Unscored' : '—');
              const label = name.length > 20 ? name.slice(0, 19) + '…' : name;
              return (
                <a key={slug} href={`/org/${slug}`}
                  onMouseEnter={() => setHover(slug)} onMouseLeave={() => setHover(null)}
                  style={{ cursor: 'pointer' }}>
                  <g opacity={dimNode(slug) ? 0.25 : 1}>
                    <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx={4}
                      fill="rgba(28,24,20,0.92)" stroke={isRoot ? 'var(--gold)' : tierColor}
                      strokeWidth={isRoot || hover === slug ? 2 : 1.2} />
                    <rect x={p.x} y={p.y} width={5} height={NODE_H} rx={2} fill={bColor} />
                    <text x={p.x + 13} y={p.y + 19} fontFamily="var(--serif)" fontSize={12.5} fill="var(--paper)" fontWeight={700}>{label}</text>
                    <text x={p.x + 13} y={p.y + 36} fontFamily="var(--mono)" fontSize={9.5} fill={isRoot ? 'var(--gold)' : tierColor} fontWeight={600}>
                      {isRoot ? 'ORIGIN' : lbl(tierText)}{!isRoot && hasScore ? ` · ${score.toFixed(0)}%` : ''}
                    </text>
                  </g>
                </a>
              );
            })}

            {/* Relationship labels — only for the hovered node's edges */}
            {hover && subEdges.map((e, i) => {
              if (e.source_slug !== hover && e.target_slug !== hover) return null;
              const s = pos[e.source_slug], t = pos[e.target_slug];
              if (!s || !t || !REL_LABELS[e.relationship_type]) return null;
              const x1 = s.x + NODE_W / 2, y1 = s.y + NODE_H;
              const x2 = t.x + NODE_W / 2, y2 = t.y;
              const lx = (x1 + x2) / 2;
              const ly = (y1 + y2) / 2 + 3;
              return (
                <text key={`l${i}`} x={lx} y={ly} textAnchor="middle" fontFamily="var(--mono)" fontSize={10}
                  fill="rgba(235,231,223,0.95)"
                  style={{ paintOrder: 'stroke', stroke: 'rgba(18,14,10,0.95)', strokeWidth: 4, strokeLinejoin: 'round', pointerEvents: 'none' }}>
                  {REL_LABELS[e.relationship_type]}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
