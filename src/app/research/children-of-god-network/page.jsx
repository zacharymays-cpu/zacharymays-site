'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './page.module.css';

export default function ChildrenOfGodResearch() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [geojsonData, setGeojsonData] = useState(null);
  const [filters, setFilters] = useState({
    confidence: { HIGH: true, MEDIUM: true, LOW: true },
    facilityType: {
      'Headquarters': true,
      'Regional HQ': true,
      'Compound': true,
      'Media Center': true,
      'World Service HQ': true,
      'Training Camp': true,
      'Reprogramming Camp': true,
    },
    year: 1994,
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = async () => {
      try {
        const response = await fetch('/cog_locations.geojson');
        const data = await response.json();
        setGeojsonData(data);

        const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
        const mapStyle = mapTilerKey
          ? `https://api.maptiler.com/maps/streets/style.json?key=${mapTilerKey}`
          : 'https://demotiles.maplibre.org/style.json';

        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: mapStyle,
          center: [0, 0],
          zoom: 1,
          maxZoom: 19,
        });

        map.current.on('load', () => {
          addDataToMap(data, filters);
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
  }, []);

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

    // Remove existing layer and source if they exist
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Add source
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: filteredFeatures,
      },
    });

    // Add circle layer for markers
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

    // Add popup on click
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

    // Change cursor on hover
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Children of God / Family International</h1>
        <p className={styles.subtitle}>
          Geographic Network Documentation (1968–1994)
        </p>
        <p className={styles.byline}>
          45 compounds across 22 countries, sourced from survivor testimony and legal records
        </p>
      </header>

      <div className={styles.layout}>
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
              max="1994"
              value={filters.year}
              onChange={e => handleFilterChange('year', parseInt(e.target.value))}
              className={styles.slider}
            />
            <p className={styles.yearDisplay}>Active by {filters.year}</p>
          </div>
        </aside>

        <main className={styles.main}>
          <div ref={mapContainer} className={styles.map}></div>

          <section className={styles.content}>
            <h2>Research Methodology</h2>
            <p>
              This dataset documents the global network of the Children of God (later known as The Family International),
              a high-control religious organization founded by David Brandt Berg in 1968.
            </p>

            <h3>Data Sources</h3>
            <ul>
              <li><strong>Survivor Testimony</strong> — Memoirs and recorded interviews (Faith Jones, Daniella Young, Christina Babin, Davidito/Ricky Rodriguez)</li>
              <li><strong>Legal Records</strong> — Court cases, police investigations, and raid documentation (UK, US, international)</li>
              <li><strong>Official Organization History</strong> — The Family International published histories and archives</li>
              <li><strong>Academic Documentation</strong> — University archives (San Diego State, Hamilton College) and cult studies research</li>
              <li><strong>News Archives</strong> — Investigative journalism and media coverage (1970s-1990s)</li>
            </ul>

            <h3>Confidence Levels</h3>
            <dl>
              <dt>HIGH Confidence (9 locations)</dt>
              <dd>
                Multiple independent sources, specific addresses or coordinates, detailed survivor testimony,
                or official organization records.
              </dd>

              <dt>MEDIUM Confidence (29 locations)</dt>
              <dd>
                One credible source (survivor memoir, police record, official history) or reasonable geographic inference
                based on documented presence.
              </dd>

              <dt>LOW Confidence (7 locations)</dt>
              <dd>
                Inferred from regional expansion references or single unconfirmed mentions.
              </dd>
            </dl>

            <h2>Geographic Distribution</h2>
            <table className={styles.distributionTable}>
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Locations</th>
                  <th>Countries</th>
                  <th>Key Centers</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>North America</td>
                  <td>13</td>
                  <td>2 (USA, Canada)</td>
                  <td>Huntington Beach HQ, Toronto, Vancouver</td>
                </tr>
                <tr>
                  <td>Europe</td>
                  <td>11</td>
                  <td>6</td>
                  <td>London HQ, Paris, Paisley, Budapest</td>
                </tr>
                <tr>
                  <td>Latin America</td>
                  <td>7</td>
                  <td>5</td>
                  <td>Belo Horizonte (regional hub), Rio de Janeiro</td>
                </tr>
                <tr>
                  <td>East Asia</td>
                  <td>8</td>
                  <td>6</td>
                  <td>Macau, Hong Kong, Tokyo, Manila</td>
                </tr>
                <tr>
                  <td>Caribbean/Oceania</td>
                  <td>6</td>
                  <td>3</td>
                  <td>Jamaica, Puerto Rico, Sydney</td>
                </tr>
              </tbody>
            </table>

            <h2>Timeline: Phases of Expansion</h2>
            <dl>
              <dt>Phase 1: Founding (1968–1972)</dt>
              <dd>
                Started in Huntington Beach with 35 members. After David Berg's 1969 earthquake prophecy,
                relocated to Texas compound (1969-1971). By 1972, had 130 communities worldwide.
              </dd>

              <dt>Phase 2: Global Dispersal (1972–1980)</dt>
              <dd>
                "Flee as a Bird to Your Mountain" (1972) dispersal sent followers globally.
                Established regional hubs: Belo Horizonte (Latin America), London (Europe), Tokyo (Asia).
                By mid-1970s, ~70 countries with presence.
              </dd>

              <dt>Phase 3: Consolidation & Controversy (1980–1994)</dt>
              <dd>
                Established administrative centers (World Service in Mexico, 1980s). UK raids (1991-1992).
                David Berg died in Costa de Caparica, Portugal (October 1, 1994, age 75).
              </dd>
            </dl>

            <h2>Survivor Testimony</h2>
            <blockquote>
              <p>
                "We were constantly moved around, from Paisley I was sent to Rugby, Tewkesbury, Birmingham and Manchester
                before I finally managed to get out aged barely 15."
              </p>
              <footer>— UK survivor testimony</footer>
            </blockquote>

            <blockquote>
              <p>
                "I grew up in an isolated village in Macau... the cult sent their Tithe's Report Forms to the World Service
                Home in Japan since Macau was too small to operate one."
              </p>
              <footer>— Faith Jones, "Sex Cult Nun" memoir</footer>
            </blockquote>

            <blockquote>
              <p>
                "The Children of God controlled every aspect of our lives. We had no freedom, no privacy, and no contact with the outside world."
              </p>
              <footer>— Daniella Young, "Shattered: One Girl's Journey Through the Darkness"</footer>
            </blockquote>

            <h2>Full Sources</h2>
            <h3>Books & Memoirs</h3>
            <ul>
              <li>Jones, Faith (2021). "Sex Cult Nun: Breaking Away from the Children of God"</li>
              <li>Young, Daniella (2019). "Uncultured: A Memoir"</li>
              <li>The Family International. "The Story of Davidito" (organizational account)</li>
            </ul>

            <h3>Archives</h3>
            <ul>
              <li>San Diego State University — Family International Records (1940-2009)</li>
              <li>Hamilton College Archives — Children of God Collection</li>
              <li>XFamily.org — Survivor testimony database</li>
            </ul>

            <p className={styles.disclaimer}>
              This research is provided for educational purposes and to support survivor advocacy and academic study.
              All information is sourced from public records and published survivor testimony.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
