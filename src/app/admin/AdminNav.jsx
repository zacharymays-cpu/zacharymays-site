// Shared nav for the admin consoles (Review / Curator / Intake). Pass `active`
// (the current path) to highlight the current page. Server component — plain links.
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import IdleTimeout from './IdleTimeout';

const LINKS = [
  { href: '/admin/review', label: 'Review' },
  { href: '/admin/curator', label: 'Curator' },
  { href: '/admin/intake', label: 'Intake' },
  { href: '/admin/photos', label: 'Photos' },
];

const GOLD = '#c9a86a';
const BORDER = 'rgba(244,240,232,0.18)';
const MUTED = 'rgba(244,240,232,0.62)';

export default function AdminNav({ active }) {
  return (
    <nav style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {LINKS.map((l) => {
        const isActive = l.href === active;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive ? 'page' : undefined}
            style={{
              padding: '5px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              border: `1px solid ${isActive ? GOLD : BORDER}`,
              background: isActive ? GOLD : 'transparent',
              color: isActive ? '#1f1c19' : MUTED,
            }}
          >
            {l.label}
          </Link>
        );
      })}
      <LogoutButton />
      <IdleTimeout />
    </nav>
  );
}
