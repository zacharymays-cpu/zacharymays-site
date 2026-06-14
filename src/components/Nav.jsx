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
      { href: '/oci',               label: 'Overview' },
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
      { href: '/research/marine-raiders-network', label: 'Marine Raiders (MARSOC)' },
    ],
  },
  {
    label: 'Methodology',
    items: [
      { href: '/oci/methodology',     label: 'Scoring Methodology' },
      { href: '/oci/ai-methodology',  label: 'AI & Scoring' },
      { href: '/oci/findings',        label: 'Key Findings' },
      { href: '/findings',                  label: 'Distribution Analysis' },
      { href: '/oci/dataset',         label: 'Dataset Overview' },
    ],
  },
  {
    label: 'Research System',
    items: [
      { href: '/research-system',                    label: 'Overview' },
      { href: '/research-system/v4-anchor-heuristic', label: 'V4.0: Anchor Heuristic' },
      { href: '/research-system/v5-0-evidence-jury',  label: 'V5.0: Evidence Jury' },
      { href: '/research-system/v5-1-formal-validation', label: 'V5.1: Formal Validation' },
      { href: '/research-system/v5-2-deepseek-case-study', label: 'V5.2: Case Study' },
      { href: '/research-system/v6-0-lifton-framework', label: 'V6.0: Lifton Framework' },
      { href: '/research-system/v6-1-permanence-aware', label: 'V6.1: Permanence-Aware' },
      { href: '/research-system/evolution-timeline', label: 'Evolution Timeline' },
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
