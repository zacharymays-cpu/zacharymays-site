'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const NAV_ITEMS = [
  {
    label: 'Books',
    items: [
      { href: '/how-we-got-here',     label: 'How We Got Here' },
      { href: '/assholes-in-history', label: 'Assholes in History' },
    ],
  },
  {
    label: 'Organizational Coercion Index',
    items: [
      { href: '/cultiness',               label: 'Overview' },
      { href: '/explore',                 label: 'Dataset Explorer' },
      { href: '/explore/map',             label: 'Geographic Map' },
      { href: '/compass',                 label: 'Political Compass' },
      { href: '/explore/heatmap',         label: 'Criterion Heatmap' },
      { href: '/explore/distributions',   label: 'Distributions' },
      { href: '/explore/timeline',        label: 'Active Over Time' },
      { href: '/explore/correlations',    label: 'Correlations' },
      { href: '/explore/lineage',         label: 'Formation Lineage' },
      { href: '/explore/sankey',          label: 'Category Flow' },
      { href: '/explore/sunburst',        label: 'Sunburst' },
      { href: '/explore/compare',         label: 'Head-to-Head' },
      { href: '/research/children-of-god-network', label: 'Children of God Network' },
    ],
  },
  {
    label: 'Methodology',
    items: [
      { href: '/cultiness/methodology',     label: 'Scoring Methodology' },
      { href: '/cultiness/ai-methodology',  label: 'AI & Scoring' },
      { href: '/cultiness/findings',        label: 'Key Findings' },
      { href: '/findings',                  label: 'Distribution Analysis' },
      { href: '/cultiness/dataset',         label: 'Dataset Overview' },
    ],
  },
  { href: '/about',  label: 'About' },
  { href: '/donate', label: 'Support' },
];

function Dropdown({ item, path, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isActive = item.items?.some(i => path === i.href || path.startsWith(i.href + '/'));

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <li ref={ref} className="nav__dropdown-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      <button
        className={`nav__dropdown-trigger${isActive ? ' active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true">
        {item.label}
        <span className={`nav__caret${open ? ' open' : ''}`} aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="nav__dropdown" role="menu">
          {item.items.map(child => (
            <li key={child.href} role="none">
              <Link
                href={child.href}
                role="menuitem"
                className={path === child.href || path.startsWith(child.href + '/') ? 'active' : ''}
                onClick={() => { setOpen(false); onNavigate?.(); }}>
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Nav() {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="nav">
      <div className="container">
        <div className="nav__inner">
          <Link href="/" className="nav__brand" onClick={() => setMobileOpen(false)}>
            Zachary S. Mays
          </Link>
          <button
            className={`nav__hamburger${mobileOpen ? ' open' : ''}`}
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="primary-nav">
            <span /><span /><span />
          </button>
          <ul id="primary-nav" className={`nav__links${mobileOpen ? ' open' : ''}`}>
            {NAV_ITEMS.map(item =>
              item.items ? (
                <Dropdown key={item.label} item={item} path={path} onNavigate={() => setMobileOpen(false)} />
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={path === item.href || path.startsWith(item.href + '/') ? 'active' : ''}
                    onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
