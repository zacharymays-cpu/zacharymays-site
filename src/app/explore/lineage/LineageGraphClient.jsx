'use client';
import { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow, Background, MiniMap, Panel,
  Handle, Position, MarkerType, BaseEdge, getSmoothStepPath,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useRouter } from 'next/navigation';

// ── Palettes ─────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  'Religious':                  '#d4956a',
  'Therapeutic':                '#6ab4d4',
  'Recovery / self-help':       '#7ed4a4',
  'Professional formation':     '#a4c4e8',
  'Conservative pipeline':      '#e8a44c',
  'Political':                  '#d46a6a',
  'Criminal':                   '#c45a5a',
  'Think tank / media':         '#b48fd4',
  'Government':                 '#7494b4',
  'Military':                   '#647464',
  'Intelligence':               '#547484',
  'Law enforcement':            '#5474a4',
  'Academic':                   '#a4d4c4',
  'MLM':                        '#e4c46a',
  'Corporate':                  '#c4b494',
  'Digital / online':           '#94c4e4',
  'Cultural institution':       '#d4b4a4',
  'Federal employer':           '#8494a4',
};
const catColor = (c) => CATEGORY_COLORS[c] || 'rgba(212,206,196,0.5)';

const CHAIN_COLORS = {
  'LGAT / Human Potential lineage':           '#4cc0b0',
  'Theosophical / New Age lineage':           '#8d6fd1',
  'Charismatic Evangelical lineage':          '#d99b3e',
  'Evangelical political pipeline':           '#e8a44c',
  'Therapeutic Community lineage':            '#6ab4d4',
  'Scientology derivatives':                  '#d76f8f',
  'Surveillance infrastructure formation':    '#4e79a7',
  'LDS splinter lineage':                     '#b48fd4',
  'Black nationalist lineage':                '#8cc152',
  'National Socialist lineage':               '#e15759',
  'Neo-Nazi media lineage':                   '#d774b0',
  'Racist skinhead lineage':                  '#6f8fb0',
  'Alt-right identitarian lineage':           '#f28e2b',
  'Christian Identity lineage':               '#edc948',
  'Creativity lineage':                       '#4cc0b0',
  'Ku Klux Klan lineage':                     '#a855f7',
  'White supremacist formations':             '#8cc152',
  'Religious-political-media formations':     '#d76f8f',
  'High-control religious formations':        '#9c755f',
};
const chainColor = (c) => CHAIN_COLORS[c] || 'rgba(212,206,196,0.45)';

const TIER_COLORS = {
  'Super Culty': '#e8574d',
  'Kinda Culty': '#d99b3e',
  'Not Culty':   '#5cb878',
};
const tierColor = (t) => TIER_COLORS[t] || 'rgba(212,206,196,0.35)';

const TIER_LABELS = {
  'Super Culty':  'High-Control',
  'Kinda Culty':  'Moderate-Control',
  'Not Culty':    'Low-Control',
};

const REL_LABELS = {
  ideological_heir:        'Ideological heir',
  tactical_evolution:      'Tactical evolution',
  media_pipeline:          'Media pipeline',
  institutional_successor: 'Institutional successor',
  founded_by:              'Founded by',
  documented_influence:    'Documented influence',
};

// ── Layout ───────────────────────────────────────────────────────────────
const CATEGORY_ORDER = [
  'Therapeutic',
  'Recovery / self-help',
  'Professional formation',
  'Religious',
  'Conservative pipeline',
  'Political',
  'Criminal',
  'Think tank / media',
  'Government',
  'Military',
  'Intelligence',
  'Law enforcement',
  'MLM',
  'Academic',
  'Corporate',
  'Digital / online',
];

const NODE_W = 204;
const NODE_H = 68;
const COL_GAP = 24;
const ROW_GAP = 20;
const BAND_GAP = 60;   // vertical gap between category bands
const BAND_HEADER = 32;
const ITEMS_PER_ROW = 6;

