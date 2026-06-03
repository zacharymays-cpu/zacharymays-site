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
    label: 'Cultiness Spectrum',
    items: [
      { href: '/cultiness',               label: 'Overview' },
      { href: '/explore',                 label: 'Dataset Explorer' },
      { href: '/explore/map',             label: 'Geographic Map' },
      { href: '/compass',                 label: 'Political Compass' },
      { href: '/explore/compass-bubble',  label: 'Bubble Compass' },
      { href: '/explore/compass3d',       label: '3D Compass' },
      { href: '/explore/heatmap',         label: 'Criterion Heatmap' },
      { href: '/explore/distributions',   label: 'Distributions' },
      { href: '/explore/correlations',    label: 'Correlations' },
      { href: '/explore/lineage',         label: 'Formation Lineage' },
      { href: '/explore/sankey',          label: 'Category Flow' },
      { href: '/explore/sunburst',        label: 'Sunburst' },
      { href: '/explore/compare',         label: 'Head-to-Head' },
    ],
  },
  {
    label: 'Methodology',
    items: [
      { href: '/cultiness/methodology',     label: 'Scoring Methodology' },
      { href: '/cultiness/ai-methodology',  label: 'AI & Scoring' },
      { href: '/cultiness/findings',        label: 'Key Findings' },
      { href: '/cultiness/dataset',         label: 'Dataset Overview' },
    ],
  },
  { href: '/about',  label: 'About' },
  { href: '/donate', label: 'Support' },
];

function Dropdown({ item, path }) {
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
                onClick={() => setOpen(false)}>
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
          <ul className="nav__links">
            {NAV_ITEMS.map(item =>
              item.items ? (
                <Dropdown key={item.label} item={item} path={path} />
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={path === item.href || path.startsWith(item.href + '/') ? 'active' : ''}>
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
