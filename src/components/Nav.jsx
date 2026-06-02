'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const path = usePathname();
  const active = (href) => path === href || path.startsWith(href + '/') ? 'active' : '';
  return (
    <nav className="nav">
      <div className="container">
        <div className="nav__inner">
          <Link href="/" className="nav__brand">Zachary S. Mays</Link>
          <ul className="nav__links">
            <li><Link href="/cultiness"           className={active('/cultiness')}>The Spectrum</Link></li>
            <li><Link href="/how-we-got-here"     className={active('/how-we-got-here')}>How We Got Here</Link></li>
            <li><Link href="/assholes-in-history" className={active('/assholes-in-history')}>Assholes in History</Link></li>
            <li><Link href="/about"               className={active('/about')}>About</Link></li>
            <li><Link href="/donate"              className={active('/donate')}>Support</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
