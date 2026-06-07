'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Shared chart-switcher shown on every visualization page so you can hop
// between views without returning to the Explorer first.
const VIEWS = [
  ['Explorer',      '/explore'],
  ['Heatmap',       '/explore/heatmap'],
  ['Distributions', '/explore/distributions'],
  ['Timeline',      '/explore/timeline'],
  ['Correlations',  '/explore/correlations'],
  ['Lineage',       '/explore/lineage'],
  ['Sunburst',      '/explore/sunburst'],
  ['Flow',          '/explore/sankey'],
  ['Compare',       '/explore/compare'],
  ['Map',           '/explore/map'],
  ['Compass',       '/compass'],
];

export default function ExploreNav({ title, meta }) {
  const path = usePathname();
  return (
    <div className="container--wide" style={{ paddingTop: '1.5rem' }}>
      <div style={{
        display: 'flex', gap: '0.75rem 1.25rem', flexWrap: 'wrap', alignItems: 'baseline',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(212,206,196,0.1)', paddingBottom: '1rem',
      }}>
        {/* Left: page title (falls back to the section label) + optional meta */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.9rem', flexWrap: 'wrap', minWidth: 0 }}>
          {title ? (
            <h1 style={{
              fontFamily: 'var(--serif)', fontSize: 'clamp(1.3rem,3vw,2rem)',
              fontWeight: 700, color: 'var(--paper)', margin: 0, lineHeight: 1.1,
            }}>{title}</h1>
          ) : (
            <Link href="/cultiness" style={{
              fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none',
            }}>The Cultiness Spectrum</Link>
          )}
          {meta && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--muted)' }}>{meta}</span>
          )}
        </div>
        {/* Right: chart switcher */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
          {VIEWS.map(([label, href]) => {
            const active = path === href;
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined} style={{
                fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.08em',
                textTransform: 'uppercase', textDecoration: 'none',
                padding: '0.35rem 0.65rem',
                border: `1px solid ${active ? 'rgba(200,168,75,0.5)' : 'rgba(212,206,196,0.2)'}`,
                color: active ? 'var(--gold)' : 'var(--muted)',
                background: active ? 'rgba(200,168,75,0.08)' : 'transparent',
              }}>{label}</Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
