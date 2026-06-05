'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Shared chart-switcher shown on every visualization page so you can hop
// between views without returning to the Explorer first.
const VIEWS = [
  ['Explorer',      '/explore'],
  ['Heatmap',       '/explore/heatmap'],
  ['Distributions', '/explore/distributions'],
  ['Correlations',  '/explore/correlations'],
  ['Lineage',       '/explore/lineage'],
  ['Sunburst',      '/explore/sunburst'],
  ['Flow',          '/explore/sankey'],
  ['Compare',       '/explore/compare'],
  ['Map',           '/explore/map'],
  ['Compass',       '/compass'],
];

export default function ExploreNav() {
  const path = usePathname();
  return (
    <div className="container--wide" style={{ paddingTop: '1.5rem' }}>
      <div style={{
        display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center',
        borderBottom: '1px solid rgba(212,206,196,0.1)', paddingBottom: '1rem',
      }}>
        <Link href="/cultiness" style={{
          fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.16em',
          textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none',
          marginRight: '0.4rem',
        }}>The Cultiness Spectrum</Link>
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
  );
}
