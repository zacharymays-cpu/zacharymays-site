import { getActiveCultsTimeline } from '../lib/getActiveCultsTimeline';

// Live stacked-area chart of active culty organizations per year, computed from
// current Supabase data. Static SVG (no client JS) to match the hand-rolled
// charts elsewhere on the site. Kinda Culty forms the lower band, Super Culty
// stacks above it, using the same tier colors as the Findings tier distribution.
const SUPER_COLOR = '#6b1010';
const KINDA_COLOR = '#7a4a1a';

// Fallback mirrors the live shape if the fetch fails (rare; cached hourly).
const FALLBACK = {
  series: [
    { year: 1900, super: 29, kinda: 41, total: 70 },
    { year: 2025, super: 206, kinda: 240, total: 446 },
  ],
  startYear: 1900, endYear: 2025, oldestFounding: 1540,
  currentTotal: 446, currentSuper: 206, currentKinda: 240, growthSinceStart: 376,
};

export default async function CultsOverTimeChart() {
  const data = (await getActiveCultsTimeline()) || FALLBACK;
  const { series, startYear, endYear, oldestFounding } = data;

  // Geometry (viewBox units; scales responsively via width:100%).
  const W = 800, H = 380;
  const ml = 48, mr = 16, mt = 16, mb = 40;
  const iw = W - ml - mr, ih = H - mt - mb;

  const yMax = Math.ceil(Math.max(...series.map((d) => d.total), 1) / 50) * 50;
  const xOf = (yr) => ml + ((yr - startYear) / (endYear - startYear)) * iw;
  const yOf = (v) => mt + ih - (v / yMax) * ih;

  // Stacked bands: kinda 0..kinda, super kinda..total.
  const kindaTop = series.map((d) => `${xOf(d.year)},${yOf(d.kinda)}`);
  const totalTop = series.map((d) => `${xOf(d.year)},${yOf(d.total)}`);
  const baseRev = series.slice().reverse().map((d) => `${xOf(d.year)},${yOf(0)}`);
  const kindaTopRev = series.slice().reverse().map((d) => `${xOf(d.year)},${yOf(d.kinda)}`);

  const kindaArea = `${kindaTop.join(' ')} ${baseRev.join(' ')}`;
  const superArea = `${totalTop.join(' ')} ${kindaTopRev.join(' ')}`;

  const yTicks = [];
  for (let v = 0; v <= yMax; v += yMax / 4) yTicks.push(v);
  const xTicks = [];
  for (let yr = Math.ceil(startYear / 20) * 20; yr <= endYear; yr += 20) xTicks.push(yr);

  const Stat = ({ n, l }) => (
    <div style={{ flex: '1 1 130px', border: '1px solid rgba(212,206,196,0.12)', padding: '0.9rem 1rem' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '1.5rem', color: 'var(--gold)', lineHeight: 1.1 }}>{n}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '0.35rem' }}>{l}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1rem', fontFamily: 'var(--mono)', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ width: 12, height: 12, background: SUPER_COLOR, display: 'inline-block' }} /> Super Culty
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ width: 12, height: 12, background: KINDA_COLOR, display: 'inline-block' }} /> Kinda Culty
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`Active culty organizations per year from ${startYear} to ${endYear}`}
        style={{ display: 'block', overflow: 'visible' }}>
        {/* y gridlines + labels */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={ml} y1={yOf(v)} x2={W - mr} y2={yOf(v)} stroke="rgba(212,206,196,0.10)" strokeWidth="1" />
            <text x={ml - 8} y={yOf(v) + 4} textAnchor="end" fontFamily="var(--mono)" fontSize="11" fill="var(--muted)">{v}</text>
          </g>
        ))}
        {/* x labels */}
        {xTicks.map((yr, i) => (
          <text key={i} x={xOf(yr)} y={H - mb + 20} textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--muted)">{yr}</text>
        ))}
        {/* stacked areas */}
        <polygon points={kindaArea} fill={KINDA_COLOR} fillOpacity="0.85" />
        <polygon points={superArea} fill={SUPER_COLOR} fillOpacity="0.85" />
        {/* total outline */}
        <polyline points={totalTop.join(' ')} fill="none" stroke="var(--gold)" strokeWidth="1.5" />
      </svg>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        <Stat n={data.currentTotal} l={`Active in ${endYear}`} />
        <Stat n={data.currentSuper} l="Super Culty" />
        <Stat n={data.currentKinda} l="Kinda Culty" />
        <Stat n={`+${data.growthSinceStart}`} l={`Since ${startYear}`} />
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '0.82rem', fontStyle: 'italic', marginTop: '1.25rem' }}>
        An organization counts toward a year if it was founded on or before that year
        and has no recorded year of dissolution at or before it. The series begins in {startYear};
        a tail of organizations was founded as far back as {oldestFounding}. Because few
        organizations in the dataset have a recorded dissolution year, the upward trend
        mainly reflects the accumulating population of still-active culty organizations
        rather than the rate of new formation. Figures update as new assessments are completed.
      </p>
    </div>
  );
}
