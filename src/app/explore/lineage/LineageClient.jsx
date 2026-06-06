'use client';
import { useState } from 'react';

const TIER_COLORS = {
  'Super Culty': '#e8574d',
  'Kinda Culty': '#d99b3e',
  'Not Culty':   '#5cb878',
};

const CHAIN_COLORS = {
  'White supremacist formations':         '#e8574d',
  'Religious-political-media formations': '#d99b3e',
  'High-control religious formations':    '#e8703a',
  'Surveillance infrastructure formation':'#8f93e0',
};

const REL_LABELS = {
  ideological_heir:        'Ideological heir',
  tactical_evolution:      'Tactical evolution',
  media_pipeline:          'Media pipeline',
  institutional_successor: 'Institutional successor',
  founded_by:              'Founded by',
  documented_influence:    'Documented influence',
};

// Layout constants (SVG units)
const NODE_W = 168, NODE_H = 50, COL_GAP = 150, ROW_GAP = 22, PAD = 10;

// Longest-path layering of a chain's edges into left→right columns.
function layoutChain(chainEdges) {
  const slugs = new Set();
  chainEdges.forEach(e => { slugs.add(e.source_slug); slugs.add(e.target_slug); });

  const layer = {};
  slugs.forEach(s => { layer[s] = 0; });
  // Iterate longest-path; cap at node count (DAG-safe, tolerates stray cycles)
  for (let iter = 0; iter < slugs.size; iter++) {
    let changed = false;
    chainEdges.forEach(e => {
      const nl = layer[e.source_slug] + 1;
      if (nl > layer[e.target_slug]) { layer[e.target_slug] = nl; changed = true; }
    });
    if (!changed) break;
  }

  const cols = {};
  [...slugs].forEach(s => { (cols[layer[s]] = cols[layer[s]] || []).push(s); });

  const pos = {};
  const colNums = Object.keys(cols).map(Number);
  const maxCol = colNums.length ? Math.max(...colNums) : 0;
  let maxRows = 0;
  Object.entries(cols).forEach(([col, arr]) => {
    arr.forEach((s, row) => {
      pos[s] = {
        x: PAD + Number(col) * (NODE_W + COL_GAP),
        y: PAD + row * (NODE_H + ROW_GAP),
      };
    });
    maxRows = Math.max(maxRows, arr.length);
  });

  const width  = PAD * 2 + (maxCol + 1) * NODE_W + maxCol * COL_GAP;
  const height = PAD * 2 + maxRows * NODE_H + Math.max(0, maxRows - 1) * ROW_GAP;
  return { pos, width, height };
}

