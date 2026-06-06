'use client';
import { useEffect, useRef, useState } from 'react';

const TIER_COLORS = {
  'Super Culty':  '#e8574d',
  'Kinda Culty':  '#d99b3e',
  'Not Culty':    '#5cb878',
};

const TIER_ORDER = ['Super Culty','Kinda Culty','Not Culty'];

export default function SankeyClient({ data = [] }) {
  const svgRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [dims, setDims] = useState({ w: 900, h: 560 });

  useEffect(() => {
    if (svgRef.current) {
      const w = svgRef.current.parentElement?.offsetWidth || 900;
      setDims({ w: Math.max(600, w - 60), h: 520 });
    }
  }, []);

  const { w, h } = dims;
  const PAD = { top: 20, bottom: 40, left: 160, right: 160 };
  const innerW = w - PAD.left - PAD.right;
  const innerH = h - PAD.top - PAD.bottom;
  const COL_GAP = innerW;

  // Build unique categories (left column) and tiers (right column)
  const catMap = {};
  const tierMap = {};
  data.forEach(({ category, composite_tier, count }) => {
    catMap[category]       = (catMap[category] || 0) + parseInt(count);
    tierMap[composite_tier] = (tierMap[composite_tier] || 0) + parseInt(count);
  });

  const total = Object.values(catMap).reduce((a,b) => a+b, 0);

  // Sort categories by total desc
  const cats  = Object.entries(catMap).sort((a,b) => b[1] - a[1]);
  const tiers = TIER_ORDER.filter(t => tierMap[t]).map(t => [t, tierMap[t]]);

  // Compute node y-positions (left: categories, right: tiers)
  const NODE_GAP = 6;

  const catNodes = (() => {
    let y = 0;
    return cats.map(([name, value]) => {
      const h = (value / total) * innerH;
      const node = { name, value, y, h };
      y += h + NODE_GAP;
      return node;
    });
  })();

  const tierNodes = (() => {
    const totalTier = tiers.reduce((s,[,v])=>s+v, 0);
    let y = 0;
    return tiers.map(([name, value]) => {
      const h = (value / totalTier) * innerH;
      const node = { name, value, y, h, color: TIER_COLORS[name] };
      y += h + NODE_GAP;
      return node;
    });
  })();

  // Build flows
  const flows = [];
  data.forEach(({ category, composite_tier, count }) => {
    const src = catNodes.find(n => n.name === category);
    const tgt = tierNodes.find(n => n.name === composite_tier);
    if (!src || !tgt) return;
    flows.push({ category, tier: composite_tier, value: parseInt(count), src, tgt });
  });

  // Compute flow offsets within each source/target node
  const srcOffset = {}, tgtOffset = {};
  flows.forEach(f => {
    if (!srcOffset[f.category]) srcOffset[f.category] = 0;
    if (!tgtOffset[f.tier])     tgtOffset[f.tier]     = 0;
    f.srcY0 = f.src.y + srcOffset[f.category];
    f.srcY1 = f.srcY0 + (f.value / f.src.value) * f.src.h;
    f.tgtY0 = f.tgt.y + tgtOffset[f.tier];
    f.tgtY1 = f.tgtY0 + (f.value / tierMap[f.tier]) * f.tgt.h;
    srcOffset[f.category] += (f.value / f.src.value) * f.src.h;
    tgtOffset[f.tier]     += (f.value / tierMap[f.tier]) * f.tgt.h;
  });

  const NODE_W = 14;

  function sankeyPath(srcX, srcY0, srcY1, tgtX, tgtY0, tgtY1) {
    const srcMid = (srcY0 + srcY1) / 2;
    const tgtMid = (tgtY0 + tgtY1) / 2;
    const cx = (srcX + tgtX) / 2;
    return `M ${srcX} ${srcY0} C ${cx} ${srcY0}, ${cx} ${tgtY0}, ${tgtX} ${tgtY0}
            L ${tgtX} ${tgtY1} C ${cx} ${tgtY1}, ${cx} ${srcY1}, ${srcX} ${srcY1} Z`;
  }

  const isHighlighted = (f) => !hovered ||
    (hovered.type === 'cat'  && hovered.name === f.category) ||
    (hovered.type === 'tier' && hovered.name === f.tier);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(212,206,196,0.1)', padding: '1.25rem 0 0.9rem', background: 'var(--ink)', position: 'sticky', top: '60px', zIndex: 50 }}>
        <div className="container--wide">
          <div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              <a href="/explore" style={{ color: 'var(--gold)' }}>Explorer</a> —
            </span>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.2rem,2.5vw,1.8rem)', color: 'var(--paper)', display: 'inline', marginLeft: '0.4rem' }}>
              Category → Tier Flow
            </h1>
          </div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
            How each organizational category distributes across cultiness tiers. Hover to trace a category or tier.
          </p>
        </div>
      </div>

      {/* Sankey */}
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowX: 'auto' }}>
        <svg ref={svgRef} width={w} height={h} style={{ display: 'block', maxWidth: '100%', overflow: 'visible' }}>
          <g transform={`translate(${PAD.left},${PAD.top})`}>

            {/* Flows */}
            {flows.map((f, i) => (
              <path key={i}
                d={sankeyPath(0, f.srcY0, f.srcY1, COL_GAP, f.tgtY0, f.tgtY1)}
                fill={f.tgt.color || '#888'}
                fillOpacity={isHighlighted(f) ? 0.35 : 0.04}
                stroke={f.tgt.color || '#888'}
                strokeOpacity={isHighlighted(f) ? 0.6 : 0.08}
                strokeWidth={0}
                style={{ cursor: 'default', transition: 'fill-opacity 0.15s, stroke-opacity 0.15s' }}
                onMouseEnter={() => setHovered({ type: 'flow', ...f })}
                onMouseLeave={() => setHovered(null)}
              />
            ))}

            {/* Left nodes: categories */}
            {catNodes.map(n => (
              <g key={n.name}
                onMouseEnter={() => setHovered({ type: 'cat', name: n.name, value: n.value })}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}>
                <rect x={-NODE_W} y={n.y} width={NODE_W} height={n.h}
                  fill='rgba(212,206,196,0.25)'
                  fillOpacity={hovered && hovered.name === n.name ? 0.7 : 0.35}
                />
                <text x={-NODE_W - 6} y={n.y + n.h/2}
                  textAnchor="end" dominantBaseline="middle"
                  fill={hovered && hovered.name === n.name ? 'var(--paper)' : 'rgba(212,206,196,0.55)'}
                  fontSize={Math.max(8, Math.min(11, n.h * 0.55))}
                  fontFamily="monospace"
                  style={{ transition: 'fill 0.1s' }}>
                  {n.name}
                </text>
                <text x={-NODE_W - 6} y={n.y + n.h/2 + 10}
                  textAnchor="end" dominantBaseline="middle"
                  fill="rgba(200,168,75,0.6)" fontSize={8} fontFamily="monospace">
                  {n.value}
                </text>
              </g>
            ))}

            {/* Right nodes: tiers */}
            {tierNodes.map(n => (
              <g key={n.name}
                onMouseEnter={() => setHovered({ type: 'tier', name: n.name, value: n.value, color: n.color })}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}>
                <rect x={COL_GAP} y={n.y} width={NODE_W} height={n.h}
                  fill={n.color}
                  fillOpacity={hovered && hovered.name === n.name ? 0.9 : 0.7}
                />
                <text x={COL_GAP + NODE_W + 6} y={n.y + n.h/2 - 5}
                  dominantBaseline="middle"
                  fill={n.color}
                  fontSize={Math.max(9, Math.min(12, n.h * 0.5))}
                  fontFamily="monospace"
                  fontWeight="700">
                  {n.name}
                </text>
                <text x={COL_GAP + NODE_W + 6} y={n.y + n.h/2 + 7}
                  dominantBaseline="middle"
                  fill="rgba(200,168,75,0.6)" fontSize={9} fontFamily="monospace">
                  {n.value} orgs · {((n.value/total)*100).toFixed(1)}%
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Hover tooltip */}
        {hovered?.type === 'flow' && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(18,14,10,0.95)', border: `1px solid ${hovered.tgt?.color || 'rgba(212,206,196,0.2)'}40`, display: 'inline-block', fontFamily: 'var(--mono)', fontSize: '0.65rem' }}>
            <span style={{ color: 'var(--paper)' }}>{hovered.category}</span>
            <span style={{ color: 'var(--muted)', margin: '0 0.5rem' }}>→</span>
            <span style={{ color: hovered.tgt?.color || 'var(--gold)' }}>{hovered.tier}</span>
            <span style={{ color: 'var(--gold)', marginLeft: '0.75rem', fontWeight: 700 }}>{hovered.value} orgs</span>
          </div>
        )}
      </div>
    </div>
  );
}
