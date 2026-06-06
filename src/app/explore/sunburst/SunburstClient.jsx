'use client';
import { useState, useEffect, useRef } from 'react';

const TIER_COLORS = {
  'Super Culty':  '#e8574d',
  'Kinda Culty':  '#d99b3e',
  'Not Culty':    '#5cb878',
};

const TIER_ORDER = ['Super Culty','Kinda Culty','Not Culty'];

export default function SunburstClient({ data = [] }) {
  const svgRef   = useRef(null);
  const [path,   setPath]   = useState([]); // breadcrumb trail
  const [hovered,setHovered]= useState(null);
  const [view,   setView]   = useState('tier'); // 'tier' | 'category'

  const WIDTH = 560, HEIGHT = 560, RADIUS = Math.min(WIDTH, HEIGHT) / 2;

  // Build hierarchy: root → tiers → categories → (count)
  const hierarchy = (() => {
    const tiers = {};
    data.forEach(({ composite_tier, category, count, avg_score }) => {
      if (!tiers[composite_tier]) tiers[composite_tier] = { name: composite_tier, children: {}, total: 0, avg_score: [] };
      if (!tiers[composite_tier].children[category])
        tiers[composite_tier].children[category] = { name: category, value: 0, avg_score: [] };
      tiers[composite_tier].children[category].value += parseInt(count);
      tiers[composite_tier].children[category].avg_score.push(parseFloat(avg_score));
      tiers[composite_tier].total += parseInt(count);
    });
    return TIER_ORDER.filter(t => tiers[t]).map(t => ({
      name:  t,
      total: tiers[t].total,
      color: TIER_COLORS[t],
      children: Object.values(tiers[t].children).sort((a,b) => b.value - a.value),
    }));
  })();

  const totalOrgs = hierarchy.reduce((s, t) => s + t.total, 0);

  // D3 sunburst rendered on SVG
  useEffect(() => {
    if (!svgRef.current || !hierarchy.length) return;
    const svg = svgRef.current;
    svg.innerHTML = '';

    // Compute arc slices
    // Outer ring: categories within each tier
    // Inner ring: tiers

    // Inner arc (tiers)
    const innerR0 = RADIUS * 0.18, innerR1 = RADIUS * 0.48;
    // Outer arc (categories)
    const outerR0 = RADIUS * 0.5,  outerR1 = RADIUS * 0.9;

    let tierAngle = 0;
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('transform', `translate(${WIDTH/2},${HEIGHT/2})`);
    svg.appendChild(g);

    hierarchy.forEach(tier => {
      const tierFrac = tier.total / totalOrgs;
      const tierStart = tierAngle;
      const tierEnd   = tierAngle + tierFrac * 2 * Math.PI;
      tierAngle = tierEnd;

      // Inner tier arc
      const tierPath = arcPath(innerR0, innerR1, tierStart + 0.01, tierEnd - 0.01);
      const tp = document.createElementNS('http://www.w3.org/2000/svg','path');
      tp.setAttribute('d', tierPath);
      tp.setAttribute('fill', tier.color);
      tp.setAttribute('fill-opacity', '0.9');
      tp.setAttribute('stroke', 'rgba(18,14,10,0.4)');
      tp.setAttribute('stroke-width', '1');
      tp.style.cursor = 'pointer';
      tp.setAttribute('data-tier', tier.name);
      tp.addEventListener('mouseenter', () => setHovered({ type: 'tier', ...tier }));
      tp.addEventListener('mouseleave', () => setHovered(null));
      g.appendChild(tp);

      // Tier label
      const midAngle = (tierStart + tierEnd) / 2 - Math.PI / 2;
      const labelR = (innerR0 + innerR1) / 2;
      if (tierFrac > 0.05) {
        const lx = Math.cos(midAngle) * labelR;
        const ly = Math.sin(midAngle) * labelR;
        const text = document.createElementNS('http://www.w3.org/2000/svg','text');
        text.setAttribute('x', lx);
        text.setAttribute('y', ly);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'rgba(244,240,232,0.9)');
        text.setAttribute('font-size', '8');
        text.setAttribute('font-family', 'monospace');
        text.setAttribute('pointer-events', 'none');
        text.textContent = tier.total;
        g.appendChild(text);
      }

      // Outer category arcs
      let catAngle = tierStart;
      tier.children.forEach(cat => {
        const catFrac = cat.value / tier.total;
        const catStart = catAngle;
        const catEnd   = catAngle + catFrac * (tierEnd - tierStart);
        catAngle = catEnd;

        const cp = document.createElementNS('http://www.w3.org/2000/svg','path');
        cp.setAttribute('d', arcPath(outerR0, outerR1, catStart + 0.005, catEnd - 0.005));
        cp.setAttribute('fill', tier.color);
        cp.setAttribute('fill-opacity', '0.45');
        cp.setAttribute('stroke', 'rgba(18,14,10,0.3)');
        cp.setAttribute('stroke-width', '0.5');
        cp.style.cursor = 'pointer';
        cp.addEventListener('mouseenter', () => setHovered({ type: 'category', tier: tier.name, color: tier.color, ...cat }));
        cp.addEventListener('mouseleave', () => setHovered(null));
        g.appendChild(cp);

        // Category label for larger slices
        if (catFrac > 0.08 && (catEnd - catStart) > 0.15) {
          const labelMid = (catStart + catEnd) / 2 - Math.PI / 2;
          const labelRad = (outerR0 + outerR1) / 2;
          const clx = Math.cos(labelMid) * labelRad;
          const cly = Math.sin(labelMid) * labelRad;
          const ctext = document.createElementNS('http://www.w3.org/2000/svg','text');
          ctext.setAttribute('x', clx);
          ctext.setAttribute('y', cly);
          ctext.setAttribute('text-anchor', 'middle');
          ctext.setAttribute('dominant-baseline', 'middle');
          ctext.setAttribute('fill', 'rgba(244,240,232,0.7)');
          ctext.setAttribute('font-size', '7');
          ctext.setAttribute('font-family', 'monospace');
          ctext.setAttribute('pointer-events', 'none');
          ctext.setAttribute('transform', `rotate(${(labelMid + Math.PI/2) * 180/Math.PI},${clx},${cly})`);
          ctext.textContent = cat.name.length > 14 ? cat.name.slice(0,12)+'…' : cat.name;
          g.appendChild(ctext);
        }
      });
    });

    // Center text
    const centerG = document.createElementNS('http://www.w3.org/2000/svg','g');
    const ct = document.createElementNS('http://www.w3.org/2000/svg','text');
    ct.setAttribute('text-anchor','middle'); ct.setAttribute('dominant-baseline','middle');
    ct.setAttribute('fill','var(--paper)'); ct.setAttribute('font-size','22');
    ct.setAttribute('font-family','serif'); ct.setAttribute('y','-6');
    ct.textContent = totalOrgs;
    const ct2 = document.createElementNS('http://www.w3.org/2000/svg','text');
    ct2.setAttribute('text-anchor','middle'); ct2.setAttribute('dominant-baseline','middle');
    ct2.setAttribute('fill','rgba(212,206,196,0.45)'); ct2.setAttribute('font-size','9');
    ct2.setAttribute('font-family','monospace'); ct2.setAttribute('y','12');
    ct2.textContent = 'organizations';
    centerG.appendChild(ct); centerG.appendChild(ct2);
    centerG.setAttribute('transform',`translate(${WIDTH/2},${HEIGHT/2})`);
    svg.appendChild(centerG);

  }, [hierarchy, totalOrgs]);

  function arcPath(r0, r1, startAngle, endAngle) {
    const s = startAngle - Math.PI/2, e = endAngle - Math.PI/2;
    const x0 = Math.cos(s)*r0, y0 = Math.sin(s)*r0;
    const x1 = Math.cos(e)*r0, y1 = Math.sin(e)*r0;
    const x2 = Math.cos(e)*r1, y2 = Math.sin(e)*r1;
    const x3 = Math.cos(s)*r1, y3 = Math.sin(s)*r1;
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${r0} ${r0} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r1} ${r1} 0 ${large} 0 ${x3} ${y3} Z`;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(212,206,196,0.1)', padding: '1.25rem 0 0.9rem', background: 'var(--ink)', position: 'sticky', top: '60px', zIndex: 50 }}>
        <div className="container--wide">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
              Inner ring: tiers · Outer ring: categories within tier
            </span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', flex: 1, gap: 0 }}>
        {/* Sunburst */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <svg ref={svgRef} width={WIDTH} height={HEIGHT} style={{ maxWidth: '100%', overflow: 'visible' }} />
        </div>

        {/* Right panel: hover detail + tier legend */}
        <div style={{ background: 'rgba(244,240,232,0.02)', borderLeft: '1px solid rgba(212,206,196,0.08)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>

          {/* Hover detail card */}
          {hovered ? (
            <div style={{ padding: '1rem', background: 'rgba(244,240,232,0.04)', border: `1px solid ${hovered.color}40` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: hovered.color }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: hovered.color }}>
                  {hovered.type === 'tier' ? 'Tier' : hovered.tier}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.5rem' }}>
                {hovered.name}
              </p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--gold)' }}>
                {hovered.total || hovered.value} organizations
              </p>
              {hovered.type === 'category' && hovered.avg_score?.length > 0 && (
                <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                  Avg score: {(hovered.avg_score.reduce((a,b)=>a+b,0)/hovered.avg_score.length).toFixed(1)}%
                </p>
              )}
              {hovered.type === 'tier' && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {hovered.children?.map(cat => (
                    <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '0.6rem' }}>
                      <span style={{ color: 'var(--muted)' }}>{cat.name}</span>
                      <span style={{ color: 'var(--gold)' }}>{cat.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '1rem', background: 'rgba(244,240,232,0.02)', border: '1px solid rgba(212,206,196,0.08)' }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                Hover any slice to see details.<br />
                Inner ring shows tier totals.<br />
                Outer ring shows category breakdown within each tier.
              </p>
            </div>
          )}

          {/* Tier summary table */}
          <div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.75rem' }}>All Tiers</p>
            {hierarchy.map(tier => (
              <div key={tier.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem 0', borderBottom: '1px solid rgba(212,206,196,0.05)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: tier.color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--muted)', flex: 1 }}>{tier.name}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700 }}>{tier.total}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'rgba(212,206,196,0.35)', width: 38, textAlign: 'right' }}>
                  {((tier.total / totalOrgs) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
