'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './page.module.css';

import { SUPABASE_URL, ANON_KEY } from '../../../lib/supabase/config';

export default function MarineRaidersResearch() {
  const [activeTab, setActiveTab] = useState('overview');
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [geojsonData, setGeojsonData] = useState(null);
  const [mrData, setMrData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Fetch org data from Supabase
  useEffect(() => {
    const fetchOrgData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/organizations?select=id,name,slug,category,composite_score,composite_tier,youngs_score,founding_year,defunct_year,trajectory,summary_text,active,membership_count,membership_count_year,revenue_usd,revenue_year,size_tier,size_notes,political_scores(economic_axis,authority_axis,political_quadrant,scoring_notes),criterion_scores(criterion,score,confidence,body_text)&slug=eq.marine-raiders`,
          {
            headers: {
              apikey: ANON_KEY,
              Authorization: `Bearer ${ANON_KEY}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data[0]) {
            const org = data[0];
            setMrData({
              ...org,
              political_scores: Array.isArray(org.political_scores) ? org.political_scores[0] : org.political_scores,
              criterion_scores: org.criterion_scores || [],
            });
          }
        }
      } catch (error) {
        console.error('Error fetching org data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, []);

  const formatWholeNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  // Initialize map
  useEffect(() => {
    if (activeTab !== 'locations' || !mrData || !mapContainer.current) return;

    const initMap = async () => {
      try {
        const response = await fetch('/marine_raider_locations.geojson');
        const data = await response.json();
        setGeojsonData(data);

        const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
        const mapStyle = mapTilerKey
          ? `https://api.maptiler.com/maps/streets/style.json?key=${mapTilerKey}`
          : 'https://demotiles.maplibre.org/style.json';

        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: mapStyle,
          center: [-77.3667, 34.7167],
          zoom: 10,
          maxZoom: 19,
        });

        map.current.on('load', () => {
          if (data && data.features) {
            addDataToMap(data);
          }
        });
      } catch (error) {
        console.error('Error loading map or GeoJSON:', error);
      }
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mrData, activeTab]);

  const addDataToMap = (data) => {
    if (!map.current || !data) return;

    const sourceId = 'marine-raider-locations';
    const layerId = 'marine-raider-locations-layer';

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
        features: data.features,
      },
    });

    map.current.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': 10,
        'circle-color': '#dc322f',
        'circle-opacity': 0.8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });

    map.current.on('click', layerId, (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;
      const popup = new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<div class="${styles.popupContent}"><strong>${props.name}</strong><p>${props.location}</p><p style="font-size:0.9em;color:#666">${props.description || ''}</p></div>`)
        .addTo(map.current);
    });

    map.current.on('mouseenter', layerId, () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', layerId, () => {
      map.current.getCanvas().style.cursor = '';
    });
  };

  const tierColor = mrData ? (TIER_BG[mrData.composite_tier] ?? 'rgba(212,206,196,0.1)') : 'rgba(212,206,196,0.1)';
  const tierTextColor = mrData ? (TIER_TEXT[mrData.composite_tier] ?? 'var(--muted)') : 'var(--muted)';
  const compositePct = mrData ? `${parseFloat(mrData.composite_score).toFixed(0)}%` : '—';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Marine Raider Research: MARSOC Structure & Operations</h1>
        <p className={styles.subtitle}>
          Marine Forces Special Operations Command (MARSOC) — organizational structure, compound locations, and institutional analysis.
        </p>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading organization data...</div>
      ) : mrData ? (
        <>
          <div className={styles.tabNav}>
            <button
              className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'locations' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('locations')}
            >
              Locations
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'scores' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('scores')}
            >
              Scores
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className={styles.overview}>
              <div className={styles.orgDetail} style={{ backgroundColor: tierColor }}>
                <div className={styles.scoreHeader}>
                  <div className={styles.scoreMain}>
                    <div className={styles.compositePct} style={{ color: tierTextColor }}>
                      {compositePct}
                    </div>
                    <div className={styles.compositeLabel} style={{ color: tierTextColor }}>
                      {lbl(mrData.composite_tier)}
                    </div>
                  </div>
                </div>
                <div className={styles.orgInfo}>
                  <h2>{mrData.name}</h2>
                  <p><strong>Category:</strong> {mrData.category}</p>
                  <p><strong>Status:</strong> {mrData.active ? 'Active' : 'Inactive'}</p>
                  <p><strong>Founded:</strong> {mrData.founding_year}</p>
                  <p><strong>Personnel:</strong> ~3,000 active (includes support)</p>
                </div>
                <div className={styles.summary}>
                  <p>{mrData.summary_text}</p>
                </div>
              </div>

              <div className={styles.orgStructure}>
                <h3>Organizational Structure</h3>
                <div className={styles.structure}>
                  <div className={styles.structureSection}>
                    <h4>Marine Raider Regiment (MRR)</h4>
                    <ul>
                      <li>1st Marine Raider Battalion</li>
                      <li>2d Marine Raider Battalion</li>
                      <li>3d Marine Raider Battalion</li>
                    </ul>
                  </div>
                  <div className={styles.structureSection}>
                    <h4>Marine Raider Support Group (MRSG)</h4>
                    <ul>
                      <li>1st Marine Raider Support Battalion</li>
                      <li>2d Marine Raider Support Battalion</li>
                      <li>3d Marine Raider Support Battalion</li>
                    </ul>
                  </div>
                  <div className={styles.structureSection}>
                    <h4>Training</h4>
                    <ul>
                      <li>Marine Raider Training Center (MRTC)</li>
                      <li>Assessment & Selection Course</li>
                      <li>Individual Training Course</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'locations' && (
            <div className={styles.locationsTab}>
              <div ref={mapContainer} className={styles.mapContainer} />
              <div className={styles.locationsList}>
                <h3>Camp Lejeune, Stone Bay, NC</h3>
                <p>All Marine Raider units are co-located at Camp Lejeune in the Stone Bay area.</p>
                <ul>
                  <li><strong>Marine Raider Regiment (MRR) HQ</strong></li>
                  <li><strong>1st, 2d, 3d Marine Raider Battalions</strong></li>
                  <li><strong>Marine Raider Support Group (MRSG)</strong></li>
                  <li><strong>Marine Raider Training Center (MRTC)</strong></li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'scores' && (
            <div className={styles.scoresTab}>
              <div className={styles.criterionGrid}>
                <h3>Young's Group Exit Checklist Scores</h3>
                <div className={styles.scoreGrid}>
                  {mrData.criterion_scores && mrData.criterion_scores.length > 0 ? (
                    mrData.criterion_scores.map((cs) => (
                      <div key={cs.criterion} className={styles.scoreCard}>
                        <div
                          className={styles.scoreValue}
                          style={{ backgroundColor: SCORE_COLOR(cs.score), color: cs.score >= 5 ? '#fff' : '#000' }}
                        >
                          {cs.score !== null ? cs.score.toFixed(1) : 'N/A'}
                        </div>
                        <div className={styles.scoreLabel}>{CRITERIA[cs.criterion] || cs.criterion}</div>
                        {cs.body_text && <p className={styles.scoreNote}>{cs.body_text}</p>}
                      </div>
                    ))
                  ) : (
                    <p>Score data not available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={styles.error}>Organization data not found</div>
      )}
    </div>
  );
}
