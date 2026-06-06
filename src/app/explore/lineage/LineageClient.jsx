'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const TIER_COLORS = {
  'Super Culty':   '#e8574d',
  'Kinda Culty':   '#d99b3e',
  'Not Culty':     '#5cb878',
};

const CHAIN_COLORS = {
  'White supremacist formations':        '#e8574d',
  'Religious-political-media formations':'#d99b3e',
  'High-control religious formations':   '#e8703a',
  'Surveillance infrastructure formation':'#8f93e0',
};

const REL_LABELS = {
  'ideological_heir':       'Ideological heir',
  'tactical_evolution':     'Tactical evolution',
  'media_pipeline':         'Media pipeline',
  'institutional_successor':'Institutional successor',
  'founded_by':             'Founded by',
  'documented_influence':   'Documented influence',
};

export default function LineageClient({ nodes = [], edges = [] }) {
  const containerRef  = useRef(null);
  const graphRef      = useRef(null);
  const [loaded,      setLoaded]      = useState(false);
  const [error,       setError]       = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [chainFilter, setChainFilter] = useState(null);
  const [highlight,   setHighlight]   = useState(null); // hovered node id

  const chains = [...new Set(edges.map(e => e.chain_name).filter(Boolean))];

  // Filtered graph data
  const filteredEdges = chainFilter
    ? edges.filter(e => e.chain_name === chainFilter)
    : edges;
  const activeNodeSlugs = new Set([
    ...filteredEdges.map(e => e.source_slug),
    ...filteredEdges.map(e => e.target_slug),
  ]);
  const filteredNodes = nodes.filter(n => activeNodeSlugs.has(n.slug));

  const graphData = {
    nodes: filteredNodes.map(n => ({
      id:    n.slug,
      name:  n.name,
      tier:  n.composite_tier,
      score: parseFloat(n.composite_score || 0),
      category: n.category,
      color: TIER_COLORS[n.composite_tier] || '#888',
      val:   Math.max(1, parseFloat(n.composite_score || 0) / 20),
    })),
    links: filteredEdges.map(e => ({
      source:      e.source_slug,
      target:      e.target_slug,
      chain:       e.chain_name,
      rel:         e.relationship_type,
      strength:    parseFloat(e.strength || 0.8),
      color:       CHAIN_COLORS[e.chain_name] || '#888',
      notes:       e.notes,
    })),
  };

  // Load ForceGraph2D dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/force-graph@1.51.4/dist/force-graph.min.js';
    script.async = true;
    script.onload  = () => setLoaded(true);
    script.onerror = () => setError(true);
    document.head.appendChild(script);
    return () => { if (graphRef.current) { graphRef.current._destructor?.(); graphRef.current = null; } };
  }, []);

  const initGraph = useCallback(() => {
    if (!containerRef.current || !window.ForceGraph || !loaded) return;
    if (graphRef.current) { graphRef.current._destructor?.(); }

    const Graph = window.ForceGraph()(containerRef.current)
      .graphData(graphData)
      .backgroundColor('rgba(0,0,0,0)')
      .nodeRelSize(5)
      .nodeVal(n => n.val)
      .nodeColor(n => highlight
        ? (n.id === highlight ||
           graphData.links.some(l =>
             (l.source?.id || l.source) === highlight && (l.target?.id || l.target) === n.id ||
             (l.target?.id || l.target) === highlight && (l.source?.id || l.source) === n.id
           )
           ? n.color
           : 'rgba(100,100,100,0.2)')
        : n.color)
      .nodeLabel(n => `<div style="background:rgba(18,14,10,0.95);border:1px solid rgba(200,168,75,0.4);padding:8px 12px;font-family:monospace;font-size:11px;color:#f4f0e8;max-width:220px">
        <div style="font-weight:700;margin-bottom:4px">${n.name}</div>
        <div style="color:${n.color}">${n.tier}</div>
        <div style="color:rgba(212,206,196,0.5)">${n.score.toFixed(0)}% composite</div>
      </div>`)
      .nodeCanvasObject((node, ctx, scale) => {
        const r = Math.max(3, node.val * 2.5);
        const isHighlighted = !highlight || node.id === highlight ||
          graphData.links.some(l =>
            (l.source?.id || l.source) === highlight && (l.target?.id || l.target) === node.id ||
            (l.target?.id || l.target) === highlight && (l.source?.id || l.source) === node.id
          );
        const alpha = highlight ? (isHighlighted ? 0.92 : 0.1) : 0.85;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
        ctx.fillStyle = node.color + Math.round(alpha * 255).toString(16).padStart(2,'0');
        ctx.fill();
        if (node.id === selected?.id) {
          ctx.strokeStyle = 'rgba(200,168,75,0.9)';
          ctx.lineWidth = 2 / scale;
          ctx.stroke();
        }
        if (scale > 2.5) {
          ctx.fillStyle = `rgba(244,240,232,${alpha * 0.8})`;
          ctx.font = `${Math.min(12, 3 / scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.name.split(' ')[0], node.x, node.y + r + 4/scale);
        }
      })
      .linkColor(l => {
        const baseColor = l.color || '#888';
        return highlight
          ? ((l.source?.id || l.source) === highlight || (l.target?.id || l.target) === highlight
            ? baseColor + 'dd'
            : 'rgba(100,100,100,0.1)')
          : baseColor + 'aa';
      })
      .linkWidth(l => (l.strength || 0.8) * 2.5)
      .linkDirectionalArrowLength(6)
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalParticles(l => highlight &&
        ((l.source?.id || l.source) === highlight || (l.target?.id || l.target) === highlight) ? 3 : 0)
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleColor(l => l.color || '#888')
      .linkLabel(l => `<div style="background:rgba(18,14,10,0.95);border:1px solid rgba(212,206,196,0.2);padding:6px 10px;font-family:monospace;font-size:10px;color:#f4f0e8;max-width:200px">
        <div style="color:rgba(200,168,75,0.8);margin-bottom:2px">${REL_LABELS[l.rel] || l.rel}</div>
        <div style="color:rgba(212,206,196,0.6)">${l.notes || ''}</div>
      </div>`)
      .onNodeClick(node => setSelected(node === selected ? null : node))
      .onNodeHover(node => setHighlight(node ? node.id : null))
      .d3Force('charge', null)
      .d3AlphaDecay(0.02)
      .d3VelocityDecay(0.3);

    // Custom charge force — stronger repulsion
    Graph.d3Force('charge', { strength: () => -300, initialize() {}, force(alpha) {
      const ns = Graph.graphData().nodes;
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x, dy = ns[j].y - ns[i].y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const f = -300 * alpha / (dist * dist);
          ns[i].vx += f * dx / dist;
          ns[i].vy += f * dy / dist;
          ns[j].vx -= f * dx / dist;
          ns[j].vy -= f * dy / dist;
        }
      }
    }});

    graphRef.current = Graph;
  }, [loaded, graphData, selected, highlight]);

  useEffect(() => { if (loaded) initGraph(); }, [loaded, filteredEdges.length, chainFilter]);

  useEffect(() => {
    if (!graphRef.current || !loaded) return;
    graphRef.current.graphData(graphData);
  }, [highlight, selected]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(212,206,196,0.1)', padding: '1.25rem 0 0.9rem', background: 'var(--ink)', position: 'sticky', top: '60px', zIndex: 50 }}>
        <div className="container--wide">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
              {filteredNodes.length} orgs · {filteredEdges.length} edges
            </span>
          </div>

          {/* Chain filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setChainFilter(null)}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', padding: '0.3rem 0.65rem',
                background: !chainFilter ? 'rgba(200,168,75,0.12)' : 'transparent',
                border: `1px solid ${!chainFilter ? 'rgba(200,168,75,0.5)' : 'rgba(212,206,196,0.2)'}`,
                color: !chainFilter ? 'var(--gold)' : 'var(--muted)', cursor: 'pointer' }}>
              All chains
            </button>
            {chains.map(c => (
              <button key={c} onClick={() => setChainFilter(chainFilter === c ? null : c)}
                style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', padding: '0.25rem 0.55rem',
                  background: chainFilter === c ? `${CHAIN_COLORS[c]}18` : 'transparent',
                  border: `1px solid ${chainFilter === c ? CHAIN_COLORS[c] : 'rgba(212,206,196,0.15)'}`,
                  color: chainFilter === c ? CHAIN_COLORS[c] : 'var(--muted)', cursor: 'pointer' }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Graph + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 280px' : '1fr', flex: 1, minHeight: 540 }}>
        <div style={{ position: 'relative', background: 'rgba(244,240,232,0.015)' }}>
          {error ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>Failed to load graph library</p>
            </div>
          ) : (
            <>
              <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 540 }} />
              {!loaded && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(18,14,10,0.85)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--gold)', letterSpacing: '0.2em' }}>LOADING GRAPH…</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Node detail sidebar */}
        {selected && (
          <div style={{ background: 'var(--ink)', borderLeft: '1px solid rgba(212,206,196,0.1)', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)' }}>Selected</span>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>{selected.category}</p>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1.3 }}>{selected.name}</h2>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.65rem', background: `${TIER_COLORS[selected.tier] || '#888'}18`, border: `1px solid ${TIER_COLORS[selected.tier] || '#888'}40` }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: TIER_COLORS[selected.tier] || '#888' }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: TIER_COLORS[selected.tier] || '#888' }}>{selected.tier}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--paper)', fontWeight: 700 }}>{selected.score.toFixed(0)}%</span>
            </div>
            {/* Outgoing edges */}
            {(() => {
              const out = edges.filter(e => e.source_slug === selected.id);
              const inc = edges.filter(e => e.target_slug === selected.id);
              return (
                <>
                  {inc.length > 0 && (
                    <div>
                      <p style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.4rem' }}>Influenced by</p>
                      {inc.map((e, i) => {
                        const src = nodes.find(n => n.slug === e.source_slug);
                        return <div key={i} style={{ padding: '0.4rem 0.5rem', background: 'rgba(244,240,232,0.03)', border: '1px solid rgba(212,206,196,0.08)', marginBottom: '0.25rem' }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--gold)' }}>{src?.name || e.source_slug}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted)' }}>{REL_LABELS[e.relationship_type] || e.relationship_type}</div>
                        </div>;
                      })}
                    </div>
                  )}
                  {out.length > 0 && (
                    <div>
                      <p style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.4rem' }}>Influenced</p>
                      {out.map((e, i) => {
                        const tgt = nodes.find(n => n.slug === e.target_slug);
                        return <div key={i} style={{ padding: '0.4rem 0.5rem', background: 'rgba(244,240,232,0.03)', border: '1px solid rgba(212,206,196,0.08)', marginBottom: '0.25rem' }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--gold)' }}>{tgt?.name || e.target_slug}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted)' }}>{REL_LABELS[e.relationship_type] || e.relationship_type}</div>
                        </div>;
                      })}
                    </div>
                  )}
                </>
              );
            })()}
            <a href={`/org/${selected.id}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', padding: '0.55rem', background: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.3)', color: 'var(--gold)', fontFamily: 'var(--mono)', fontSize: '0.65rem', textTransform: 'uppercase', textDecoration: 'none' }}>
              Full Assessment →
            </a>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ borderTop: '1px solid rgba(212,206,196,0.08)', padding: '0.75rem 0' }}>
        <div className="container--wide">
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {Object.entries(REL_LABELS).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: 18, height: 2, background: 'rgba(212,206,196,0.4)' }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'rgba(212,206,196,0.4)' }}>{v}</span>
              </div>
            ))}
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'rgba(212,206,196,0.25)', marginLeft: 'auto' }}>
              Node size = composite score · Hover to trace connections · Click to select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