// Categories stack top-to-bottom; nodes within each band flow left-to-right.
// This keeps the canvas narrow enough to be readable without heavy zoom-out.
function computeLayout(nodes) {
  const groups = {};
  nodes.forEach(n => {
    const cat = n.category || 'Other';
    (groups[cat] = groups[cat] || []).push(n);
  });

  const sortedCats = Object.keys(groups).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return groups[b].length - groups[a].length;
  });

  const positions = {};
  let gy = 0;

  sortedCats.forEach(cat => {
    const arr = groups[cat];
    arr.forEach((n, i) => {
      const col = i % ITEMS_PER_ROW;
      const row = Math.floor(i / ITEMS_PER_ROW);
      positions[n.slug] = {
        x: col * (NODE_W + COL_GAP),
        y: gy + BAND_HEADER + row * (NODE_H + ROW_GAP),
      };
    });
    const numRows = Math.ceil(arr.length / ITEMS_PER_ROW);
    const bandH = BAND_HEADER + numRows * (NODE_H + ROW_GAP) - ROW_GAP;
    gy += bandH + BAND_GAP;
  });

  return positions;
}

// ── Custom Node ───────────────────────────────────────────────────────────
function OrgNode({ data }) {
  const tc = tierColor(data.tier);
  const cc = catColor(data.category);
  const score = data.score != null && !Number.isNaN(parseFloat(data.score))
    ? `${parseFloat(data.score).toFixed(0)}%` : null;
  const tierLabel = TIER_LABELS[data.tier] || (data.tier ? data.tier : 'Unscored');

  return (
    <div style={{
      background: 'rgba(22,18,14,0.97)',
      border: `1.5px solid ${tc}`,
      borderLeft: `4px solid ${cc}`,
      borderRadius: 4,
      padding: '6px 10px',
      width: NODE_W,
      minHeight: NODE_H,
      cursor: 'pointer',
      boxSizing: 'border-box',
    }}>
      <Handle type="target" position={Position.Top}
        style={{ background: cc, border: 'none', width: 6, height: 6 }} />

      <div style={{
        fontFamily: 'Georgia, var(--serif, serif)',
        fontSize: 12,
        fontWeight: 700,
        color: '#f4f0e8',
        lineHeight: 1.3,
        marginBottom: 4,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {data.name}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {score && (
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: tc, fontWeight: 700 }}>
            {score}
          </span>
        )}
        <span style={{
          fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: tc, opacity: 0.85,
        }}>
          {tierLabel}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom}
        style={{ background: cc, border: 'none', width: 6, height: 6 }} />
    </div>
  );
}

// ── Custom Edge label ─────────────────────────────────────────────────────
function LabeledEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, style }) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {data?.label && (
        <foreignObject x={labelX - 52} y={labelY - 10} width={104} height={20} style={{ pointerEvents: 'none' }}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{
            fontFamily: 'monospace', fontSize: 8.5,
            color: 'rgba(235,231,223,0.9)',
            background: 'rgba(14,10,6,0.88)',
            padding: '1px 4px', borderRadius: 2,
            textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden',
          }}>
            {data.label}
          </div>
        </foreignObject>
      )}
    </>
  );
}

const nodeTypes = { org: OrgNode };
const edgeTypes = { labeled: LabeledEdge };

// ── Filter helpers ────────────────────────────────────────────────────────
function useToggleSet(allItems) {
  const [active, setActive] = useState(null); // null = all active; empty Set = none active
  const isActive = (item) => active === null || active.has(item);
  const toggle = useCallback((item) => {
    setActive(prev => {
      const full = new Set(allItems);
      const cur = prev ?? full;
      const next = new Set(cur);
      if (next.has(item)) next.delete(item); else next.add(item);
      return next.size === allItems.length ? null : next;
    });
  }, [allItems]);
  const reset  = useCallback(() => setActive(null), []);
  const clear  = useCallback(() => setActive(new Set()), []);
  return { active, isActive, toggle, reset, clear };
}

