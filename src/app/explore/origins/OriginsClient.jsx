'use client';
import { useState, useMemo } from 'react';

const TIER_COLORS = {
  'Super Culty': '#e8574d',
  'Kinda Culty': '#d99b3e',
  'Not Culty':   '#5cb878',
};

// Branch (chain) palette — matches /explore/lineage so colors stay consistent.
const CHAIN_COLORS = {
  'National Socialist lineage':           '#b0413e',
  'Neo-Nazi media lineage':               '#a8688f',
  'Racist skinhead lineage':              '#6f8fb0',
  'Alt-right identitarian lineage':       '#cf7a3a',
  'Christian Identity lineage':           '#c9a13b',
  'Creativity lineage':                   '#5c9e8f',
  'Ku Klux Klan lineage':                 '#7a5cbf',
  'White supremacist formations':         '#e8574d',
  'Religious-political-media formations': '#d99b3e',
  'High-control religious formations':    '#e8703a',
  'Surveillance infrastructure formation':'#8f93e0',
};
const branchColor = (c) => CHAIN_COLORS[c] || 'rgba(212,206,196,0.5)';

const REL_LABELS = {
  ideological_heir:        'Ideological heir',
  tactical_evolution:      'Tactical evolution',
  media_pipeline:          'Media pipeline',
  institutional_successor: 'Institutional successor',
  founded_by:              'Founded by',
  documented_influence:    'Documented influence',
};

// The two origins this page traces. Each is the single root of a descendant tree.
const ROOTS = [
  { slug: 'nsdap-nazi-party', label: 'Nazi Party (NSDAP)' },
  { slug: 'ku-klux-klan',     label: 'Ku Klux Klan' },
];

const NODE_W = 176, NODE_H = 52, COL_GAP = 150, ROW_GAP = 22, PAD = 12;
const safe = (s) => s.replace(/[^a-z0-9]/gi, '');

