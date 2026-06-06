'use client';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const TIER_COLORS = {
  'Super Culty':   '#e8574d',
  'Kinda Culty':   '#d99b3e',
  'Not Culty':     '#5cb878',
};
const TIERS = ['Super Culty','Kinda Culty','Not Culty'];
const SIZE_RADIUS = { micro:5, small:7, medium:10, large:14, mass:20 };

const CHAIN_COLORS = {
  'White supremacist formations':         '#e8574d',
  'Religious-political-media formations': '#d99b3e',
  'High-control religious formations':    '#e8703a',
  'Surveillance infrastructure formation':'#8f93e0',
};

const QUADRANTS = ['Authoritarian Right','Authoritarian Left','Libertarian Right','Libertarian Left'];

// Free, token-free VECTOR basemap (CARTO "dark-matter" GL style, OpenMapTiles
// schema, © OpenStreetMap / © CARTO). Upgraded from CARTO raster tiles for
// crisp retina labels and restylable vector layers. Data layers (states, chains,
// orgs, founding) are appended on top in map.on('load') and don't depend on the
// basemap, so this is a drop-in swap.
// Revert: replace this URL with the previous inline raster style object using
// 'https://{a|b}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'.
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

function scoreToFill(score) {
  if (score === null) return 'rgba(212,206,196,0.04)';
  if (score >= 70) return 'rgba(232,87,77,0.55)';
  if (score >= 55) return 'rgba(217,155,62,0.50)';
  if (score >= 41) return 'rgba(140,150,235,0.45)';
  if (score >= 21) return 'rgba(80,200,190,0.35)';
  return 'rgba(92,184,120,0.30)';
}