// ── Main Component ────────────────────────────────────────────────────────
export default function LineageGraphClient({ nodes = [], edges = [] }) {
  const router = useRouter();

  const allCategories = useMemo(() =>
    [...new Set(nodes.map(n => n.category).filter(Boolean))].sort(), [nodes]);
  const allRels = useMemo(() =>
    [...new Set(edges.map(e => e.relationship_type).filter(Boolean))].sort(), [edges]);

  const categories = useToggleSet(allCategories);
  const rels = useToggleSet(allRels);
  const [search, setSearch] = useState('');

  const layout = useMemo(() => computeLayout(nodes), [nodes]);

  const filteredNodes = useMemo(() => nodes.filter(n =>
    categories.isActive(n.category) &&
    (!search || n.name.toLowerCase().includes(search.toLowerCase()))
  ), [nodes, categories, search]);

  const slugSet = useMemo(() => new Set(filteredNodes.map(n => n.slug)), [filteredNodes]);

  const filteredEdges = useMemo(() => edges.filter(e =>
    slugSet.has(e.source_slug) &&
    slugSet.has(e.target_slug) &&
    rels.isActive(e.relationship_type)
  ), [edges, slugSet, rels]);

  const rfNodes = useMemo(() => filteredNodes.map(n => ({
    id: n.slug,
    type: 'org',
    position: layout[n.slug] || { x: 0, y: 0 },
    data: { name: n.name, tier: n.composite_tier, score: n.composite_score, category: n.category },
  })), [filteredNodes, layout]);

  const rfEdges = useMemo(() => filteredEdges.map((e, i) => {
    const color = chainColor(e.chain_name);
    return {
      id: `${e.source_slug}→${e.target_slug}:${i}`,
      source: e.source_slug,
      target: e.target_slug,
      type: 'labeled',
      data: { label: REL_LABELS[e.relationship_type] || '' },
      style: { stroke: color, strokeWidth: 1.5, opacity: 0.72 },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 10, height: 10 },
    };
  }), [filteredEdges]);

  const onNodeClick = useCallback((_, node) => {
    router.push(`/org/${node.id}`);
  }, [router]);

  const anyFiltered = categories.active || rels.active || search;

  const resetAll = useCallback(() => {
    categories.reset(); rels.reset(); setSearch('');
  }, [categories, rels]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 110px)', background: '#0a0806' }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <div style={{
        width: 232, flexShrink: 0,
        borderRight: '1px solid rgba(212,206,196,0.1)',
        background: 'rgba(14,10,6,0.92)',
        overflowY: 'auto', padding: '0.85rem',
        display: 'flex', flexDirection: 'column', gap: '0.15rem',
      }}>
        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search organizations…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(244,240,232,0.04)',
            border: '1px solid rgba(212,206,196,0.18)',
            color: '#f4f0e8', fontFamily: 'monospace', fontSize: 11,
            padding: '0.4rem 0.6rem', borderRadius: 3,
            marginBottom: '0.75rem', outline: 'none',
          }}
        />

        <Stat label={`${filteredNodes.length} orgs · ${filteredEdges.length} links`} />

        <FilterSection label="Category" onClear={categories.clear} onAll={categories.reset}>
          {allCategories.map(c => (
            <Chip key={c} active={categories.isActive(c)} color={catColor(c)} onClick={() => categories.toggle(c)}>
              {c}
            </Chip>
          ))}
        </FilterSection>

        <FilterSection label="Relationship" onClear={rels.clear} onAll={rels.reset}>
          {allRels.map(r => (
            <Chip key={r} active={rels.isActive(r)} color="rgba(212,206,196,0.55)" onClick={() => rels.toggle(r)}>
              {REL_LABELS[r] || r}
            </Chip>
          ))}
        </FilterSection>

        {anyFiltered && (
          <button onClick={resetAll} style={{
            marginTop: '0.5rem', width: '100%', padding: '0.4rem',
            background: 'rgba(200,168,75,0.07)',
            border: '1px solid rgba(200,168,75,0.28)',
            color: '#c8a84b', fontFamily: 'monospace', fontSize: 10,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', borderRadius: 3,
          }}>Reset filters</button>
        )}

        {/* Tier legend */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(212,206,196,0.1)' }}>
          <Stat label="Tier" />
          {Object.entries(TIER_COLORS).map(([t, c]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />
              <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(212,206,196,0.6)', textTransform: 'uppercase' }}>
                {TIER_LABELS[t]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Graph canvas ─────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.12, maxZoom: 0.9 }}
          minZoom={0.04}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          style={{ background: '#0a0806' }}
        >
          <Background color="rgba(212,206,196,0.05)" gap={36} />
          <MapControls />
          <MiniMap
            style={{
              background: 'rgba(14,10,6,0.92)',
              border: '1px solid rgba(212,206,196,0.14)',
            }}
            nodeColor={n => catColor(n.data?.category)}
            maskColor="rgba(8,6,4,0.72)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

// ── Zoom + directional pad (must live inside ReactFlow context) ───────────
const CTRL_BTN = {
  width: 28, height: 28,
  background: 'rgba(14,10,6,0.92)',
  border: '1px solid rgba(212,206,196,0.14)',
  color: 'rgba(212,206,196,0.72)',
  cursor: 'pointer', borderRadius: 3,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 14, fontFamily: 'monospace', lineHeight: 1,
  padding: 0,
};

function MapControls() {
  const { zoomIn, zoomOut, fitView, panBy } = useReactFlow();
  const PAN = 160;
  const b = (label, action, title) => (
    <button title={title} onClick={action} style={CTRL_BTN}>{label}</button>
  );
  return (
    <Panel position="bottom-left" style={{ marginBottom: 8, marginLeft: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Zoom row */}
      <div style={{ display: 'flex', gap: 2 }}>
        {b('+', () => zoomIn({ duration: 200 }), 'Zoom in')}
        {b('−', () => zoomOut({ duration: 200 }), 'Zoom out')}
        {b('⊡', () => fitView({ padding: 0.12, duration: 300 }), 'Fit view')}
      </div>
      {/* Directional pad */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 28px 28px', gap: 2 }}>
        <span />{b('↑', () => panBy({ x: 0, y: PAN }), 'Pan up')}<span />
        {b('←', () => panBy({ x: PAN, y: 0 }), 'Pan left')}
        {b('↓', () => panBy({ x: 0, y: -PAN }), 'Pan down')}
        {b('→', () => panBy({ x: -PAN, y: 0 }), 'Pan right')}
      </div>
    </Panel>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────
function FilterSection({ label, children, onClear, onAll }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span style={{
          fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'rgba(212,206,196,0.35)',
        }}>{label}</span>
        {onClear && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onClear} style={{
              background: 'none', border: 'none', padding: 0,
              fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'rgba(212,206,196,0.28)',
              cursor: 'pointer',
            }}>none</button>
            <button onClick={onAll} style={{
              background: 'none', border: 'none', padding: 0,
              fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'rgba(212,206,196,0.28)',
              cursor: 'pointer',
            }}>all</button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {children}
      </div>
    </div>
  );
}

function Chip({ active, color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'flex-start', gap: 6,
      background: 'transparent', border: 'none', padding: '2px 0',
      cursor: 'pointer', textAlign: 'left', opacity: active ? 1 : 0.28,
      transition: 'opacity 0.12s',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: 2, background: color,
        flexShrink: 0, marginTop: 2,
      }} />
      <span style={{
        fontFamily: 'monospace', fontSize: 10,
        color: 'rgba(212,206,196,0.82)', lineHeight: 1.35,
      }}>{children}</span>
    </button>
  );
}

function Stat({ label }) {
  return (
    <div style={{
      fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'rgba(212,206,196,0.3)',
      marginBottom: '0.75rem',
    }}>{label}</div>
  );
}
