'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const TIER_COLORS = {
  'Cult':          '#c02020',
  'Cult Dynamics': '#cb4b16',
  'High Control':  '#b58900',
  'Concerning':    '#6c71c4',
  'Mildly Culty':  '#2aa198',
  'Healthy Group': '#859900',
};
const TIERS = ['Cult','Cult Dynamics','High Control','Concerning','Mildly Culty','Healthy Group'];
const SIZE_RADIUS = { micro:5, small:7, medium:10, large:14, mass:20 };

// CARTO dark basemap — no API key required
const MAP_STYLE = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 512,
      attribution: '© OpenStreetMap contributors © CARTO',
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#1a1410' } },
    { id: 'basemap',    type: 'raster',     source: 'carto-dark', paint: { 'raster-opacity': 0.88 } },
  ],
};

function scoreToFill(score) {
  if (score === null) return 'rgba(212,206,196,0.04)';
  if (score >= 70) return 'rgba(192,32,32,0.55)';
  if (score >= 55) return 'rgba(181,137,0,0.50)';
  if (score >= 41) return 'rgba(108,113,196,0.45)';
  if (score >= 21) return 'rgba(42,161,152,0.35)';
  return 'rgba(133,153,0,0.30)';
}

export default function MapClient({ orgs=[], stateStats=[], foundingData=[], withGeo=0 }) {
  const mapContainer = useRef(null);
  const mapRef       = useRef(null);
  const [mapLoaded,    setMapLoaded]    = useState(false);
  const [mapError,     setMapError]     = useState(null);
  const [tierFilter,   setTierFilter]   = useState([]);
  const [sizeMode,     setSizeMode]     = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [layer,        setLayer]        = useState('hq');
  const [selected,     setSelected]     = useState(null);
  const [hoveredState, setHoveredState] = useState(null);

  const total     = orgs.length;
  const pctMapped = total > 0 ? Math.round(withGeo / total * 100) : 0;

  const stateStatsMap = useMemo(() => {
    const m = {};
    stateStats.forEach(s => { m[s.hq_state] = s; });
    return m;
  }, [stateStats]);

  const orgGeojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: orgs
      .filter(o => o.hq_lat && o.hq_lng)
      .filter(o => !tierFilter.length || tierFilter.includes(o.composite_tier))
      .map((o, i) => ({
        type: 'Feature',
        id: i,
        geometry: { type: 'Point', coordinates: [parseFloat(o.hq_lng), parseFloat(o.hq_lat)] },
        properties: {
          id: o.id, name: o.name, slug: o.slug, category: o.category,
          composite_score: parseFloat(o.composite_score || 0),
          composite_tier: o.composite_tier || 'Healthy Group',
          trajectory: o.trajectory, hq_city: o.hq_city, hq_state: o.hq_state,
          size_tier: o.size_tier,
          membership_count: o.membership_count,
          color: TIER_COLORS[o.composite_tier] || '#888',
          radius: SIZE_RADIUS[o.size_tier] || 7,
        },
      })),
  }), [orgs, tierFilter]);

  const foundingGeojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: foundingData
      .filter(f => f.lat && f.lng)
      .map((f, i) => ({
        type: 'Feature',
        id: i,
        geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
        properties: {
          city: f.city, state: f.state, count: f.count,
          avg_score: f.avg_score,
          high_control_count: f.high_control_count,
          radius: Math.max(8, Math.min(40, f.count * 2.5)),
          fill: scoreToFill(f.avg_score),
        },
      })),
  }), [foundingData]);

  // Init map once on mount
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let map;
    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: [-96, 38],
        zoom: 3.8,
        minZoom: 2,
        maxZoom: 16,
        attributionControl: false,
      });
    } catch (err) {
      setMapError(`Map init failed: ${err.message}`);
      return;
    }

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('error', e => setMapError(e.error?.message || 'Map error'));

    map.on('load', () => {
      // State choropleth
      map.addSource('states', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'state-fill', type: 'fill', source: 'states',
        layout: { visibility: 'none' },
        paint: { 'fill-color': ['get','fill'], 'fill-opacity': ['case',['boolean',['feature-state','hovered'],false],0.85,1] } });
      map.addLayer({ id: 'state-border', type: 'line', source: 'states',
        layout: { visibility: 'none' },
        paint: { 'line-color':'rgba(212,206,196,0.15)', 'line-width':0.5 } });

      // Org dots
      map.addSource('orgs', { type:'geojson', data:{ type:'FeatureCollection', features:[] },
        cluster:true, clusterMaxZoom:8, clusterRadius:40 });
      map.addLayer({ id:'clusters', type:'circle', source:'orgs', filter:['has','point_count'],
        layout:{ visibility:'visible' },
        paint:{ 'circle-color':'rgba(200,168,75,0.75)',
          'circle-radius':['step',['get','point_count'],14,10,20,50,28],
          'circle-stroke-width':1, 'circle-stroke-color':'rgba(200,168,75,0.4)' } });
      map.addLayer({ id:'cluster-count', type:'symbol', source:'orgs', filter:['has','point_count'],
        layout:{ visibility:'visible', 'text-field':'{point_count_abbreviated}',
          'text-font':['Open Sans Bold'], 'text-size':11 },
        paint:{ 'text-color':'#1a1410' } });
      map.addLayer({ id:'org-dots', type:'circle', source:'orgs', filter:['!',['has','point_count']],
        layout:{ visibility:'visible' },
        paint:{
          'circle-color':['get','color'],
          'circle-radius':['case',
            ['boolean',['feature-state','selected'],false],['*',['get','radius'],1.6],
            ['boolean',['feature-state','hovered'],false], ['*',['get','radius'],1.3],
            ['get','radius']],
          'circle-opacity':['case',
            ['boolean',['feature-state','selected'],false],1,
            ['boolean',['feature-state','hovered'],false],0.95,0.82],
          'circle-stroke-width':['case',['boolean',['feature-state','selected'],false],2,0.5],
          'circle-stroke-color':['case',['boolean',['feature-state','selected'],false],'rgba(200,168,75,0.9)','rgba(0,0,0,0.3)'],
          'circle-blur':0.1,
        } });

      // Founding city bubbles
      map.addSource('founding', { type:'geojson', data:{ type:'FeatureCollection', features:[] } });
      map.addLayer({ id:'founding-bubbles', type:'circle', source:'founding',
        layout:{ visibility:'none' },
        paint:{ 'circle-color':['get','fill'], 'circle-radius':['get','radius'],
          'circle-opacity':0.78, 'circle-stroke-width':1, 'circle-stroke-color':'rgba(212,206,196,0.3)' } });
      map.addLayer({ id:'founding-labels', type:'symbol', source:'founding',
        layout:{ visibility:'none',
          'text-field':['concat',['get','city'],'\n',['to-string',['get','count']]],
          'text-font':['Open Sans Regular'], 'text-size':10, 'text-anchor':'center' },
        paint:{ 'text-color':'rgba(244,240,232,0.85)', 'text-halo-color':'rgba(0,0,0,0.5)', 'text-halo-width':1 } });

      // Interactions
      let _hovDot = null;
      map.on('mousemove','org-dots', e => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features[0];
        if (f) {
          if (_hovDot !== null) map.setFeatureState({ source:'orgs', id:_hovDot }, { hovered:false });
          map.setFeatureState({ source:'orgs', id:f.id }, { hovered:true });
          _hovDot = f.id;
        }
      });
      map.on('mouseleave','org-dots', () => {
        map.getCanvas().style.cursor = '';
        if (_hovDot !== null) map.setFeatureState({ source:'orgs', id:_hovDot }, { hovered:false });
        _hovDot = null;
      });
      map.on('click','org-dots', e => {
        const p = e.features[0]?.properties;
        if (p) setSelected({ type:'org', ...p });
      });
      map.on('click','clusters', e => {
        const f = e.features[0];
        map.getSource('orgs').getClusterExpansionZoom(f.properties.cluster_id, (err, zoom) => {
          if (!err) map.easeTo({ center:f.geometry.coordinates, zoom:zoom+0.5 });
        });
      });
      map.on('mouseenter','clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave','clusters', () => { map.getCanvas().style.cursor = ''; });

      let _hovState = null;
      map.on('mousemove','state-fill', e => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features[0];
        if (f) {
          if (_hovState) map.setFeatureState({ source:'states', id:_hovState }, { hovered:false });
          map.setFeatureState({ source:'states', id:f.id }, { hovered:true });
          _hovState = f.id;
          setHoveredState(f.properties);
        }
      });
      map.on('mouseleave','state-fill', () => {
        map.getCanvas().style.cursor = '';
        if (_hovState) map.setFeatureState({ source:'states', id:_hovState }, { hovered:false });
        _hovState = null;
        setHoveredState(null);
      });
      map.on('click','state-fill', e => {
        const abbr = e.features[0]?.properties?.abbr;
        if (abbr) setSelected({ type:'state', abbr });
      });
      map.on('click','founding-bubbles', e => {
        const p = e.features[0]?.properties;
        if (p) setSelected({ type:'founding', ...p });
      });
      map.on('mouseenter','founding-bubbles', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave','founding-bubbles', () => { map.getCanvas().style.cursor = ''; });
      map.on('click', e => {
        const hits = map.queryRenderedFeatures(e.point, { layers:['org-dots','clusters','state-fill','founding-bubbles'] });
        if (!hits.length) setSelected(null);
      });

      mapRef.current = map;
      setMapLoaded(true);
    });

    return () => { if (map) { map.remove(); mapRef.current = null; } };
  }, []);

  // Sync data & layer visibility whenever deps change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const isHQ = layer === 'hq';
    const isChoropleth = layer === 'choropleth';
    const isFounding = layer === 'founding';

    const src = map.getSource('orgs');
    if (src) src.setData(orgGeojson);

    const fSrc = map.getSource('founding');
    if (fSrc) fSrc.setData(foundingGeojson);

    const sSrc = map.getSource('states');
    if (sSrc) {
      fetch('/us-states.json')
        .then(r => r.json())
        .then(geojson => {
          geojson.features.forEach(f => {
            const abbr = f.properties.abbr;
            const stats = stateStatsMap[abbr];
            f.id = abbr;
            f.properties.fill = stats ? scoreToFill(parseFloat(stats.avg_score)) : 'rgba(212,206,196,0.04)';
            f.properties.avg_score = stats?.avg_score ?? null;
            f.properties.total = stats?.total ?? 0;
          });
          sSrc.setData(geojson);
        })
        .catch(() => {});
    }

    const setVis = (id, vis) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis ? 'visible' : 'none');
    };
    setVis('org-dots',        isHQ);
    setVis('clusters',        isHQ && showClusters);
    setVis('cluster-count',   isHQ && showClusters);
    setVis('state-fill',      isChoropleth);
    setVis('state-border',    isChoropleth);
    setVis('founding-bubbles', isFounding);
    setVis('founding-labels', isFounding);

    if (map.getLayer('org-dots')) {
      map.setPaintProperty('org-dots', 'circle-radius', [
        'case',
        ['boolean',['feature-state','selected'],false], ['*', sizeMode ? ['get','radius'] : 7, 1.6],
        ['boolean',['feature-state','hovered'],false],  ['*', sizeMode ? ['get','radius'] : 7, 1.3],
        sizeMode ? ['get','radius'] : 7,
      ]);
    }
  }, [orgGeojson, foundingGeojson, mapLoaded, layer, showClusters, sizeMode, stateStatsMap]);

  const toggle = (val, state, setter) =>
    setter(state.includes(val) ? state.filter(v => v !== val) : [...state, val]);

  const filteredCount = orgGeojson.features.length;
  const selectedStateStats = selected?.type === 'state' ? stateStatsMap[selected.abbr] : null;

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>

      {/* Sticky header */}
      <div style={{ borderBottom:'1px solid rgba(212,206,196,0.1)', padding:'1.25rem 0 0.9rem',
        background:'var(--ink)', position:'sticky', top:'60px', zIndex:50 }}>
        <div className="container--wide">
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between',
            flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.75rem' }}>
            <div>
              <span style={{ fontFamily:'var(--mono)', fontSize:'0.6rem', letterSpacing:'0.15em',
                textTransform:'uppercase', color:'var(--gold)' }}>
                <Link href="/explore" style={{ color:'var(--gold)' }}>Explorer</Link>{' '}—{' '}
                <Link href="/compass" style={{ color:'var(--gold)' }}>Compass</Link> —
              </span>
              <h1 style={{ fontFamily:'var(--serif)', fontSize:'clamp(1.2rem,2.5vw,1.8rem)',
                color:'var(--paper)', display:'inline', marginLeft:'0.4rem' }}>
                Geographic Map
              </h1>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <span style={{ fontFamily:'var(--mono)', fontSize:'0.68rem', color:'var(--gold)' }}>
                {filteredCount} <span style={{ color:'var(--muted)' }}>/ {withGeo}</span>
              </span>
              <div style={{ width:50, height:3, background:'rgba(212,206,196,0.1)', borderRadius:2 }}>
                <div style={{ width:`${pctMapped}%`, height:'100%', background:'var(--gold)', borderRadius:2, opacity:0.7 }} />
              </div>
              <span style={{ fontFamily:'var(--mono)', fontSize:'0.62rem', color:'var(--muted)' }}>{pctMapped}%</span>
            </div>
          </div>

          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center' }}>
            {[
              { id:'hq',         label:'HQ Locations' },
              { id:'choropleth', label:'State Avg Score' },
              { id:'founding',   label:'Founding Cities' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => { setLayer(id); setSelected(null); }}
                style={{ fontFamily:'var(--mono)', fontSize:'0.62rem', padding:'0.3rem 0.65rem',
                  background: layer===id ? 'rgba(200,168,75,0.15)' : 'transparent',
                  border:`1px solid ${layer===id ? 'rgba(200,168,75,0.6)' : 'rgba(212,206,196,0.2)'}`,
                  color: layer===id ? 'var(--gold)' : 'var(--muted)', cursor:'pointer',
                  letterSpacing:'0.06em', textTransform:'uppercase' }}>
                {label}
              </button>
            ))}

            {layer === 'hq' && <>
              <div style={{ width:1, height:20, background:'rgba(212,206,196,0.1)' }} />
              {TIERS.map(t => (
                <button key={t} onClick={() => toggle(t, tierFilter, setTierFilter)}
                  style={{ fontFamily:'var(--mono)', fontSize:'0.56rem', padding:'0.18rem 0.45rem',
                    background: tierFilter.includes(t) ? `${TIER_COLORS[t]}22` : 'transparent',
                    border:`1px solid ${tierFilter.includes(t) ? TIER_COLORS[t] : 'rgba(212,206,196,0.12)'}`,
                    color: tierFilter.includes(t) ? TIER_COLORS[t] : 'var(--muted)', cursor:'pointer' }}>
                  {t}
                </button>
              ))}
              <div style={{ width:1, height:20, background:'rgba(212,206,196,0.1)' }} />
              <label style={{ display:'flex', alignItems:'center', gap:'0.3rem', cursor:'pointer' }}>
                <input type="checkbox" checked={sizeMode} onChange={e => setSizeMode(e.target.checked)}
                  style={{ accentColor:'var(--gold)', width:11, height:11 }} />
                <span style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', color:'var(--muted)' }}>Scale by size</span>
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:'0.3rem', cursor:'pointer' }}>
                <input type="checkbox" checked={showClusters} onChange={e => setShowClusters(e.target.checked)}
                  style={{ accentColor:'var(--gold)', width:11, height:11 }} />
                <span style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', color:'var(--muted)' }}>Cluster</span>
              </label>
              {tierFilter.length > 0 && (
                <button onClick={() => setTierFilter([])}
                  style={{ fontFamily:'var(--mono)', fontSize:'0.56rem', padding:'0.18rem 0.45rem',
                    background:'transparent', border:'1px solid rgba(212,206,196,0.2)',
                    color:'var(--muted)', cursor:'pointer' }}>
                  Clear
                </button>
              )}
            </>}
          </div>
        </div>
      </div>

      {/* Map + sidebar */}
      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 290px' : '1fr', flex:1, minHeight:520 }}>
        <div style={{ position:'relative' }}>
          {mapError ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              height:'100%', minHeight:520, background:'rgba(244,240,232,0.015)', gap:'1rem' }}>
              <p style={{ fontFamily:'var(--mono)', fontSize:'0.8rem', color:'var(--muted)' }}>
                Map failed to load
              </p>
              <p style={{ fontFamily:'var(--mono)', fontSize:'0.65rem', color:'rgba(212,206,196,0.3)' }}>
                {mapError}
              </p>
            </div>
          ) : (
            <>
              <div ref={mapContainer} style={{ width:'100%', height:'100%', minHeight:520 }} />
              {!mapLoaded && (
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
                  justifyContent:'center', background:'rgba(18,14,10,0.85)', zIndex:10 }}>
                  <span style={{ fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--gold)', letterSpacing:'0.2em' }}>
                    LOADING MAP…
                  </span>
                </div>
              )}
            </>
          )}

          {layer === 'choropleth' && hoveredState && (
            <div style={{ position:'absolute', bottom:24, left:16, background:'rgba(18,14,10,0.95)',
              border:'1px solid rgba(200,168,75,0.4)', padding:'0.75rem 1rem',
              fontFamily:'var(--mono)', pointerEvents:'none', zIndex:20 }}>
              <div style={{ fontSize:'0.75rem', color:'var(--paper)', fontWeight:700, marginBottom:'0.3rem' }}>
                {hoveredState.name} ({hoveredState.abbr})
              </div>
              <div style={{ fontSize:'0.65rem', color:'var(--gold)' }}>Avg score: {hoveredState.avg_score ?? '—'}%</div>
              <div style={{ fontSize:'0.62rem', color:'var(--muted)' }}>{hoveredState.total ?? 0} organizations</div>
            </div>
          )}
        </div>

        {/* Detail sidebar */}
        {selected && (
          <div style={{ background:'var(--ink)', borderLeft:'1px solid rgba(212,206,196,0.1)',
            padding:'1.5rem', overflowY:'auto', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <span style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', letterSpacing:'0.15em',
                textTransform:'uppercase', color:'var(--gold)' }}>
                {selected.type === 'org' ? 'Organization' : selected.type === 'state' ? 'State Summary' : 'Founding City'}
              </span>
              <button onClick={() => setSelected(null)}
                style={{ background:'transparent', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'1rem' }}>✕</button>
            </div>

            {selected.type === 'org' && <>
              <div>
                <p style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', color:'var(--muted)', marginBottom:'0.25rem' }}>{selected.category}</p>
                <h2 style={{ fontFamily:'var(--serif)', fontSize:'1.05rem', fontWeight:700, color:'var(--paper)', lineHeight:1.2 }}>{selected.name}</h2>
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', padding:'0.35rem 0.65rem',
                background:`${TIER_COLORS[selected.composite_tier]||'#888'}18`,
                border:`1px solid ${TIER_COLORS[selected.composite_tier]||'#888'}40` }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:TIER_COLORS[selected.composite_tier]||'#888' }} />
                <span style={{ fontFamily:'var(--mono)', fontSize:'0.62rem', color:TIER_COLORS[selected.composite_tier]||'#888', textTransform:'uppercase' }}>{selected.composite_tier}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:'0.7rem', color:'var(--paper)', fontWeight:700 }}>{parseFloat(selected.composite_score).toFixed(0)}%</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem' }}>
                {[
                  ['HQ', `${selected.hq_city||'—'}${selected.hq_state ? `, ${selected.hq_state}` : ''}`],
                  ['Trajectory', selected.trajectory||'—'],
                  ['Size', selected.size_tier||'—'],
                  ['Members', selected.membership_count ? Number(selected.membership_count).toLocaleString() : '—'],
                ].map(([k,v]) => (
                  <div key={k} style={{ padding:'0.5rem', background:'rgba(244,240,232,0.03)', border:'1px solid rgba(212,206,196,0.08)' }}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:'0.52rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)', marginBottom:'0.15rem' }}>{k}</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:'0.7rem', color:'var(--gold)' }}>{v}</div>
                  </div>
                ))}
              </div>
              {selected.slug && (
                <a href={`/org/${selected.slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', textAlign:'center', padding:'0.55rem',
                    background:'rgba(200,168,75,0.08)', border:'1px solid rgba(200,168,75,0.3)',
                    color:'var(--gold)', fontFamily:'var(--mono)', fontSize:'0.65rem',
                    letterSpacing:'0.1em', textTransform:'uppercase', textDecoration:'none' }}>
                  Full Assessment →
                </a>
              )}
            </>}

            {selected.type === 'state' && selectedStateStats && <>
              <h2 style={{ fontFamily:'var(--serif)', fontSize:'1.2rem', fontWeight:700, color:'var(--paper)' }}>
                {selected.abbr}
              </h2>
              <div style={{ padding:'0.75rem', background:'rgba(244,240,232,0.03)', border:'1px solid rgba(212,206,196,0.08)' }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:'0.55rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)', marginBottom:'0.4rem' }}>Avg Composite Score</div>
                <div style={{ fontFamily:'var(--serif)', fontSize:'2rem', fontWeight:700, lineHeight:1,
                  color: scoreToFill(selectedStateStats.avg_score).replace('rgba','rgb').replace(/,[\d.]+\)/,')') }}>
                  {selectedStateStats.avg_score}%
                </div>
                <div style={{ fontFamily:'var(--mono)', fontSize:'0.62rem', color:'var(--muted)', marginTop:'0.3rem' }}>{selectedStateStats.total} organizations</div>
              </div>
              <div style={{ display:'grid', gap:'2px' }}>
                {[
                  ['Cult', selectedStateStats.cult, '#c02020'],
                  ['Cult Dynamics', selectedStateStats.cult_dynamics, '#cb4b16'],
                  ['High Control', selectedStateStats.high_control, '#b58900'],
                  ['Concerning', selectedStateStats.concerning, '#6c71c4'],
                  ['Mildly Culty', selectedStateStats.mildly_culty, '#2aa198'],
                  ['Healthy Group', selectedStateStats.healthy_group, '#859900'],
                ].filter(([,v]) => v > 0).map(([label, count, color]) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.3rem 0.5rem', background:'rgba(244,240,232,0.02)' }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }} />
                    <span style={{ fontFamily:'var(--mono)', fontSize:'0.62rem', color:'var(--muted)', flex:1 }}>{label}</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:'0.65rem', color:'var(--gold)' }}>{count}</span>
                  </div>
                ))}
              </div>
            </>}

            {selected.type === 'founding' && <>
              <div>
                <h2 style={{ fontFamily:'var(--serif)', fontSize:'1.1rem', fontWeight:700, color:'var(--paper)', marginBottom:'0.2rem' }}>
                  {selected.city}, {selected.state}
                </h2>
                <p style={{ fontFamily:'var(--mono)', fontSize:'0.62rem', color:'var(--muted)' }}>Founding city</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem' }}>
                {[
                  ['Orgs Founded', selected.count],
                  ['Avg Score', `${selected.avg_score}%`],
                  ['Cult / CD', selected.high_control_count],
                ].map(([k,v]) => (
                  <div key={k} style={{ padding:'0.5rem', background:'rgba(244,240,232,0.03)', border:'1px solid rgba(212,206,196,0.08)' }}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:'0.52rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)', marginBottom:'0.15rem' }}>{k}</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--gold)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </>}
          </div>
        )}
      </div>

      {/* Legend strip */}
      <div style={{ borderTop:'1px solid rgba(212,206,196,0.08)', padding:'0.75rem 0', background:'rgba(244,240,232,0.01)' }}>
        <div className="container--wide">
          <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
            {layer === 'hq' && TIERS.map(t => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:TIER_COLORS[t] }} />
                <span style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', color:'rgba(212,206,196,0.45)' }}>
                  {t} ({orgGeojson.features.filter(f => f.properties.composite_tier === t).length})
                </span>
              </div>
            ))}
            {layer === 'choropleth' && <>
              {[['≥ 70%','#c02020'],['55–70%','#b58900'],['41–55%','#6c71c4'],
                ['21–40%','#2aa198'],['0–20%','#859900'],['No data','rgba(212,206,196,0.2)'],
              ].map(([label, color]) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                  <div style={{ width:12, height:12, background:color }} />
                  <span style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', color:'rgba(212,206,196,0.45)' }}>{label}</span>
                </div>
              ))}
            </>}
            {layer === 'founding' && (
              <span style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', color:'rgba(212,206,196,0.45)' }}>
                Bubble size = orgs founded · Color = avg score
              </span>
            )}
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.56rem', color:'rgba(212,206,196,0.25)', marginLeft:'auto' }}>
              Scroll to zoom · drag to pan · click to select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