export default function LineageClient({ nodes = [], edges = [] }) {
  const [hover, setHover] = useState(null);

  const nodeBySlug = {};
  nodes.forEach(n => { nodeBySlug[n.slug] = n; });

  // Group edges by chain (edges without a chain fall into "Other formations")
  const groupsMap = {};
  edges.forEach(e => {
    const key = e.chain_name || 'Other formations';
    (groupsMap[key] = groupsMap[key] || []).push(e);
  });
  // Order: known chains first (in palette order), then any others
  const orderedNames = [
    ...Object.keys(CHAIN_COLORS).filter(c => groupsMap[c]),
    ...Object.keys(groupsMap).filter(c => !(c in CHAIN_COLORS)),
  ];

  const arrow = (x1, y1, x2, y2) => {
    const mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="container--wide" style={{ paddingTop: '1.25rem', paddingBottom: '3rem' }}>
        {orderedNames.length === 0 && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>No lineage data available.</p>
        )}

        {orderedNames.map(chainName => {
          const chainEdges = groupsMap[chainName];
          const { pos, width, height } = layoutChain(chainEdges);
          const accent = CHAIN_COLORS[chainName] || 'rgba(212,206,196,0.5)';
          const slugCount = new Set(chainEdges.flatMap(e => [e.source_slug, e.target_slug])).size;

          return (
            <section key={chainName} style={{ marginBottom: '2.5rem' }}>
              {/* Chain header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--paper)' }}>
                  {chainName}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)' }}>
                  {slugCount} orgs · {chainEdges.length} links
                </span>
                <span style={{ flex: 1, height: 1, background: 'rgba(212,206,196,0.12)' }} />
              </div>

              {/* Flow diagram (scrolls horizontally if wide) */}
              <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
                  style={{ display: 'block', maxWidth: 'none' }}>
                  <defs>
                    <marker id={`arrow-${chainName.replace(/[^a-z0-9]/gi, '')}`} viewBox="0 0 10 10"
                      refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M0,0 L10,5 L0,10 z" fill={accent} />
                    </marker>
                  </defs>

                  {/* Edges */}
                  {chainEdges.map((e, i) => {
                    const s = pos[e.source_slug], t = pos[e.target_slug];
                    if (!s || !t) return null;
                    const x1 = s.x + NODE_W, y1 = s.y + NODE_H / 2;
                    const x2 = t.x - 2,      y2 = t.y + NODE_H / 2;
                    const dim = hover && hover !== e.source_slug && hover !== e.target_slug;
                    return (
                      <path key={i} d={arrow(x1, y1, x2, y2)} fill="none" stroke={accent} strokeWidth={1.6}
                        markerEnd={`url(#arrow-${chainName.replace(/[^a-z0-9]/gi, '')})`}
                        opacity={dim ? 0.12 : 0.7} />
                    );
                  })}

                  {/* Nodes */}
                  {Object.entries(pos).map(([slug, p]) => {
                    const n = nodeBySlug[slug];
                    const name = n?.name || slug;
                    const tierColor = TIER_COLORS[n?.composite_tier] || '#888';
                    const score = n ? parseFloat(n.composite_score || 0) : null;
                    const dim = hover && hover !== slug;
                    const label = name.length > 24 ? name.slice(0, 23) + '…' : name;
                    return (
                      <a key={slug} href={`/org/${slug}`}
                        onMouseEnter={() => setHover(slug)} onMouseLeave={() => setHover(null)}
                        style={{ cursor: 'pointer' }}>
                        <g opacity={dim ? 0.3 : 1}>
                          <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx={4}
                            fill="rgba(28,24,20,0.9)" stroke={tierColor}
                            strokeWidth={hover === slug ? 2 : 1.2} />
                          <rect x={p.x} y={p.y} width={4} height={NODE_H} rx={2} fill={tierColor} />
                          <text x={p.x + 14} y={p.y + 20} fontFamily="var(--serif)" fontSize={13.5}
                            fill="var(--paper)" fontWeight={700}>{label}</text>
                          <text x={p.x + 14} y={p.y + 37} fontFamily="var(--mono)" fontSize={10}
                            fill={tierColor} fontWeight={600}>
                            {n?.composite_tier || '—'}{score != null ? ` · ${score.toFixed(0)}%` : ''}
                          </text>
                        </g>
                      </a>
                    );
                  })}

                  {/* Relationship labels — drawn last so the boxes never cover them */}
                  {chainEdges.map((e, i) => {
                    const s = pos[e.source_slug], t = pos[e.target_slug];
                    if (!s || !t || !REL_LABELS[e.relationship_type]) return null;
                    const x1 = s.x + NODE_W, y1 = s.y + NODE_H / 2;
                    const x2 = t.x - 2,      y2 = t.y + NODE_H / 2;
                    const midx = (x1 + x2) / 2, midy = (y1 + y2) / 2;
                    const dim = hover && hover !== e.source_slug && hover !== e.target_slug;
                    return (
                      <text key={`l${i}`} x={midx} y={midy - 5} textAnchor="middle"
                        fontFamily="var(--mono)" fontSize={10} fill="rgba(235,231,223,0.95)"
                        opacity={dim ? 0.12 : 1}
                        style={{ paintOrder: 'stroke', stroke: 'rgba(18,14,10,0.95)', strokeWidth: 4, strokeLinejoin: 'round', pointerEvents: 'none' }}>
                        {REL_LABELS[e.relationship_type]}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </section>
          );
        })}

        {/* Legend */}
        <div style={{ borderTop: '1px solid rgba(212,206,196,0.08)', paddingTop: '1rem', marginTop: '0.5rem',
          display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {Object.entries(TIER_COLORS).map(([tier, c]) => (
            <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: c }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'rgba(212,206,196,0.6)' }}>{tier}</span>
            </div>
          ))}
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'rgba(212,206,196,0.35)', marginLeft: 'auto' }}>
            Each card = an organization · arrows = documented formation/influence (left → right) · click a card for the full assessment
          </span>
        </div>
      </div>
    </div>
  );
}
