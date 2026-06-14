'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './page.module.css';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3JxanR3dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk3NTczODMsImV4cCI6MTcyNzUzMzM4M30.kbJq8sxP6pZNqpd9Z2Y0i_HHvRLgKF7sDIV46DKEqbQ';

const MOVEMENT_PATTERNS = [
  { id: 'japan-phil', name: 'Japan → Philippines', color: '#dc322f', survivors: 5 },
  { id: 'macau-japan', name: 'Macau → Japan', color: '#cb4b16', survivors: 4 },
  { id: 'macau-london', name: 'Macau → London', color: '#b58900', survivors: 3 },
  { id: 'toronto-london', name: 'Toronto → London', color: '#859900', survivors: 2 },
  { id: 'hq-macau', name: 'Huntington Beach → Macau', color: '#2aa198', survivors: 3 },
];

export default function SurvivorMovements() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [movementData, setMovementData] = useState(null);
  const [compounds, setCompounds] = useState(null);
  const [filters, setFilters] = useState({
    minSurvivors: 1,
    yearRange: [1968, 2024],
    showPattern: {
      'japan-phil': true,
      'macau-japan': true,
      'macau-london': true,
      'toronto-london': true,
      'hq-macau': true,
    },
  });
  const [hoveredRoute, setHoveredRoute] = useState(null);

  // Fetch survivor journey data with compound coordinates
  useEffect(() => {
    const fetchMovementData = async () => {
      try {
        // Fetch all survivor journeys with person and compound data
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/survivor_journeys?select=person_id,persons(canonical_name),compound_from_id,compound_to_id,year_from,year_to,confidence,cog_compounds!fk_from(id,compound_name,latitude,longitude),cog_compounds!fk_to(id,compound_name,latitude,longitude)`,
          {
            headers: {
              apikey: ANON_KEY,
              Authorization: `Bearer ${ANON_KEY}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          // Transform data for easier processing
          const transformed = data.map(journey => ({
            person_id: journey.person_id,
            person_name: journey.persons?.canonical_name || 'Unknown',
            from_compound_id: journey.compound_from_id,
            to_compound_id: journey.compound_to_id,
            year_from: journey.year_from,
            year_to: journey.year_to,
            confidence: journey.confidence,
          })).filter(j => j.from_compound_id && j.to_compound_id);
          setMovementData(transformed);
        }
      } catch (error) {
        console.error('Error fetching movement data:', error);
      }
    };

    const fetchCompounds = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/cog_compounds?select=id,compound_name,latitude,longitude,country,city,facility_type,opened_year,closed_year`,
          {
            headers: {
              apikey: ANON_KEY,
              Authorization: `Bearer ${ANON_KEY}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setCompounds(data);
        }
      } catch (error) {
        console.error('Error fetching compounds:', error);
      }
    };

    fetchMovementData();
    fetchCompounds();
  }, []);

  // Initialize map and draw movement flows
  useEffect(() => {
    if (!mapContainer.current || !compounds) return;

    const initMap = async () => {
      try {
        const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
        const mapStyle = mapTilerKey
          ? `https://api.maptiler.com/maps/streets/style.json?key=${mapTilerKey}`
          : 'https://demotiles.maplibre.org/style.json';

        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: mapStyle,
          center: [0, 20],
          zoom: 2,
          maxZoom: 19,
        });

        map.current.on('load', () => {
          addCompoundsLayer();
          addMovementFlows();
        });
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [compounds]);

  // Add compound location dots
  const addCompoundsLayer = () => {
    if (!map.current || !compounds) return;

    const features = compounds.map(c => ({
      type: 'Feature',
      properties: {
        name: c.compound_name,
        country: c.country,
        city: c.city,
        type: c.facility_type,
      },
      geometry: {
        type: 'Point',
        coordinates: [c.longitude, c.latitude],
      },
    }));

    map.current.addSource('compounds', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    });

    map.current.addLayer({
      id: 'compounds-layer',
      type: 'circle',
      source: 'compounds',
      paint: {
        'circle-radius': 6,
        'circle-color': '#d4af37',
        'circle-opacity': 0.8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-stroke-opacity': 0.6,
      },
    });

    // Add popup on click
    map.current.on('click', 'compounds-layer', (e) => {
      const props = e.features[0].properties;
      const popupHTML = `
        <div style="font-family: system-ui; font-size: 12px;">
          <strong>${props.name}</strong><br/>
          ${props.city}, ${props.country}<br/>
          <span style="color: #999;">${props.type}</span>
        </div>
      `;
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popupHTML)
        .addTo(map.current);
    });

    map.current.on('mouseenter', 'compounds-layer', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'compounds-layer', () => {
      map.current.getCanvas().style.cursor = '';
    });
  };

  // Add movement flow lines between compounds
  const addMovementFlows = () => {
    if (!map.current || !compounds || !movementData) return;

    // Create a lookup map for compound coordinates
    const compoundCoords = {};
    compounds.forEach(c => {
      compoundCoords[c.id] = [c.longitude, c.latitude];
    });

    // Group journeys by route (from_compound → to_compound)
    const routes = {};
    movementData.forEach(journey => {
      if (!journey.from_compound_id || !journey.to_compound_id) return;

      const key = `${journey.from_compound_id}-${journey.to_compound_id}`;
      if (!routes[key]) {
        routes[key] = {
          from_id: journey.from_compound_id,
          to_id: journey.to_compound_id,
          survivors: [],
          years: { min: journey.year_from, max: journey.year_to },
        };
      }
      routes[key].survivors.push(journey.person_name);
      routes[key].years.min = Math.min(routes[key].years.min, journey.year_from);
      routes[key].years.max = Math.max(routes[key].years.max, journey.year_to);
    });

    // Create GeoJSON for flow lines
    const flowFeatures = Object.entries(routes).map(([key, route]) => {
      const fromCoords = compoundCoords[route.from_id];
      const toCoords = compoundCoords[route.to_id];

      if (!fromCoords || !toCoords) return null;

      return {
        type: 'Feature',
        properties: {
          survivors: route.survivors.length,
          survivorNames: route.survivors.join(', '),
          years: `${route.years.min}–${route.years.max}`,
          key,
        },
        geometry: {
          type: 'LineString',
          coordinates: [fromCoords, toCoords],
        },
      };
    }).filter(Boolean);

    if (flowFeatures.length === 0) return;

    map.current.addSource('movement-flows', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: flowFeatures,
      },
    });

    // Add line layer with thickness based on survivor count
    map.current.addLayer({
      id: 'movement-lines',
      type: 'line',
      source: 'movement-flows',
      paint: {
        'line-color': '#b58900',
        'line-width': [
          'interpolate',
          ['linear'],
          ['get', 'survivors'],
          1, 2,
          5, 8,
        ],
        'line-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.9,
          0.4,
        ],
      },
    });

    // Add hover effect
    map.current.on('mousemove', 'movement-lines', (e) => {
      map.current.getCanvas().style.cursor = 'pointer';
      const feature = e.features[0];
      map.current.setFeatureState(
        { source: 'movement-flows', id: feature.id },
        { hover: true }
      );

      const popupHTML = `
        <div style="font-family: system-ui; font-size: 11px; max-width: 200px;">
          <strong>${feature.properties.survivors} survivors</strong><br/>
          <span style="color: #999;">${feature.properties.years}</span><br/>
          <div style="margin-top: 6px; max-height: 100px; overflow-y: auto; font-size: 10px; color: #d4cec4;">
            ${feature.properties.survivorNames.split(', ').map(s => `• ${s}`).join('<br/>')}
          </div>
        </div>
      `;
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popupHTML)
        .addTo(map.current);
    });

    map.current.on('mouseleave', 'movement-lines', () => {
      map.current.getCanvas().style.cursor = '';
      map.current.setFeatureState(
        { source: 'movement-flows' },
        { hover: false }
      );
    });
  };

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section style={{ padding: '2.5rem 0 2rem', borderTop: '3px solid #b58900', borderBottom: '1px solid rgba(212,206,196,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              Survivor Journey Analysis
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 700, color: 'var(--paper)', marginBottom: '1rem', lineHeight: 1.15 }}>
            Geographic Movement Flows
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#e8e4dc', lineHeight: 1.8, maxWidth: 800 }}>
            Visualization of 49 documented survivors' movements across 48 compounds spanning 1968–2024. Line thickness indicates frequency; explore individual routes to see survivor names and timelines.
          </p>
        </div>
      </section>

      {/* Main Layout */}
      <div className={styles.layout}>
        {/* Sidebar with filters */}
        <aside className={styles.sidebar}>
          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Top Movement Routes</h3>
            <div className={styles.checkboxGroup}>
              {MOVEMENT_PATTERNS.map(pattern => (
                <label key={pattern.id} className={styles.checkbox} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={filters.showPattern[pattern.id]}
                    onChange={(e) => {
                      setFilters(prev => ({
                        ...prev,
                        showPattern: { ...prev.showPattern, [pattern.id]: e.target.checked }
                      }));
                    }}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <span style={{ width: 12, height: 2, background: pattern.color, borderRadius: 1 }} />
                    <span>{pattern.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 'auto' }}>({pattern.survivors})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Minimum Survivors</h3>
            <input
              type="range"
              min="1"
              max="5"
              value={filters.minSurvivors}
              onChange={(e) => setFilters({ ...filters, minSurvivors: parseInt(e.target.value) })}
              className={styles.slider}
            />
            <p className={styles.yearDisplay}>{filters.minSurvivors}+ survivor route</p>
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Timeline Range</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0.5rem 0' }}>
              {filters.yearRange[0]}–{filters.yearRange[1]}
            </p>
          </div>

          {/* Route Summary Stats */}
          <div className={styles.filterGroup} style={{ background: 'rgba(200,168,75,0.08)', borderRadius: '4px', padding: '1rem' }}>
            <h3 className={styles.filterTitle} style={{ marginTop: 0 }}>Summary</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.8 }}>
              <div>📍 <strong>48</strong> compounds</div>
              <div>👥 <strong>49</strong> survivors</div>
              <div>🛤️ <strong>78+</strong> journeys</div>
              <div>📊 <strong>5</strong> major routes</div>
            </div>
          </div>
        </aside>

        {/* Main Map */}
        <main className={styles.main}>
          <div ref={mapContainer} className={styles.map}></div>

          <section className={styles.content}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, margin: '2rem 0 1rem', color: 'var(--paper)' }}>
              Major Movement Patterns
            </h2>

            {MOVEMENT_PATTERNS.map(pattern => (
              <div
                key={pattern.id}
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(244,240,232,0.025)',
                  border: `1px solid ${pattern.color}33`,
                  borderLeft: `3px solid ${pattern.color}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredRoute(pattern.id)}
                onMouseLeave={() => setHoveredRoute(null)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: '1rem', color: 'var(--paper)' }}>
                    {pattern.name}
                  </h3>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--muted)', background: `${pattern.color}22`, padding: '0.25rem 0.5rem', borderRadius: '3px' }}>
                    {pattern.survivors} survivors
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(212,206,196,0.7)', lineHeight: 1.6 }}>
                  {pattern.id === 'japan-phil' && 'Discipline and punishment pipeline: survivors transferred from Japan training facilities to Philippines reprogramming centers'}
                  {pattern.id === 'macau-japan' && 'World Service dispersal: members moved from Macau regional hub to Japan for specialized training and organizational roles'}
                  {pattern.id === 'macau-london' && 'Leadership coordination: flow from Asian operations to European leadership centers for administrative functions'}
                  {pattern.id === 'toronto-london' && 'North American entry point: Canadian members relocated to London headquarters for leadership training'}
                  {pattern.id === 'hq-macau' && 'Global dispersal: headquarters members distributed to Macau as World Service operational center'}
                </p>
              </div>
            ))}

            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, margin: '2rem 0 1rem', color: 'var(--paper)' }}>
              Geographic Hubs Analysis
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { name: 'Macau', arrivals: 8, role: 'Primary World Service Home', color: '#dc322f' },
                { name: 'London', arrivals: 6, role: 'Leadership Coordination', color: '#cb4b16' },
                { name: 'Japan', arrivals: 4, role: 'Training & Reprogramming', color: '#b58900' },
                { name: 'Philippines', arrivals: 5, role: 'Discipline Center', color: '#859900' },
              ].map(hub => (
                <div key={hub.name} style={{ background: 'rgba(244,240,232,0.025)', border: `1px solid ${hub.color}33`, borderLeft: `3px solid ${hub.color}`, padding: '1rem', borderRadius: '4px' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.25rem' }}>
                    {hub.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                    {hub.arrivals}+ arrivals documented
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(212,206,196,0.6)' }}>
                    <strong>Role:</strong> {hub.role}
                  </div>
                </div>
              ))}
            </div>

            <p style={{ background: 'rgba(139,32,32,0.1)', border: '3px solid var(--accent)', padding: '1.5rem', marginTop: '2rem', color: 'var(--accent-text)', fontStyle: 'italic' }}>
              This visualization documents survivor testimony from 15 published memoirs, 700+ oral history interviews, and archival research. Movement patterns reveal organizational control strategies through geographic dispersal, isolation, and hierarchical placement.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
