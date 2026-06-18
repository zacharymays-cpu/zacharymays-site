'use client';

export default function NetworkTabs({ activeTab, onChange }) {
  return (
    <>
      <button
        onClick={() => onChange('compounds')}
        style={{
          padding: '1rem 0',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--serif)',
          fontSize: '0.95rem',
          fontWeight: activeTab === 'compounds' ? 700 : 400,
          color: activeTab === 'compounds' ? 'var(--gold)' : 'var(--muted)',
          borderBottom: activeTab === 'compounds' ? '2px solid var(--gold)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        📍 Compound Network
      </button>
      <button
        onClick={() => onChange('movements')}
        style={{
          padding: '1rem 0',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--serif)',
          fontSize: '0.95rem',
          fontWeight: activeTab === 'movements' ? 700 : 400,
          color: activeTab === 'movements' ? 'var(--gold)' : 'var(--muted)',
          borderBottom: activeTab === 'movements' ? '2px solid var(--gold)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        🛤️ Survivor Movements
      </button>
    </>
  );
}
