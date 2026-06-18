'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './page.module.css';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const USING_MAPTILER = Boolean(MAPTILER_KEY);
const CARTO_FALLBACK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const styleUrl = (id) => (USING_MAPTILER
  ? `https://api.maptiler.com/maps/${id}/style.json?key=${MAPTILER_KEY}`
  : CARTO_FALLBACK);

const summarize = (wp) => wp.map((w) => w.city || w.name).join(' → ');
const yearSpan = (wp) => {
  const ys = wp.flatMap((w) => [w.year_from, w.year_to]).filter((y) => y != null);
  if (!ys.length) return '';
  const lo = Math.min(...ys), hi = Math.max(...ys);
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
};

// `compounds` (location dots) and `personPaths` (each survivor's reconstructed
// chronological location chain) are fetched + built server-side in page.jsx.
export default function SurvivorMovements({ compounds = [], personPaths = [] }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const featureIdByPerson = useRef({});
  const [selected, setSelected] = useState(null); // person_id or null

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl('hybrid'),
      center: [0, 20],
      zoom: 2,
      maxZoom: 19,
    });

    map.current.on('load', () => {
      addCompoundDots();
      addPersonPaths();
    });

    return () => {
      if (map.current) { map.current.remove(); map.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compounds, personPaths]);

  const addCompoundDots = () => {
    if (!map.current || !compounds.length) return;
    map.current.addSource('compounds', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: compounds
          .filter((c) => c.latitude != null && c.longitude != null)
          .map((c) => ({
            type: 'Feature',
            properties: { name: c.compound_name, city: c.city, country: c.country, type: c.facility_type },
            geometry: { type: 'Point', coordinates: [Number(c.longitude), Number(c.latitude)] },
          })),
      },
    });
    map.current.addLayer({
      id: 'compounds-layer',
      type: 'circle',
      source: 'compounds',
      paint: {
        'circle-radius': 4,
        'circle-color': '#d4af37',
        'circle-opacity': 0.55,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
        'circle-stroke-opacity': 0.4,
      },
    });
    map.current.on('click', 'compounds-layer', (e) => {
      const p = e.features[0].properties;
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<div style="font-family:system-ui;font-size:12px;"><strong>${p.name}</strong><br/>${p.city}, ${p.country}<br/><span style="color:#999;">${p.type || ''}</span></div>`)
        .addTo(map.current);
    });
  };

  const addPersonPaths = () => {
    if (!map.current || !personPaths.length) return;

    featureIdByPerson.current = {};
    const lineFeatures = personPaths.map((p, i) => {
      featureIdByPerson.current[p.person_id] = i;
      return {
        type: 'Feature',
        id: i,
        properties: { person_id: p.person_id, person_name: p.person_name, color: p.color, summary: summarize(p.waypoints) },
        geometry: { type: 'LineString', coordinates: p.waypoints.map((w) => [w.lng, w.lat]) },
      };
    });

    map.current.addSource('person-paths', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: lineFeatures },
    });

    const activeOpacity = ['case', ['boolean', ['feature-state', 'active'], true], 0.85, 0.1];

    map.current.addLayer({
      id: 'person-lines',
      type: 'line',
      source: 'person-paths',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['get', 'color'], 'line-width': 2.5, 'line-opacity': activeOpacity },
    });

    // Arrowheads along each line to show direction of travel.
    map.current.addLayer({
      id: 'person-arrows',
      type: 'symbol',
      source: 'person-paths',
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 90,
        'text-field': '▶',
        'text-size': 12,
        'text-keep-upright': false,
        'text-allow-overlap': true,
      },
      paint: { 'text-color': ['get', 'color'], 'text-opacity': activeOpacity },
    });

    // Waypoint dots (person-colored) so non-compound stops are still visible.
    const wpFeatures = personPaths.flatMap((p) =>
      p.waypoints.map((w, idx) => ({
        type: 'Feature',
        properties: { person_id: p.person_id, color: p.color, label: `${w.name}${w.year_from ? ` (${w.year_from})` : ''}`, step: idx + 1 },
        geometry: { type: 'Point', coordinates: [w.lng, w.lat] },
      }))
    );
    map.current.addSource('person-waypoints', { type: 'geojson', data: { type: 'FeatureCollection', features: wpFeatures } });
    map.current.addLayer({
      id: 'person-waypoints-layer',
      type: 'circle',
      source: 'person-waypoints',
      paint: { 'circle-radius': 4, 'circle-color': ['get', 'color'], 'circle-stroke-width': 1.5, 'circle-stroke-color': '#fff', 'circle-stroke-opacity': 0.8 },
    });

    map.current.on('click', 'person-lines', (e) => {
      const f = e.features[0];
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<div style="font-family:system-ui;font-size:14px;max-width:240px;background-color:rgba(0,0,0,0.85);padding:6px 8px;border-radius:3px;"><strong style="color:#e8e4dc;">${f.properties.person_name}</strong><br/><span style="color:#d4c5b9;font-size:13px;">${f.properties.summary}</span></div>`)
        .addTo(map.current);
      selectPerson(f.properties.person_id);
    });
    map.current.on('mouseenter', 'person-lines', () => { map.current.getCanvas().style.cursor = 'pointer'; });
    map.current.on('mouseleave', 'person-lines', () => { map.current.getCanvas().style.cursor = ''; });
  };

  // Highlight one person's path (or clear with null) by toggling opacity on all related layers.
  const selectPerson = (personId) => {
    const next = selected === personId ? null : personId;
    setSelected(next);
    if (!map.current || !map.current.getSource('person-paths')) return;

    // Update line opacity: selected person is 0.85, others dim to 0.1
    map.current.setPaintProperty('person-lines', 'line-opacity',
      next === null ? 0.85 : ['case', ['==', ['get', 'person_id'], next], 0.85, 0.1]);

    // Update arrow opacity (same as lines)
    map.current.setPaintProperty('person-arrows', 'text-opacity',
      next === null ? 0.85 : ['case', ['==', ['get', 'person_id'], next], 0.85, 0.1]);

    // Update waypoint opacity
    map.current.setPaintProperty('person-waypoints-layer', 'circle-opacity',
      next === null ? 0.9 : ['case', ['==', ['get', 'person_id'], next], 0.95, 0.12]);

    if (next) {
      const wp = personPaths.find((p) => p.person_id === next)?.waypoints || [];
      if (wp.length) {
        const b = new maplibregl.LngLatBounds();
        wp.forEach((w) => b.extend([w.lng, w.lat]));
        map.current.fitBounds(b, { padding: 80, maxZoom: 6, duration: 600 });
      }
    }
  };

  return (
    <div className={styles.page}>
      <section style={{ padding: '2.5rem 0 2rem', borderTop: '3px solid #b58900', borderBottom: '1px solid rgba(212,206,196,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            Survivor Journey Analysis
          </span>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 700, color: 'var(--paper)', margin: '0.75rem 0 1rem', lineHeight: 1.15 }}>
            Individual Movement Paths
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#e8e4dc', lineHeight: 1.8, maxWidth: 800 }}>
            Each colored line traces one survivor's documented path through the network over time, reconstructed in chronological order. Click a name or a line to isolate that person's journey. {personPaths.length} survivors with multi-site paths are shown.
          </p>
        </div>
      </section>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Survivors ({personPaths.length})</span>
              {selected && (
                <button onClick={() => selectPerson(selected)} style={{ fontSize: '0.7rem', color: 'var(--gold)', background: 'none', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 3, padding: '0.15rem 0.4rem', cursor: 'pointer' }}>
                  Show all
                </button>
              )}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 520, overflowY: 'auto' }}>
              {personPaths.map((p) => {
                const isSel = selected === p.person_id;
                return (
                  <button
                    key={p.person_id}
                    onClick={() => selectPerson(p.person_id)}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'left',
                      padding: '0.5rem 0.6rem', borderRadius: 4, cursor: 'pointer',
                      background: isSel ? 'rgba(200,168,75,0.12)' : 'rgba(244,240,232,0.025)',
                      border: isSel ? '1px solid var(--gold)' : '1px solid rgba(212,206,196,0.1)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: 14, height: 3, background: p.color, borderRadius: 2, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--serif)', fontSize: '0.9rem', color: 'var(--paper)', fontWeight: isSel ? 700 : 500 }}>{p.person_name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--muted)' }}>{yearSpan(p.waypoints)}</span>
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(212,206,196,0.65)', lineHeight: 1.4, paddingLeft: '1.4rem' }}>
                      {summarize(p.waypoints)}
                    </span>
                  </button>
                );
              })}
              {personPaths.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No multi-site survivor paths recorded yet.</p>
              )}
            </div>
          </div>

          <div className={styles.filterGroup} style={{ background: 'rgba(200,168,75,0.08)', borderRadius: 4, padding: '1rem' }}>
            <h3 className={styles.filterTitle} style={{ marginTop: 0 }}>Summary</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.8 }}>
              <div>📍 <strong>{compounds.length}</strong> locations</div>
              <div>🧑 <strong>{personPaths.length}</strong> survivors with paths</div>
              <div>🛤️ <strong>{personPaths.reduce((n, p) => n + p.waypoints.length - 1, 0)}</strong> documented moves</div>
            </div>
          </div>
        </aside>

        <main className={styles.main}>
          <div ref={mapContainer} className={styles.map}></div>
        </main>
      </div>
    </div>
  );
}