export default function OriginsClient({ nodes = [], edges = [] }) {
  const [rootSlug, setRootSlug] = useState(ROOTS[0].slug);
  const [hover, setHover] = useState(null);          // hovered node slug
  const [branchHL, setBranchHL] = useState(null);    // highlighted branch (chain)

  const nodeBySlug = useMemo(() => {
    const m = {}; nodes.forEach(n => { m[n.slug] = n; }); return m;
  }, [nodes]);

  const outBySource = useMemo(() => {
    const m = {}; edges.forEach(e => { (m[e.source_slug] = m[e.source_slug] || []).push(e); }); return m;
  }, [edges]);

  // BFS the descendant subgraph from the selected origin.
  const { subEdges, reach } = useMemo(() => {
    const reach = new Set([rootSlug]);
    const queue = [rootSlug];
    while (queue.length) {
      const s = queue.shift();
      (outBySource[s] || []).forEach(e => {
        if (!reach.has(e.target_slug)) { reach.add(e.target_slug); queue.push(e.target_slug); }
      });
    }
    const subEdges = edges.filter(e => reach.has(e.source_slug) && reach.has(e.target_slug));
    return { subEdges, reach };
  }, [rootSlug, edges, outBySource]);

  // Longest-path layering into left→right columns; cluster nodes by branch within
  // each column so a branch reads as a contiguous band.
  const { pos, width, height, branchOf } = useMemo(() => {
    const slugs = new Set([rootSlug]);
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

    // A node's branch = the chain of its first incoming edge (root has none).
    const branchOf = {};
    subEdges.forEach(e => { if (branchOf[e.target_slug] == null) branchOf[e.target_slug] = e.chain_name; });

    const cols = {};
    [...slugs].forEach(s => { (cols[layer[s]] = cols[layer[s]] || []).push(s); });

    const pos = {};
    let maxRows = 0;
    const colNums = Object.keys(cols).map(Number);
    const maxCol = colNums.length ? Math.max(...colNums) : 0;
    Object.entries(cols).forEach(([col, arr]) => {
      arr.sort((a, b) => {
        const ba = branchOf[a] || '', bb = branchOf[b] || '';
        if (ba !== bb) return ba.localeCompare(bb);
        return (nodeBySlug[a]?.name || a).localeCompare(nodeBySlug[b]?.name || b);
      });
      arr.forEach((s, row) => {
        pos[s] = { x: PAD + Number(col) * (NODE_W + COL_GAP), y: PAD + row * (NODE_H + ROW_GAP) };
      });
      maxRows = Math.max(maxRows, arr.length);
    });

    const width = PAD * 2 + (maxCol + 1) * NODE_W + maxCol * COL_GAP;
    const height = PAD * 2 + maxRows * NODE_H + Math.max(0, maxRows - 1) * ROW_GAP;
    return { pos, width, height, branchOf };
  }, [subEdges, rootSlug, nodeBySlug]);

  // Branches present in this subgraph, with edge counts (for the legend).
  const branches = useMemo(() => {
    const m = {};
    subEdges.forEach(e => { const c = e.chain_name || 'Other formations'; m[c] = (m[c] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [subEdges]);

  const arrow = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2; return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`; };

  const dimEdge = (e) =>
    (branchHL && e.chain_name !== branchHL) ||
    (hover && hover !== e.source_slug && hover !== e.target_slug);
  const dimNode = (slug) =>
    (branchHL && slug !== rootSlug && branchOf[slug] !== branchHL) ||
    (hover && hover !== slug);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="container--wide" style={{ paddingTop: '1.25rem', paddingBottom: '3rem' }}>

        {/* Origin selector */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginRight: '0.4rem' }}>
            Origin
          </span>
          {ROOTS.map(r => {
            const active = r.slug === rootSlug;
            return (
              <button key={r.slug} onClick={() => { setRootSlug(r.slug); setHover(null); setBranchHL(null); }}
                style={{
                  fontFamily: 'var(--mono)', fontSize: '0.66rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                  cursor: 'pointer', padding: '0.4rem 0.8rem',
                  border: `1px solid ${active ? 'rgba(200,168,75,0.55)' : 'rgba(212,206,196,0.22)'}`,
                  color: active ? 'var(--gold)' : 'var(--muted)',
                  background: active ? 'rgba(200,168,75,0.08)' : 'transparent',
                }}>
                {r.label}
              </button>
            );
          })}
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)', marginLeft: '0.4rem' }}>
            {reach.size} orgs · {subEdges.length} links · {branches.length} branches
          </span>
        </div>

        {/* How to read it */}
        <p style={{ fontSize: '0.82rem', color: 'rgba(212,206,196,0.72)', lineHeight: 1.6, maxWidth: '52rem', marginBottom: '1.25rem' }}>
          Every organization with a documented line of descent from the selected origin, traced left → right through
          formation and ideological inheritance. Each <strong>branch</strong> (a named lineage) has its own color;
          edge arrows show direction of influence. Hover a branch in the key to isolate it, or a card to trace its
          links. Click any card for its full assessment. Branches converge where later groups draw on more than one line.
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
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'rgba(212,206,196,0.6)' }}>{tier}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Diagram (scrolls horizontally if wide) */}
        <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', maxWidth: 'none' }}>
            <defs>
              {branches.map(([c]) => (
                <marker key={c} id={`orig-arrow-${safe(c)}`} viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill={branchColor(c)} />
                </marker>
              ))}
            </defs>

            {/* Edges */}
            {subEdges.map((e, i) => {
              const s = pos[e.source_slug], t = pos[e.target_slug];
              if (!s || !t) return null;
              const x1 = s.x + NODE_W, y1 = s.y + NODE_H / 2;
              const x2 = t.x - 2,      y2 = t.y + NODE_H / 2;
              return (
                <path key={i} d={arrow(x1, y1, x2, y2)} fill="none" stroke={branchColor(e.chain_name)}
                  strokeWidth={1.6} markerEnd={`url(#orig-arrow-${safe(e.chain_name || 'Other formations')})`}
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
              const score = n ? parseFloat(n.composite_score || 0) : null;
              const label = name.length > 25 ? name.slice(0, 24) + '…' : name;
              return (
                <a key={slug} href={`/org/${slug}`}
                  onMouseEnter={() => setHover(slug)} onMouseLeave={() => setHover(null)}
                  style={{ cursor: 'pointer' }}>
                  <g opacity={dimNode(slug) ? 0.25 : 1}>
                    <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx={4}
                      fill="rgba(28,24,20,0.92)" stroke={isRoot ? 'var(--gold)' : tierColor}
                      strokeWidth={isRoot || hover === slug ? 2 : 1.2} />
                    {/* Left bar = branch color (origin = gold) */}
                    <rect x={p.x} y={p.y} width={5} height={NODE_H} rx={2} fill={bColor} />
                    <text x={p.x + 15} y={p.y + 21} fontFamily="var(--serif)" fontSize={13.5} fill="var(--paper)" fontWeight={700}>{label}</text>
                    <text x={p.x + 15} y={p.y + 39} fontFamily="var(--mono)" fontSize={10} fill={isRoot ? 'var(--gold)' : tierColor} fontWeight={600}>
                      {isRoot ? 'ORIGIN' : (n?.composite_tier || '—')}{!isRoot && score != null ? ` · ${score.toFixed(0)}%` : ''}
                    </text>
                  </g>
                </a>
              );
            })}

            {/* Relationship labels — only for the hovered node's edges, to keep dense graphs legible */}
            {hover && subEdges.map((e, i) => {
              if (e.source_slug !== hover && e.target_slug !== hover) return null;
              const s = pos[e.source_slug], t = pos[e.target_slug];
              if (!s || !t || !REL_LABELS[e.relationship_type]) return null;
              const x1 = s.x + NODE_W, y1 = s.y + NODE_H / 2;
              const x2 = t.x - 2,      y2 = t.y + NODE_H / 2;
              const lx = x1 + COL_GAP / 2;
              const t01 = x2 > x1 ? Math.min(1, (COL_GAP / 2) / (x2 - x1)) : 0.5;
              const ly = y1 + (y2 - y1) * t01;
              return (
                <text key={`l${i}`} x={lx} y={ly - 5} textAnchor="middle" fontFamily="var(--mono)" fontSize={10}
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