export default function MapClient({ orgs=[], stateStats=[], foundingData=[], withGeo=0, lineageEdges=[] }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const mapContainer = useRef(null);
  const mapRef       = useRef(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [mapLoaded,      setMapLoaded]      = useState(false);
  const [mapError,       setMapError]       = useState(null);
  const [tierFilter,     setTierFilter]     = useState([]);
  const [quadrantFilter, setQuadrantFilter] = useState([]);
  const [sizeMode,       setSizeMode]       = useState(true);
  const [showClusters,   setShowClusters]   = useState(true);
  const [showChains,     setShowChains]     = useState(false);
  const [chainFilter,    setChainFilter]    = useState(null);
  const [layer,          setLayer]          = useState('hq');
  const [selected,       setSelected]       = useState(null);
  const [hoveredState,   setHoveredState]   = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchOpen,     setSearchOpen]     = useState(false);
  const searchRef        = useRef(null);

  const total     = orgs.length;
  const pctMapped = total > 0 ? Math.round(withGeo / total * 100) : 0;

  // ── URL state sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    const slug = searchParams.get('org');
    if (slug && orgs.length) {
      const org = orgs.find(o => o.slug === slug);
      if (org) setSelected({ type:'org', ...org, composite_score: parseFloat(org.composite_score||0) });
    }
  }, [searchParams, orgs]);

  function selectOrg(org) {
    setSelected({ type:'org', ...org, composite_score: parseFloat(org.composite_score||0) });
    const params = new URLSearchParams(searchParams.toString());
    if (org.slug) params.set('org', org.slug);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function clearSelected() {
    setSelected(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('org');
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // ── Slug → coord lookup ────────────────────────────────────────────────────
  const slugCoords = useMemo(() => {
    const m = {};
    orgs.forEach(o => {
      if (o.hq_lat && o.hq_lng && o.slug) m[o.slug] = [parseFloat(o.hq_lng), parseFloat(o.hq_lat)];
    });
    return m;
  }, [orgs]);

  // ── Search results ─────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return orgs
      .filter(o => o.name?.toLowerCase().includes(q) || o.category?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery, orgs]);

  // ── GeoJSON ────────────────────────────────────────────────────────────────
  const orgGeojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: orgs
      .filter(o => o.hq_lat && o.hq_lng)
      .filter(o => !tierFilter.length     || tierFilter.includes(o.composite_tier))
      .filter(o => !quadrantFilter.length || quadrantFilter.includes(o.quadrant))
      .map((o, i) => ({
        type: 'Feature',
        id: i,
        geometry: { type: 'Point', coordinates: [parseFloat(o.hq_lng), parseFloat(o.hq_lat)] },
        properties: {
          id: o.id, name: o.name, slug: o.slug, category: o.category,
          composite_score: parseFloat(o.composite_score || 0),
          composite_tier:  o.composite_tier || 'Not Culty',
          trajectory:      o.trajectory,
          hq_city: o.hq_city, hq_state: o.hq_state,
          size_tier: o.size_tier, membership_count: o.membership_count,
          econ: o.econ ?? null, auth: o.auth ?? null, quadrant: o.quadrant ?? null,
          color:  TIER_COLORS[o.composite_tier] || '#888',
          radius: SIZE_RADIUS[o.size_tier] || 7,
          escalating: o.trajectory === 'Escalating' ? 1 : 0,
        },
      })),
  }), [orgs, tierFilter, quadrantFilter]);

  const foundingGeojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: foundingData.filter(f => f.lat && f.lng).map((f, i) => ({
      type: 'Feature', id: i,
      geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
      properties: {
        city: f.city, state: f.state, count: f.count,
        avg_score: f.avg_score, high_control_count: f.high_control_count,
        radius: Math.max(8, Math.min(40, f.count * 2.5)),
        fill: scoreToFill(f.avg_score),
      },
    })),
  }), [foundingData]);

  // Chain lines GeoJSON — only orgs with coords on both ends
  const chainGeojson = useMemo(() => {
    const filteredEdges = chainFilter
      ? lineageEdges.filter(e => e.chain_name === chainFilter)
      : lineageEdges;
    return {
      type: 'FeatureCollection',
      features: filteredEdges
        .filter(e => slugCoords[e.source_slug] && slugCoords[e.target_slug])
        .map((e, i) => ({
          type: 'Feature', id: i,
          geometry: {
            type: 'LineString',
            coordinates: [slugCoords[e.source_slug], slugCoords[e.target_slug]],
          },
          properties: {
            chain: e.chain_name,
            rel:   e.relationship_type,
            color: CHAIN_COLORS[e.chain_name] || '#888',
          },
        })),
    };
  }, [lineageEdges, slugCoords, chainFilter]);

  const stateStatsMap = useMemo(() => {
    const m = {};
    stateStats.forEach(s => { m[s.hq_state] = s; });
    return m;
  }, [stateStats]);

  // ── Fly to org ─────────────────────────────────────────────────────────────
  function flyToOrg(org) {
    const map = mapRef.current;
    if (!map || !org.hq_lat || !org.hq_lng) return;
    map.flyTo({
      center: [parseFloat(org.hq_lng), parseFloat(org.hq_lat)],
      zoom: 9,
      duration: 1200,
      essential: true,
    });
  }

  function handleSearchSelect(org) {
    setSearchQuery('');
    setSearchOpen(false);
    selectOrg(org);
    flyToOrg(org);
  }

  // ── Init map ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    let map;
    import('maplibre-gl').then(({ default: maplibregl }) => {
      if (!document.getElementById('maplibre-css')) {
        const link = document.createElement('link');
        link.id = 'maplibre-css'; link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.css';
        document.head.appendChild(link);
      }
      try {
        map = new maplibregl.Map({
          container: mapContainer.current,
          style: MAP_STYLE,
          center: [-96, 38], zoom: 3.8, minZoom: 2, maxZoom: 16,
          attributionControl: false,
        });
      } catch (err) {
        setMapError(`Map init failed: ${err.message}`);
        return;
      }

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

      map.on('error', e => {
        const msg = e.error?.message || '';
        if (msg.includes('WebGL') || msg.includes('canvas') || msg.includes('context')) {
          setMapError('WebGL not available in this browser');
        }
      });

      map.on('load', () => {
        // Keep the warm brand background tone under the vector basemap.
        if (map.getLayer('background')) {
          map.setPaintProperty('background', 'background-color', '#1a1410');
        }
        // ── State choropleth ──
        map.addSource('states', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'state-fill', type: 'fill', source: 'states',
          layout: { visibility: 'none' },
          paint: { 'fill-color': ['get','fill'], 'fill-opacity': ['case',['boolean',['feature-state','hovered'],false],0.85,1] } });
        map.addLayer({ id: 'state-border', type: 'line', source: 'states',
          layout: { visibility: 'none' },
          paint: { 'line-color':'rgba(212,206,196,0.15)', 'line-width':0.5 } });

        // ── Chain overlay lines ──
        map.addSource('chains', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'chain-lines', type: 'line', source: 'chains',
          layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 1.5,
            'line-opacity': 0.65,
            'line-dasharray': [2, 3],
          } });
        map.addLayer({ id: 'chain-lines-glow', type: 'line', source: 'chains',
          layout: { visibility: 'none', 'line-cap': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 4,
            'line-opacity': 0.12,
            'line-blur': 3,
          } });

        // ── Org dots ──
        map.addSource('orgs', { type:'geojson', data:{ type:'FeatureCollection', features:[] },
          cluster:true, clusterMaxZoom:8, clusterRadius:40 });

        // Escalating pulse rings
        map.addLayer({ id:'escalating-pulse', type:'circle', source:'orgs',
          filter: ['all', ['!',['has','point_count']], ['==',['get','escalating'],1]],
          layout: { visibility:'visible' },
          paint: {
            'circle-color': 'transparent',
            'circle-radius': ['interpolate',['linear'],['get','radius'], 5,14, 20,26],
            'circle-stroke-width': 1.5,
            'circle-stroke-color': ['get','color'],
            'circle-stroke-opacity': 0.5,
          } });

        map.addLayer({ id:'clusters', type:'circle', source:'orgs', filter:['has','point_count'],
          layout:{ visibility:'visible' },
          paint:{
            'circle-color':'rgba(200,168,75,0.75)',
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
            'circle-stroke-width':['case',['boolean',['feature-state','selected'],false],2.5,0.5],
            'circle-stroke-color':['case',['boolean',['feature-state','selected'],false],'rgba(200,168,75,0.9)','rgba(0,0,0,0.3)'],
            'circle-blur':0.1,
          } });

        // ── Founding city bubbles ──
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

        // ── Interactions ──
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
          if (p) {
            const full = orgs.find(o => o.slug === p.slug) || p;
            selectOrg({ ...full, ...p });
          }
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
          _hovState = null; setHoveredState(null);
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
          if (!hits.length) clearSelected();
        });

        mapRef.current = map;
        setMapLoaded(true);
      });

      return () => { if (map) { map.remove(); mapRef.current = null; } };
    }).catch(err => setMapError('Failed to load map library: ' + err.message));
  }, []);

  // ── Sync data & visibility ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const isHQ         = layer === 'hq';
    const isChoropleth = layer === 'choropleth';
    const isFounding   = layer === 'founding';

    map.getSource('orgs')?.setData(orgGeojson);
    map.getSource('founding')?.setData(foundingGeojson);
    map.getSource('chains')?.setData(chainGeojson);

    const sSrc = map.getSource('states');
    if (sSrc) {
      fetch('/us-states.json').then(r => r.json()).then(geojson => {
        geojson.features.forEach(f => {
          const stats = stateStatsMap[f.properties.abbr];
          f.id = f.properties.abbr;
          f.properties.fill = stats ? scoreToFill(parseFloat(stats.avg_score)) : 'rgba(212,206,196,0.04)';
          f.properties.avg_score = stats?.avg_score ?? null;
          f.properties.total = stats?.total ?? 0;
        });
        sSrc.setData(geojson);
      }).catch(() => {});
    }

    const setVis = (id, vis) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis ? 'visible' : 'none');
    };
    setVis('org-dots',          isHQ);
    setVis('clusters',          isHQ && showClusters);
    setVis('cluster-count',     isHQ && showClusters);
    setVis('escalating-pulse',  isHQ);
    setVis('chain-lines',       isHQ && showChains);
    setVis('chain-lines-glow',  isHQ && showChains);
    setVis('state-fill',        isChoropleth);
    setVis('state-border',      isChoropleth);
    setVis('founding-bubbles',  isFounding);
    setVis('founding-labels',   isFounding);

    if (map.getLayer('org-dots')) {
      map.setPaintProperty('org-dots', 'circle-radius', [
        'case',
        ['boolean',['feature-state','selected'],false], ['*', sizeMode ? ['get','radius'] : 7, 1.6],
        ['boolean',['feature-state','hovered'],false],  ['*', sizeMode ? ['get','radius'] : 7, 1.3],
        sizeMode ? ['get','radius'] : 7,
      ]);
    }
  }, [orgGeojson, foundingGeojson, chainGeojson, mapLoaded, layer, showClusters, showChains, sizeMode, stateStatsMap]);

  // ── Close search on outside click ─────────────────────────────────────────
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (val, state, setter) =>
    setter(state.includes(val) ? state.filter(v => v !== val) : [...state, val]);

  const filteredCount = orgGeojson.features.length;
  const selectedStateStats = selected?.type === 'state' ? stateStatsMap[selected.abbr] : null;
  const uniqueChains = [...new Set(lineageEdges.map(e => e.chain_name).filter(Boolean))];

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>

      {/* ── Sticky header ── */}
      <div style={{ borderBottom:'1px solid rgba(212,206,196,0.1)', padding:'1.25rem 0 0.9rem',
        background:'var(--ink)', position:'sticky', top:'60px', zIndex:50 }}>
        <div className="container--wide">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.75rem' }}>
            {/* Search bar */}
            <div ref={searchRef} style={{ position:'relative', zIndex:60 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem',
                background:'rgba(244,240,232,0.05)', border:'1px solid rgba(212,206,196,0.2)',
                padding:'0.3rem 0.7rem', borderRadius:4 }}>
                <span style={{ color:'var(--muted)', fontSize:'0.75rem' }}>⌕</span>
                <input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search organizations…"
                  style={{ background:'transparent', border:'none', outline:'none',
                    fontFamily:'var(--mono)', fontSize:'0.68rem', color:'var(--paper)',
                    width:200 }}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                    style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'0.75rem' }}>✕</button>
                )}
              </div>
              {searchOpen && searchResults.length > 0 && (
                <div style={{ position:'absolute', top:'calc(100% + 4px)', right:0,
                  background:'var(--ink)', border:'1px solid rgba(212,206,196,0.2)',
                  borderRadius:4, minWidth:280, maxHeight:260, overflowY:'auto',
                  boxShadow:'0 8px 32px rgba(0,0,0,0.6)', zIndex:100 }}>
                  {searchResults.map(org => (
                    <button key={org.id} onClick={() => handleSearchSelect(org)}
                      style={{ display:'block', width:'100%', textAlign:'left',
                        padding:'0.55rem 0.9rem', background:'transparent',
                        border:'none', borderBottom:'1px solid rgba(212,206,196,0.06)',
                        cursor:'pointer', color:'var(--paper)' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(244,240,232,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <div style={{ fontFamily:'var(--mono)', fontSize:'0.7rem', fontWeight:600 }}>{org.name}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', color:'var(--muted)' }}>{org.category}</span>
                        <span style={{ fontFamily:'var(--mono)', fontSize:'0.62rem',
                          color: TIER_COLORS[org.composite_tier] || '#888', fontWeight:700 }}>
                          {parseFloat(org.composite_score||0).toFixed(0)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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

          {/* Layer + filter controls */}
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center' }}>
            {[
              { id:'hq',         label:'HQ Locations' },
              { id:'choropleth', label:'State Avg Score' },
              { id:'founding',   label:'Founding Cities' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => { setLayer(id); clearSelected(); }}
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

              {/* Tier filter */}
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

              {/* Quadrant filter */}
              {QUADRANTS.map(q => (
                <button key={q} onClick={() => toggle(q, quadrantFilter, setQuadrantFilter)}
                  style={{ fontFamily:'var(--mono)', fontSize:'0.54rem', padding:'0.18rem 0.45rem',
                    background: quadrantFilter.includes(q) ? 'rgba(200,168,75,0.15)' : 'transparent',
                    border:`1px solid ${quadrantFilter.includes(q) ? 'rgba(200,168,75,0.6)' : 'rgba(212,206,196,0.1)'}`,
                    color: quadrantFilter.includes(q) ? 'var(--gold)' : 'var(--muted)', cursor:'pointer' }}>
                  {q.replace(' ', '\u00a0')}
                </button>
              ))}

              <div style={{ width:1, height:20, background:'rgba(212,206,196,0.1)' }} />

              {/* Chain overlay */}
              <label style={{ display:'flex', alignItems:'center', gap:'0.3rem', cursor:'pointer' }}>
                <input type="checkbox" checked={showChains} onChange={e => setShowChains(e.target.checked)}
                  style={{ accentColor:'var(--gold)', width:11, height:11 }} />
                <span style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', color: showChains ? 'var(--gold)' : 'var(--muted)' }}>Chains</span>
              </label>

              {showChains && uniqueChains.length > 0 && (
                <select value={chainFilter || ''} onChange={e => setChainFilter(e.target.value || null)}
                  style={{ fontFamily:'var(--mono)', fontSize:'0.56rem', background:'rgba(244,240,232,0.05)',
                    border:'1px solid rgba(212,206,196,0.2)', color:'var(--muted)', padding:'0.15rem 0.4rem',
                    cursor:'pointer', maxWidth:180 }}>
                  <option value="">All chains</option>
                  {uniqueChains.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

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

              {(tierFilter.length > 0 || quadrantFilter.length > 0) && (
                <button onClick={() => { setTierFilter([]); setQuadrantFilter([]); }}
                  style={{ fontFamily:'var(--mono)', fontSize:'0.56rem', padding:'0.18rem 0.45rem',
                    background:'transparent', border:'1px solid rgba(212,206,196,0.2)',
                    color:'var(--muted)', cursor:'pointer' }}>
                  Clear filters
                </button>
              )}
            </>}
          </div>
        </div>
      </div>

      {/* ── Map + sidebar ── */}
      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 290px' : '1fr', flex:1, minHeight:520 }}>
        <div style={{ position:'relative' }}>
          {mapError ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              height:'100%', minHeight:520, background:'rgba(244,240,232,0.015)', gap:'1rem' }}>
              <p style={{ fontFamily:'var(--mono)', fontSize:'0.8rem', color:'var(--muted)' }}>Map failed to load</p>
              <p style={{ fontFamily:'var(--mono)', fontSize:'0.65rem', color:'rgba(212,206,196,0.3)' }}>{mapError}</p>
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

          {/* Chain legend when chains visible */}
          {layer === 'hq' && showChains && (
            <div style={{ position:'absolute', bottom:48, left:16, background:'rgba(18,14,10,0.9)',
              border:'1px solid rgba(212,206,196,0.15)', padding:'8px 12px', borderRadius:4, zIndex:20 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:'0.56rem', color:'var(--muted)',
                textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Formation Chains</div>
              {uniqueChains.map(c => (
                <div key={c} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <div style={{ width:16, height:2, background: CHAIN_COLORS[c]||'#888', opacity:0.8 }} />
                  <span style={{ fontFamily:'var(--mono)', fontSize:'0.56rem', color:'rgba(212,206,196,0.6)' }}>
                    {c.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Trajectory legend */}
          {layer === 'hq' && (
            <div style={{ position:'absolute', bottom:16, right:selected ? 306 : 16,
              background:'rgba(18,14,10,0.85)', border:'1px solid rgba(212,206,196,0.1)',
              padding:'6px 10px', borderRadius:4, zIndex:20, pointerEvents:'none' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:'0.54rem', color:'var(--muted)',
                textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Trajectory</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', border:'1.5px solid #e8574d',
                  background:'transparent' }} />
                <span style={{ fontFamily:'var(--mono)', fontSize:'0.56rem', color:'rgba(212,206,196,0.5)' }}>Escalating (pulsing ring)</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Detail sidebar ── */}
        {selected && (
          <div style={{ background:'var(--ink)', borderLeft:'1px solid rgba(212,206,196,0.1)',
            padding:'1.5rem', overflowY:'auto', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <span style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', letterSpacing:'0.15em',
                textTransform:'uppercase', color:'var(--gold)' }}>
                {selected.type === 'org' ? 'Organization' : selected.type === 'state' ? 'State Summary' : 'Founding City'}
              </span>
              <button onClick={clearSelected}
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
                <span style={{ fontFamily:'var(--mono)', fontSize:'0.7rem', color:'var(--paper)', fontWeight:700 }}>{parseFloat(selected.composite_score||0).toFixed(0)}%</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem' }}>
                {[
                  ['HQ', `${selected.hq_city||'—'}${selected.hq_state ? `, ${selected.hq_state}` : ''}`],
                  ['Trajectory', selected.trajectory||'—'],
                  ['Size', selected.size_tier||'—'],
                  ['Members', selected.membership_count ? Number(selected.membership_count).toLocaleString() : '—'],
                  ...(selected.econ != null ? [['Econ Axis', `${selected.econ > 0 ? '+' : ''}${selected.econ}`]] : []),
                  ...(selected.auth != null ? [['Auth Axis', `${selected.auth > 0 ? '+' : ''}${selected.auth}`]] : []),
                  ...(selected.quadrant ? [['Quadrant', selected.quadrant]] : []),
                ].map(([k,v]) => (
                  <div key={k} style={{ padding:'0.5rem', background:'rgba(244,240,232,0.03)', border:'1px solid rgba(212,206,196,0.08)' }}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:'0.52rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)', marginBottom:'0.15rem' }}>{k}</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:'0.7rem', color:'var(--gold)' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Chain connections */}
              {(() => {
                const slug = selected.slug;
                const connected = lineageEdges.filter(e => e.source_slug === slug || e.target_slug === slug);
                if (!connected.length) return null;
                return (
                  <div style={{ padding:'0.6rem', background:'rgba(244,240,232,0.02)', border:'1px solid rgba(212,206,196,0.08)' }}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:'0.52rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)', marginBottom:'0.4rem' }}>Formation Chain</div>
                    {connected.slice(0,4).map((e, i) => {
                      const isSource = e.source_slug === slug;
                      const other = isSource ? e.target_slug : e.source_slug;
                      const otherOrg = orgs.find(o => o.slug === other);
                      return (
                        <div key={i} style={{ fontFamily:'var(--mono)', fontSize:'0.6rem', color:'rgba(212,206,196,0.5)', marginBottom:2 }}>
                          {isSource ? '→' : '←'} {otherOrg?.name || other}
                          <span style={{ color: CHAIN_COLORS[e.chain_name]||'#888', marginLeft:4, fontSize:'0.54rem' }}>
                            {e.relationship_type?.replace('_',' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

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
                  ['Super Culty', selectedStateStats.cult, '#e8574d'],
                  ['Kinda Culty', selectedStateStats.high_control, '#d99b3e'],
                  ['Not Culty', selectedStateStats.healthy_group, '#5cb878'],
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
                {[['Orgs Founded', selected.count], ['Avg Score', `${selected.avg_score}%`], ['Cult / CD', selected.high_control_count]].map(([k,v]) => (
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

      {/* ── Legend strip ── */}
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
              {[['≥70%','#e8574d'],['55–70%','#d99b3e'],['41–55%','#8f93e0'],['21–40%','#2aa198'],['0–20%','#5cb878'],['No data','rgba(212,206,196,0.2)']].map(([label, color]) => (
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
