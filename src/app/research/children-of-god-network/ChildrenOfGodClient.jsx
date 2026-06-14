'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './page.module.css';
import SurvivorMovements from './SurvivorMovements';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const USING_MAPTILER = Boolean(MAPTILER_KEY);
const CARTO_FALLBACK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const styleUrl = (id) => (USING_MAPTILER
  ? `https://api.maptiler.com/maps/${id}/style.json?key=${MAPTILER_KEY}`
  : CARTO_FALLBACK);

const STYLE_OPTIONS = [
  { id: 'streets', label: 'Streets' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'topo', label: 'Terrain' },
  { id: 'dataviz-dark', label: 'Dark' },
];

const CONFIDENCE_COLORS = { HIGH: '#d62728', MEDIUM: '#ff7f0e', LOW: '#9467bd' };

// Convert Supabase cog_compounds rows into the GeoJSON the map layer expects.
const compoundsToGeoJSON = (compounds) => ({
  type: 'FeatureCollection',
  features: (compounds || [])
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [Number(c.longitude), Number(c.latitude)] },
      properties: {
        id: c.id,
        name: c.compound_name,
        city: c.city,
        country: c.country,
        facility_type: c.facility_type,
        opened_year: c.opened_year != null ? String(c.opened_year) : '',
        closed_year: c.closed_year != null ? String(c.closed_year) : '',
        status: c.status,
        confidence: c.confidence,
        confidence_color: CONFIDENCE_COLORS[c.confidence] || '#9467bd',
        sources: Array.isArray(c.sources) ? c.sources.join(', ') : (c.sources || ''),
        notes: c.notes || '',
      },
    })),
});

