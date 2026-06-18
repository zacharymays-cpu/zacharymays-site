'use client';

export default function BasemapSwitcher({ styles: mapStyles, current, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
      {mapStyles.map((style) => (
        <button
          key={style.id}
          onClick={() => onChange(style.id)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: current === style.id ? '2px solid var(--gold)' : '1px solid rgba(212,206,196,0.2)',
            background: current === style.id ? 'rgba(200,168,75,0.15)' : 'rgba(212,206,196,0.05)',
            color: current === style.id ? 'var(--gold)' : 'var(--muted)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: current === style.id ? 600 : 400,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = current === style.id
              ? 'var(--gold)'
              : 'rgba(212,206,196,0.2)';
          }}
        >
          {style.label}
        </button>
      ))}
    </div>
  );
}
