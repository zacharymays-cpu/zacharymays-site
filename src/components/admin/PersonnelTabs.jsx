// Personnel admin tabs: Roster, Movements, Photos, Network, Audit
// Client component — handles tab selection and styling
'use client';

export default function PersonnelTabs({ activeTab = 'roster', onTabChange }) {
  const tabs = [
    { id: 'roster', label: 'Roster', icon: '👥' },
    { id: 'movements', label: 'Movements', icon: '🗺️' },
    { id: 'photos', label: 'Photos', icon: '📷' },
    { id: 'network', label: 'Network', icon: '🕸️' },
    { id: 'audit', label: 'Audit', icon: '📋' }
  ];

  const GOLD = '#c9a86a';
  const BORDER = 'rgba(244,240,232,0.18)';
  const MUTED = 'rgba(244,240,232,0.62)';

  return (
    <nav style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
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
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