export default function ChildrenOfGodClient({ cogData, compounds, journeys }) {
  const [activeTab, setActiveTab] = useState('compounds');
  const mapContainer = useRef(null);
  const map = useRef(null);
  const viewRef = useRef(null);
  const [geojsonData, setGeojsonData] = useState(null);
  const [mapStyle, setMapStyle] = useState('hybrid');
  const [filters, setFilters] = useState({
    confidence: { HIGH: true, MEDIUM: true, LOW: true },
    facilityType: {
      'Headquarters': true,
      'Regional HQ': true,
      'Regional Hub': true,
      'Compound': true,
      'Compound/Ranch': true,
      'Residential Compound': true,
      'Commune': true,
      'Media Center': true,
      'World Service HQ': true,
      'World Service Home': true,
      'Administrative Office': true,
      'Provisioning Center': true,
      'Training Camp': true,
      'Reprogramming Camp': true,
    },
    year: 2000,
  });

  // Org detail styling constants
  const TIER_TEXT = { 'Super Culty': '#dc322f', 'Kinda Culty': '#b58900', 'Not Culty': '#859900' };
  const TIER_BG = { 'Super Culty': 'rgba(220,50,47,0.12)', 'Kinda Culty': 'rgba(181,137,0,0.12)', 'Not Culty': 'rgba(133,153,0,0.12)' };
  const TIER_LABELS = { 'Super Culty': 'High-Control', 'Kinda Culty': 'Moderate-Control', 'Not Culty': 'Low-Control' };
  const lbl = (t) => TIER_LABELS[t] || t;
  const CRITERIA = {
    C1: 'Charismatic Leadership', C2: 'Sacred Assumptions', C3: 'Transcendent Mission',
    C4: 'Identity Sublimation', C5: 'Information Isolation', C6: 'Private Vernacular',
    C7: 'Us-vs-Them Dynamics', C8: 'Labor Exploitation', C9: 'Exit Costs',
    C10: 'Ends Justify Means',
  };
  const SCORE_COLOR = (s) => {
    if (s == null) return 'rgba(212,206,196,0.4)';
    if (s >= 9) return '#dc322f';
    if (s >= 7) return '#cb4b16';
    if (s >= 5) return '#b58900';
    if (s >= 3) return '#859900';
    return '#2aa198';
  };

  const formatWholeNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const formatUsd = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(n >= 10_000_000_000 ? 0 : 1)}B`;
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
    return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const SIZE_TIER_LABELS = {
    micro: 'Micro scale (<1K)',
    small: 'Small scale (1K-50K)',
    medium: 'Medium scale (50K-1M)',
    large: 'Large scale (1M-10M)',
    mass: 'Mass scale (>10M)',
  };

  const tierColor = cogData ? (TIER_BG[cogData.composite_tier] ?? 'rgba(212,206,196,0.1)') : 'rgba(212,206,196,0.1)';
  const tierTextColor = cogData ? (TIER_TEXT[cogData.composite_tier] ?? 'var(--muted)') : 'var(--muted)';
  const compositePct = cogData ? `${parseFloat(cogData.composite_score).toFixed(0)}%` : '—';

  const membershipCount = cogData ? formatWholeNumber(cogData.membership_count) : null;
  const revenueUsd = cogData ? formatUsd(cogData.revenue_usd) : null;
  const sizeTier = cogData && cogData.size_tier ? (SIZE_TIER_LABELS[cogData.size_tier] ?? cogData.size_tier) : null;
  const hasScaleData = cogData && Boolean(membershipCount || revenueUsd || sizeTier || cogData.size_notes);

  useEffect(() => {
    if (activeTab !== 'compounds' || !mapContainer.current) return;

    const initMap = async () => {
      try {
        // Build GeoJSON from the server-fetched compounds (source of truth: Supabase)
        const data = compoundsToGeoJSON(compounds);
        setGeojsonData(data);

        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: styleUrl('hybrid'),
          center: [0, 0],
          zoom: 1,
          maxZoom: 19,
        });

        map.current.on('load', () => {
          viewRef.current = { center: map.current.getCenter(), zoom: map.current.getZoom() };
          addDataToMap(data, filters);
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
  }, [activeTab, compounds]);

  const addDataToMap = (data, currentFilters) => {
    if (!map.current || !data) return;

    const filteredFeatures = data.features.filter(feature => {
      const props = feature.properties;
      const openedYear = parseInt(props.opened_year) || 1968;

      if (!currentFilters.confidence[props.confidence]) return false;
      if (!currentFilters.facilityType[props.facility_type]) return false;
      if (openedYear > currentFilters.year) return false;

      return true;
    });

    const sourceId = 'cog-locations';
    const layerId = 'cog-locations-layer';

    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: filteredFeatures,
      },
    });

    map.current.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': 8,
        'circle-color': ['get', 'confidence_color'],
        'circle-opacity': 0.7,
        'circle-stroke-width': 2,
        'circle-stroke-color': ['get', 'confidence_color'],
        'circle-stroke-opacity': 0.8,
      },
    });

    map.current.on('click', layerId, (e) => {
      const feature = e.features[0];
      const props = feature.properties;

      const popupHTML = `
        <div style="font-family: system-ui;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #272320;">${props.name}</h3>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #666;"><strong>${props.city}, ${props.country}</strong></p>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #666;"><strong>Type:</strong> ${props.facility_type}</p>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #666;"><strong>Timeline:</strong> ${props.opened_year}–${props.closed_year}</p>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #666;"><strong>Status:</strong> ${props.status}</p>
          <div style="display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; color: white; margin-top: 8px; background: ${props.confidence_color};">
            ${props.confidence} Confidence
          </div>
        </div>
      `;

      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popupHTML)
        .addTo(map.current);
    });

    map.current.on('mouseenter', layerId, () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', layerId, () => {
      map.current.getCanvas().style.cursor = '';
    });
  };

  const handleFilterChange = (type, value) => {
    const newFilters = { ...filters };

    if (type === 'confidence' || type === 'facilityType') {
      newFilters[type][value] = !newFilters[type][value];
    } else if (type === 'year') {
      newFilters.year = value;
    }

    setFilters(newFilters);
    if (map.current && geojsonData) {
      addDataToMap(geojsonData, newFilters);
    }
  };

  const handleStyleChange = (newStyle) => {
    if (map.current && geojsonData && viewRef.current) {
      viewRef.current = { center: map.current.getCenter(), zoom: map.current.getZoom() };
      map.current.setStyle(styleUrl(newStyle));
      setMapStyle(newStyle);

      // Re-add the layer after style change
      map.current.on('load', () => {
        map.current.easeTo({ center: viewRef.current.center, zoom: viewRef.current.zoom, duration: 0 });
        addDataToMap(geojsonData, filters);
      });
    }
  };

  // Render appropriate view based on active tab
  if (activeTab === 'movements') {
    return <SurvivorMovements compounds={compounds} journeys={journeys} />;
  }

  if (!cogData) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Research data unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {cogData && (
      <>
      {/* ── Tab Navigation ──────────────────────────────────── */}
      <div style={{ background: 'rgba(200,168,75,0.04)', borderBottom: '1px solid rgba(212,206,196,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('compounds')}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--serif)',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'compounds' ? 700 : 400,
              color: activeTab === 'compounds' ? 'var(--gold)' : 'var(--muted)',
              borderBottom: activeTab === 'compounds' ? '2px solid var(--gold)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            📍 Compound Network
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--serif)',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'movements' ? 700 : 400,
              color: activeTab === 'movements' ? 'var(--gold)' : 'var(--muted)',
              borderBottom: activeTab === 'movements' ? '2px solid var(--gold)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            🛤️ Survivor Movements
          </button>
        </div>
      </div>

      {/* ── Org-detail hero header ──────────────────────────────────── */}
      <section style={{ padding: '2.5rem 0 2rem', borderTop: `3px solid ${tierTextColor}`, borderBottom: '1px solid rgba(212,206,196,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              Research Documentation
            </span>
            <span style={{ color: 'rgba(212,206,196,0.3)', fontFamily: 'var(--mono)', fontSize: '0.6rem' }}>—</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {cogData.category}
            </span>
            <span style={{ color: 'rgba(212,206,196,0.3)', fontFamily: 'var(--mono)', fontSize: '0.6rem' }}>—</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Founded {cogData.founding_year} — Defunct {cogData.defunct_year}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 700, color: 'var(--paper)', marginBottom: '1rem', lineHeight: 1.15 }}>
            {cogData.name}
          </h1>

          {!cogData.active && (
            <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: '4px' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                ⚠ Historical organization — no longer active
              </span>
            </div>
          )}

          {/* Scoreboard */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.6rem,7vw,3.6rem)', fontWeight: 700, color: tierTextColor, lineHeight: 0.9 }}>
                {compositePct}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', background: tierColor, color: tierTextColor, border: `1px solid ${tierTextColor}55`, alignSelf: 'flex-start' }}>
                  {lbl(cogData.composite_tier)}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Group Dynamics Score
                </span>
              </div>
            </div>

            <div style={{ width: 1, background: 'rgba(212,206,196,0.15)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>
                {cogData.youngs_score}<span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>/10</span>
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Young's Score
              </span>
            </div>

            <div style={{ width: 1, background: 'rgba(212,206,196,0.15)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>
                — {cogData.trajectory}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Trajectory
              </span>
            </div>

            {membershipCount && (
              <>
                <div style={{ width: 1, background: 'rgba(212,206,196,0.15)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem', minWidth: '6.5rem' }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>
                    {membershipCount}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Membership {cogData.membership_count_year ? `· ${cogData.membership_count_year}` : ''}
                  </span>
                </div>
              </>
            )}

            {revenueUsd && (
              <>
                <div style={{ width: 1, background: 'rgba(212,206,196,0.15)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem', minWidth: '6.5rem' }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>
                    {revenueUsd}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Revenue {cogData.revenue_year ? `· ${cogData.revenue_year}` : ''}
                  </span>
                </div>
              </>
            )}

            {sizeTier && (
              <>
                <div style={{ width: 1, background: 'rgba(212,206,196,0.15)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem', minWidth: '6.5rem' }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>
                    {sizeTier}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Size
                  </span>
                </div>
              </>
            )}
          </div>

          {cogData.size_notes && hasScaleData && (
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'rgba(212,206,196,0.55)', lineHeight: 1.6, marginTop: '0.9rem', maxWidth: 860 }}>
              {cogData.size_notes}
            </p>
          )}
        </div>
      </section>

      {/* ── Sidebar + Main layout ──────────────────────────────────── */}
      <div className={styles.layout}>
        {/* Sidebar with filters */}
        <aside className={styles.sidebar}>
          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Confidence Level</h3>
            <div className={styles.checkboxGroup}>
              {['HIGH', 'MEDIUM', 'LOW'].map(level => (
                <label key={level} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={filters.confidence[level]}
                    onChange={() => handleFilterChange('confidence', level)}
                  />
                  <span>{level}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Facility Type</h3>
            <div className={styles.checkboxGroup}>
              {Object.keys(filters.facilityType).map(type => (
                <label key={type} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={filters.facilityType[type]}
                    onChange={() => handleFilterChange('facilityType', type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Timeline</h3>
            <input
              type="range"
              min="1968"
              max="2000"
              value={filters.year}
              onChange={e => handleFilterChange('year', parseInt(e.target.value))}
              className={styles.slider}
            />
            <p className={styles.yearDisplay}>Active by {filters.year}</p>
          </div>
        </aside>

        {/* Main content */}
        <main className={styles.main}>
          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {STYLE_OPTIONS.map(style => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    border: mapStyle === style.id ? '2px solid var(--gold)' : '1px solid rgba(212,206,196,0.2)',
                    background: mapStyle === style.id ? 'rgba(200,168,75,0.15)' : 'rgba(212,206,196,0.05)',
                    color: mapStyle === style.id ? 'var(--gold)' : 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: mapStyle === style.id ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.target.style.borderColor = 'var(--gold)'}
                  onMouseLeave={e => e.target.style.borderColor = mapStyle === style.id ? '2px solid var(--gold)' : '1px solid rgba(212,206,196,0.2)'}
                >
                  {style.label}
                </button>
              ))}
            </div>
            <div ref={mapContainer} className={styles.map}></div>
          </div>

          <section className={styles.content}>
            {/* Assessment Summary */}
            {cogData.summary_text && (
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  Assessment Summary
                  <span style={{ flex: 1, height: 1, background: 'rgba(212,206,196,0.15)' }} />
                </div>
                <p style={{ fontSize: '1.05rem', color: '#e8e4dc', lineHeight: 1.8, margin: 0 }}>
                  {cogData.summary_text}
                </p>
              </div>
            )}

            {/* Research Narratives (Movement Patterns, etc.) */}
            {cogData.research_narratives && cogData.research_narratives.length > 0 && (
              <>
                {cogData.research_narratives.map((narrative) => (
                  <div key={narrative.id} style={{ marginBottom: '3rem' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {narrative.title}
                      <span style={{ flex: 1, height: 1, background: 'rgba(212,206,196,0.15)' }} />
                    </div>
                    {narrative.summary && (
                      <p style={{ fontSize: '0.95rem', color: '#d4cec4', lineHeight: 1.8, marginBottom: '1rem' }}>
                        {narrative.summary}
                      </p>
                    )}
                    <div style={{ fontSize: '0.92rem', color: '#d4cec4', lineHeight: 1.85, marginBottom: '1.5rem' }}>
                      {narrative.content.split('\n\n').map((para, i) => (
                        <p key={i} style={{ marginBottom: '1rem', margin: 0 }}>
                          {para}
                        </p>
                      ))}
                    </div>
                    {narrative.sources && narrative.sources.length > 0 && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '1.5rem', padding: '1rem', background: 'rgba(244,240,232,0.02)', border: '1px solid rgba(212,206,196,0.08)', borderRadius: '3px' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--gold)' }}>
                          Sources
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                          {narrative.sources.map((source, i) => (
                            <li key={i} style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>
                              {source.source} {source.confidence && <span style={{ color: 'rgba(212,206,196,0.6)' }}>· {source.confidence}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Political Position */}
            {cogData.political_scores && (
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  Political Position
                  <span style={{ flex: 1, height: 1, background: 'rgba(212,206,196,0.15)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px' }}>
                  <div style={{ background: 'rgba(244,240,232,0.025)', border: '1px solid rgba(212,206,196,0.08)', padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.35rem' }}>Economic Axis</div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>
                      {cogData.political_scores.economic_axis > 0 ? '+' : ''}{cogData.political_scores.economic_axis}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                      {cogData.political_scores.economic_axis > 0 ? 'Right' : cogData.political_scores.economic_axis < 0 ? 'Left' : 'Center'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(244,240,232,0.025)', border: '1px solid rgba(212,206,196,0.08)', padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.35rem' }}>Authority Axis</div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>
                      {cogData.political_scores.authority_axis > 0 ? '+' : ''}{cogData.political_scores.authority_axis}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                      {cogData.political_scores.authority_axis > 0 ? 'Authoritarian' : cogData.political_scores.authority_axis < 0 ? 'Libertarian' : 'Neutral'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(244,240,232,0.025)', border: '1px solid rgba(212,206,196,0.08)', padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.35rem' }}>Quadrant</div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>
                      {cogData.political_scores.political_quadrant}
                    </div>
                  </div>
                </div>
                {cogData.political_scores.scoring_notes && (
                  <p style={{ fontSize: '0.85rem', color: 'rgba(212,206,196,0.75)', lineHeight: 1.7, marginTop: '0.75rem', marginBottom: 0 }}>
                    {cogData.political_scores.scoring_notes}
                  </p>
                )}
              </div>
            )}

            {/* Ten Criteria */}
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              Ten Criteria
              <span style={{ flex: 1, height: 1, background: 'rgba(212,206,196,0.15)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '3rem' }}>
              {cogData.criterion_scores.map(({ criterion, score, confidence, body_text }) => {
                const sColor = SCORE_COLOR(score);
                return (
                  <div key={criterion} style={{ background: 'rgba(244,240,232,0.025)', border: '1px solid rgba(212,206,196,0.08)', borderLeft: `3px solid ${sColor}`, padding: '1.25rem 1.25rem 1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: body_text ? '0.75rem' : 0, gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.12em', color: 'rgba(212,206,196,0.4)', textTransform: 'uppercase' }}>
                          {criterion}
                        </span>
                        <span style={{ fontFamily: 'var(--serif)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--paper)' }}>
                          {CRITERIA[criterion]}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                        {confidence && (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(212,206,196,0.4)', padding: '0.15rem 0.45rem', border: '1px solid rgba(212,206,196,0.12)' }}>
                            {confidence}
                          </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 48, height: 4, background: 'rgba(212,206,196,0.1)', borderRadius: 2 }}>
                            <div style={{ width: `${(score/10)*100}%`, height: '100%', background: sColor, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.95rem', fontWeight: 700, color: sColor, minWidth: '2.8rem', textAlign: 'right' }}>
                            {score}/10
                          </span>
                        </div>
                      </div>
                    </div>
                    {body_text && (
                      <p style={{ fontSize: '0.9rem', color: '#d4cec4', margin: 0, lineHeight: 1.8 }}>
                        {body_text}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Research Methodology & Sources */}
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.5rem, 2.5vw, 1.8rem)', fontWeight: 700, margin: '2rem 0 1rem', color: 'var(--paper)', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              Research Methodology
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.75, color: 'var(--muted)', marginBottom: '1.25em' }}>
              This dataset documents the global network of the Children of God (later known as The Family International), a high-control religious organization founded by David Brandt Berg in 1968. The cultiness scores reflect extensive survivor testimony, legal records, and academic documentation.
            </p>

            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.75rem', color: 'var(--cream)', lineHeight: 1.15 }}>
              Data Sources
            </h3>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25em', color: 'var(--muted)' }}>
              <li style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}>
                <strong>Survivor Testimony</strong> — Memoirs and recorded interviews (Faith Jones, Christina Babin, Davidita/Ricky Rodriguez, Daniella Young)
              </li>
              <li style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}>
                <strong>Legal Records</strong> — Court cases, police investigations, and raid documentation (UK, US, international)
              </li>
              <li style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}>
                <strong>Official Organization History</strong> — The Family International published histories and archives
              </li>
              <li style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}>
                <strong>Academic Documentation</strong> — University archives (San Diego State, Hamilton College) and cult studies research
              </li>
              <li style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}>
                <strong>News Archives</strong> — Investigative journalism and media coverage (1970s-1990s)
              </li>
            </ul>

            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.75rem', color: 'var(--cream)', lineHeight: 1.15 }}>
              Geographic Distribution
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1.5rem 0', border: '1px solid rgba(212,206,196,0.15)' }}>
              <thead style={{ background: 'rgba(200,168,75,0.08)' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gold)', borderBottom: '1px solid rgba(212,206,196,0.15)', fontFamily: 'var(--serif)', fontSize: '0.9rem' }}>Region</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gold)', borderBottom: '1px solid rgba(212,206,196,0.15)', fontFamily: 'var(--serif)', fontSize: '0.9rem' }}>Locations</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gold)', borderBottom: '1px solid rgba(212,206,196,0.15)', fontFamily: 'var(--serif)', fontSize: '0.9rem' }}>Countries</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gold)', borderBottom: '1px solid rgba(212,206,196,0.15)', fontFamily: 'var(--serif)', fontSize: '0.9rem' }}>Key Centers</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { region: 'North America', locations: 13, countries: '2 (USA, Canada)', centers: 'Huntington Beach HQ, Toronto, Vancouver' },
                  { region: 'Europe', locations: 11, countries: '6', centers: 'London HQ, Paris, Paisley, Budapest' },
                  { region: 'Latin America', locations: 7, countries: '5', centers: 'Belo Horizonte (regional hub), Rio de Janeiro' },
                  { region: 'East Asia', locations: 8, countries: '6', centers: 'Macau, Hong Kong, Tokyo, Manila' },
                  { region: 'Caribbean/Oceania', locations: 6, countries: '3', centers: 'Jamaica, Puerto Rico, Sydney' },
                ].map(row => (
                  <tr key={row.region} style={{ ':hover': { background: 'rgba(212,206,196,0.03)' } }}>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(212,206,196,0.1)', color: 'var(--muted)' }}>{row.region}</td>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(212,206,196,0.1)', color: 'var(--muted)' }}>{row.locations}</td>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(212,206,196,0.1)', color: 'var(--muted)' }}>{row.countries}</td>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(212,206,196,0.1)', color: 'var(--muted)' }}>{row.centers}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.75rem', color: 'var(--cream)', lineHeight: 1.15 }}>
              Full Sources
            </h3>
            <h4 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, margin: '1rem 0 0.5rem', color: 'var(--paper)' }}>Books & Memoirs</h4>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25em', color: 'var(--muted)' }}>
              <li style={{ marginBottom: '0.75rem' }}>Jones, Faith (2021). "Sex Cult Nun: Breaking Away from the Children of God"</li>
              <li style={{ marginBottom: '0.75rem' }}>Young, Daniella (2019). "Uncultured: A Memoir"</li>
              <li style={{ marginBottom: '0.75rem' }}>The Family International. "The Story of Davidito" (organizational account)</li>
            </ul>

            <h4 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, margin: '1rem 0 0.5rem', color: 'var(--paper)' }}>Archives</h4>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25em', color: 'var(--muted)' }}>
              <li style={{ marginBottom: '0.75rem' }}>San Diego State University — Family International Records (1940-2009)</li>
              <li style={{ marginBottom: '0.75rem' }}>Hamilton College Archives — Children of God Collection</li>
              <li style={{ marginBottom: '0.75rem' }}>XFamily.org — Survivor testimony database</li>
            </ul>

            <p style={{ background: 'rgba(139,32,32,0.1)', border: '3px solid var(--accent)', padding: '1.5rem', marginTop: '2rem', color: 'var(--accent-text)', fontStyle: 'italic' }}>
              This research is provided for educational purposes and to support survivor advocacy and academic study. All information is sourced from public records and published survivor testimony. Cultiness scores reflect the organization's systematic control mechanisms and documented harm to members.
            </p>
          </section>
        </main>
      </div>
      </>
      )}
    </div>
  );
}
