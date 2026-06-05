import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Zachary S. Mays — The Cultiness Spectrum';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#1a1714',
          padding: '80px',
          color: '#f4f0e8',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 8, textTransform: 'uppercase', color: '#c8a84b' }}>
          Zachary S. Mays
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.04 }}>The Cultiness Spectrum</div>
          <div style={{ fontSize: 34, color: '#9a948c', marginTop: 28, maxWidth: 900 }}>
            A systematic, evenhanded assessment of cult-adjacent dynamics across American organizations.
          </div>
        </div>
        <div style={{ fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: '#6b6560' }}>
          How We Got Here · Assholes in History
        </div>
      </div>
    ),
    { ...size }
  );
}
