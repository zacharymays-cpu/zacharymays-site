'use client';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// MapLibre GL JS loaded from CDN to avoid SSR issues
// Imported dynamically in useEffect

const TIER_COLORS = {
  'Cult':          '#c02020',
  'Cult Dynamics': '#cb4b16',
  'High Control':  '#b58900',
  'Concerning':    '#6c71c4',
  'Mildly Culty':  '#2aa198',
  'Healthy Group': '#859900',
};

const TIERS = ['Cult','Cult Dynamics','High Control','Concerning','Mildly Culty','Healthy Group'];

const SIZE_LABELS = {
  'micro':  '< 1k',
  'small':  '1k – 50k',
  'medium': '50k – 1M',
  'large':  '1M – 10M',
  'mass':   '> 10M',
};

// membership_count → circle radius (MapLibre paint expression uses these)
const SIZE_RADIUS_MAP = {
  'micro':  5,
  'small':  7,
  'medium': 10,
  'large':  14,
  'mass':   20,
};

// Dark basemap style — matches site aesthetic (ink background, muted geography)
// Using MapLibre with a free dark style from Stadia Maps (no API key required for basic use)
const MAP_STYLE = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json';

export default function MapClient({ orgs = [], withGeo = 0, withSize = 0 }) {
  const mapContainer = useRef(null);
  const mapRef       = useRef(null);
  const [mapLoaded,  setMapLoaded]  = useState(false);
  const [mapError,   setMapError]   = useState(false);
  const [tierFilter, setTierFilter] = useState([]);
  const [sizeMode,   setSizeMode]   = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [hoveredId,  setHoveredId]  = useState(null);
  const [mapLayer,   setMapLayer]   = useState('hq');        // 'hq' | 'choropleth'
  const [showClusters, setShowClusters] = useState(true);

  const total      = orgs.length;
  const pctMapped  = total > 0 ? Math.round(withGeo / total * 100) : 0;

  // Build GeoJSON from org data
  const geojson = useMemo(() => {
    const features = orgs
      .filter(o => o.hq_lat && o.hq_lng)
      .filter(o => !tierFilter.length || tierFilter.includes(o.composite_tier))
      .map(o => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(o.hq_lng), parseFloat(o.hq_lat)],
        },
        properties: {
          id:             o.id,
          name:           o.name,
          category:       o.category,
          composite_score: parseFloat(o.composite_score || 0),
          composite_tier: o.composite_tier || 'Healthy Group',
          trajectory:     o.trajectory,
          hq_city:        o.hq_city,
          hq_state:       o.hq_state,
          size_tier:      o.size_tier,
          membership_count: o.membership_count,
          slug:           o.slug,
          color:          TIER_COLORS[o.composite_tier] || '#888',
          radius:         SIZE_RADIUS_MAP[o.size_tier] || 7,
        },
      }));
    return { type: 'FeatureCollection', features };
  }, [orgs, tierFilter]);

  // Load MapLibre dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
    script.async = true;
    script.onload = () => initMap();
    script.onerror = () => setMapError(true);
    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const initMap = useCallback(() => {
    if (!mapContainer.current || !window.maplibregl) return;

    const map = new window.maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [-96, 38],
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 16,
      attributionControl: false,
    });

    map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new window.maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      // ── Org dots source (with clustering) ─────────────────────────
      map.addSource('orgs', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 8,
        clusterRadius: 40,
      });

      // Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'orgs',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': 'rgba(200,168,75,0.7)',
          'circle-radius': ['step', ['get', 'point_count'], 14, 10, 20, 50, 28],
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(200,168,75,0.4)',
        },
      });

      // Cluster count labels
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'orgs',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold'],
          'text-size': 11,
        },
        paint: { 'text-color': '#1a1410' },
      });

      // Individual org dots
      map.addLayer({
        id: 'org-dots',
        type: 'circle',
        source: 'orgs',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], ['*', ['get', 'radius'], 1.6],
            ['boolean', ['feature-state', 'hovered'], false],  ['*', ['get', 'radius'], 1.3],
            ['get', 'radius'],
          ],
          'circle-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 1,
            ['boolean', ['feature-state', 'hovered'], false],  0.95,
            0.8,
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 2,
            0.5,
          ],
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 'rgba(200,168,75,0.9)',
            'rgba(0,0,0,0.3)',
          ],
          'circle-blur': 0.1,
        },
      });

      // ── Interaction ─────────────────────────────────────────────────
      // Hover
      map.on('mousemove', 'org-dots', e => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features[0];
        if (f) {
          if (hoveredId !== null) {
            map.setFeatureState({ source: 'orgs', id: hoveredId }, { hovered: false });
          }
          map.setFeatureState({ source: 'orgs', id: f.id }, { hovered: true });
          setHoveredId(f.id);
        }
      });

      map.on('mouseleave', 'org-dots', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredId !== null) {
          map.setFeatureState({ source: 'orgs', id: hoveredId }, { hovered: false });
        }
        setHoveredId(null);
      });

      // Click org dot
      map.on('click', 'org-dots', e => {
        const props = e.features[0]?.properties;
        if (props) setSelected(props);
      });

      // Click cluster → zoom in
      map.on('click', 'clusters', e => {
        const f = e.features[0];
        const clusterId = f.properties.cluster_id;
        map.getSource('orgs').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: f.geometry.coordinates, zoom: zoom + 0.5 });
        });
      });

      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });

      // Click elsewhere — deselect
      map.on('click', e => {
        const f = map.queryRenderedFeatures(e.point, { layers: ['org-dots', 'clusters'] });
        if (!f.length) setSelected(null);
      });

      mapRef.current = map;
      setMapLoaded(true);
    });

    map.on('error', () => setMapError(true));
  }, []);

  // Update map data when geojson or display options change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('orgs');
    if (!source) return;

    // Add numeric IDs for feature state
    const data = {
      ...geojson,
      features: geojson.features.map((f, i) => ({ ...f, id: i })),
    };
    source.setData(data);

    // Toggle clustering
    // MapLibre doesn't support runtime cluster toggle — handle via opacity
    if (mapRef.current.getLayer('clusters')) {
      mapRef.current.setLayoutProperty('clusters',      'visibility', showClusters ? 'visible' : 'none');
      mapRef.current.setLayoutProperty('cluster-count', 'visibility', showClusters ? 'visible' : 'none');
    }

    // Update dot radius based on sizeMode
    if (mapRef.current.getLayer('org-dots')) {
      mapRef.current.setPaintProperty('org-dots', 'circle-radius', [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        ['*', sizeMode ? ['get', 'radius'] : 7, 1.6],
        ['boolean', ['feature-state', 'hovered'], false],
        ['*', sizeMode ? ['get', 'radius'] : 7, 1.3],
        sizeMode ? ['get', 'radius'] : 7,
      ]);
    }
  }, [geojson, mapLoaded, showClusters, sizeMode]);

  const toggle = (val, state, setter) =>
    setter(state.includes(val) ? state.filter(v => v !== val) : [...state, val]);

  const filteredCount = geojson.features.length;

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Sticky header ──────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(212,206,196,0.1)', padding: '1.5rem 0 1rem',
        background: 'var(--ink)', position: 'sticky', top: '60px', zIndex: 50,
      }}>
        <div className="container--wide">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                <Link href="/explore" style={{ color: 'var(--gold)' }}>Explorer</Link> —
              </span>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.3rem,3vw,2rem)', color: 'var(--paper)', display: 'inline', marginLeft: '0.4rem' }}>
                Geographic Map
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--gold)' }}>
                {filteredCount} <span style={{ color: 'var(--muted)' }}>/ {withGeo} mapped</span>
              </span>
              <div style={{ width: 60, height: 4, background: 'rgba(212,206,196,0.1)', borderRadius: 2 }}>
                <div style={{ width: `${pctMapped}%`, height: '100%', background: 'var(--gold)', borderRadius: 2, opacity: 0.7 }} />
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--gold)' }}>{pctMapped}%</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {TIERS.map(t => (
              <button key={t} onClick={() => toggle(t, tierFilter, setTierFilter)}
                style={{
                  fontFamily: 'var(--mono)', fontSize: '0.58rem', padding: '0.2rem 0.5rem',
                  background: tierFilter.includes(t) ? `${TIER_COLORS[t]}22` : 'transparent',
                  border: `1px solid ${tierFilter.includes(t) ? TIER_COLORS[t] : 'rgba(212,206,196,0.15)'}`,
                  color: tierFilter.includes(t) ? TIER_COLORS[t] : 'var(--muted)', cursor: 'pointer',
                }}>
                {t}
              </button>
            ))}

            <div style={{ width: 1, height: 20, background: 'rgba(212,206,196,0.1)' }} />

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={sizeMode} onChange={e => setSizeMode(e.target.checked)}
                style={{ accentColor: 'var(--gold)', width: 12, height: 12 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)' }}>Scale by size</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showClusters} onChange={e => setShowClusters(e.target.checked)}
                style={{ accentColor: 'var(--gold)', width: 12, height: 12 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)' }}>Cluster nearby</span>
            </label>

            {tierFilter.length > 0 && (
              <button onClick={() => setTierFilter([])}
                style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', padding: '0.2rem 0.5rem', background: 'transparent', border: '1px solid rgba(212,206,196,0.2)', color: 'var(--muted)', cursor: 'pointer' }}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Map + sidebar layout ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: 0, height: 'calc(100vh - 160px)', minHeight: 500 }}>

        {/* Map container */}
        <div style={{ position: 'relative' }}>
          {mapError ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', background: 'rgba(244,240,232,0.015)',
              border: '1px solid rgba(212,206,196,0.08)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                  Map failed to load
                </p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'rgba(212,206,196,0.3)' }}>
                  Check network connection or try refreshing
                </p>
              </div>
            </div>
          ) : (
            <>
              <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
              {!mapLoaded && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: 'rgba(18,14,10,0.8)', zIndex: 10,
                }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--gold)', letterSpacing: '0.15em' }}>
                    LOADING MAP…
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Selected org sidebar ─────────────────────────────────── */}
        {selected && (
          <div style={{
            background: 'var(--ink)', borderLeft: '1px solid rgba(212,206,196,0.1)',
            padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                  {selected.category}
                </p>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1.2 }}>
                  {selected.name}
                </h2>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0.25rem', flexShrink: 0 }}>
                ✕
              </button>
            </div>

            {/* Tier badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.75rem',
              background: `${TIER_COLORS[selected.composite_tier] || '#888'}18`,
              border: `1px solid ${TIER_COLORS[selected.composite_tier] || '#888'}40`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: TIER_COLORS[selected.composite_tier] || '#888', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: TIER_COLORS[selected.composite_tier] || '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {selected.composite_tier}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--paper)', fontWeight: 700, marginLeft: '0.25rem' }}>
                {parseFloat(selected.composite_score).toFixed(0)}%
              </span>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                ['HQ', `${selected.hq_city || '—'}${selected.hq_state ? `, ${selected.hq_state}` : ''}`],
                ['Trajectory', selected.trajectory || '—'],
                ['Size', selected.size_tier || '—'],
                ['Members', selected.membership_count ? Number(selected.membership_count).toLocaleString() : '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '0.6rem', background: 'rgba(244,240,232,0.03)', border: '1px solid rgba(212,206,196,0.08)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.2rem' }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--gold)' }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* Open full assessment */}
            {selected.slug && (
              <a
                href={`/org/${selected.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center', padding: '0.6rem 1rem',
                  background: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.3)',
                  color: 'var(--gold)', fontFamily: 'var(--mono)', fontSize: '0.68rem',
                  letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
                  transition: 'background 0.15s',
                }}>
                Full Assessment →
              </a>
            )}
          </div>
        )}
      </div>

      {/* ── Legend strip ────────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(212,206,196,0.08)', padding: '1rem 0',
        background: 'rgba(244,240,232,0.01)',
      }}>
        <div className="container--wide">
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Tier legend */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Tier</span>
              {TIERS.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: TIER_COLORS[t] }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'rgba(212,206,196,0.5)' }}>
                    {t} ({geojson.features.filter(f => f.properties.composite_tier === t).length})
                  </span>
                </div>
              ))}
            </div>

            <div style={{ width: 1, height: 20, background: 'rgba(212,206,196,0.1)' }} />

            {/* Size legend */}
            {sizeMode && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Size</span>
                {Object.entries(SIZE_LABELS).map(([tier, label]) => (
                  <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <svg viewBox="0 0 20 20" style={{ width: 20, height: 20, flexShrink: 0 }}>
                      <circle cx={10} cy={10} r={SIZE_RADIUS_MAP[tier]} fill="rgba(212,206,196,0.3)" />
                    </svg>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'rgba(212,206,196,0.4)' }}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'rgba(212,206,196,0.3)' }}>
              Zoom / pan to explore · Click dot to select · Shift-drag to box zoom
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
