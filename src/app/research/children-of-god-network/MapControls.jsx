'use client';

const BTN = {
  width: '30px',
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(20,18,16,0.8)',
  color: 'var(--paper)',
  border: '1px solid rgba(212,206,196,0.2)',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  lineHeight: 1,
  userSelect: 'none',
};

export default function MapControls({ mapRef }) {
  const zoomIn = () => { if (!mapRef.current) return; mapRef.current.zoomIn(); };
  const zoomOut = () => { if (!mapRef.current) return; mapRef.current.zoomOut(); };
  const panN = () => { if (!mapRef.current) return; mapRef.current.panBy([0, -150]); };
  const panS = () => { if (!mapRef.current) return; mapRef.current.panBy([0, 150]); };
  const panW = () => { if (!mapRef.current) return; mapRef.current.panBy([-150, 0]); };
  const panE = () => { if (!mapRef.current) return; mapRef.current.panBy([150, 0]); };

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        alignItems: 'center',
      }}
    >
      {/* Zoom controls */}
      <button onClick={zoomIn} style={BTN} title="Zoom in">+</button>
      <button onClick={zoomOut} style={BTN} title="Zoom out">−</button>

      {/* Spacer */}
      <div style={{ height: '6px' }} />

      {/* Pan compass — 3×3 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 30px)', gridTemplateRows: 'repeat(3, 30px)', gap: '2px' }}>
        {/* Row 1: empty, N, empty */}
        <div />
        <button onClick={panN} style={BTN} title="Pan north">▲</button>
        <div />
        {/* Row 2: W, empty, E */}
        <button onClick={panW} style={BTN} title="Pan west">◀</button>
        <div />
        <button onClick={panE} style={BTN} title="Pan east">▶</button>
        {/* Row 3: empty, S, empty */}
        <div />
        <button onClick={panS} style={BTN} title="Pan south">▼</button>
        <div />
      </div>
    </div>
  );
}
