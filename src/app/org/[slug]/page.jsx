// src/app/org/[slug]/page.jsx
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 300

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function getOrg(slug) {
  const supabase = getSupabase()
  const { data: org, error } = await supabase
    .from('organizations')
    .select(`
      id, name, slug, category, membership_scope,
      composite_score, composite_tier,
      youngs_score, youngs_band,
      trajectory, summary_text,
      methodology_version, updated_at, active,
      political_scores ( economic_axis, authority_axis, political_quadrant, scoring_notes ),
      criterion_scores ( criterion, score, confidence, na_rationale, body_text )
    `)
    .eq('slug', slug)
    .single()
  if (error || !org) return null
  return org
}

export async function generateMetadata({ params }) {
  const org = await getOrg(params.slug)
  if (!org) return { title: 'Organization Not Found' }
  return {
    title: `${org.name} — Cultiness Spectrum`,
    description: `${org.name} scored ${org.composite_score}% (${org.composite_tier}). Young's Score: ${org.youngs_score}/10.`,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
const TIER_TEXT = {
  'Cult':          '#dc322f',
  'Cult Dynamics': '#cb4b16',
  'High Control':  '#b58900',
  'Concerning':    '#6c71c4',
  'Mildly Culty':  '#2aa198',
  'Healthy Group': '#859900',
}
const TIER_BG = {
  'Cult':          'rgba(220,50,47,0.12)',
  'Cult Dynamics': 'rgba(203,75,22,0.12)',
  'High Control':  'rgba(181,137,0,0.12)',
  'Concerning':    'rgba(108,113,196,0.12)',
  'Mildly Culty':  'rgba(42,161,152,0.12)',
  'Healthy Group': 'rgba(133,153,0,0.12)',
}

const SCORE_COLOR = (s) => {
  if (s == null) return 'rgba(212,206,196,0.4)'
  if (s >= 9) return '#dc322f'
  if (s >= 7) return '#cb4b16'
  if (s >= 5) return '#b58900'
  if (s >= 3) return '#859900'
  return '#2aa198'
}

const CRITERIA = {
  C1:'Charismatic Leadership', C2:'Sacred Assumptions',    C3:'Transcendent Mission',
  C4:'Identity Sublimation',   C5:'Information Isolation', C6:'Private Vernacular',
  C7:'Us-vs-Them Dynamics',    C8:'Labor Exploitation',    C9:'Exit Costs',
  C10:'Ends Justify Means',
}

const TRAJ = { Escalating:'↑ Escalating', Stable:'→ Stable', Declining:'↓ Declining', Defunct:'— Defunct' }

// ── SVG Spider/Radar chart ────────────────────────────────────────────────
function RadarChart({ criteria, tierColor }) {
  const N = 10
  const cx = 120, cy = 120, R = 95
  const spokes = Array.from({ length: N }, (_, i) => {
    const a = (2 * Math.PI * i) / N - Math.PI / 2
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a }
  })

  // Build polygon for scored criteria (skip N/A)
  const pts = spokes.map((sp, i) => {
    const key = `C${i + 1}`
    const c = criteria.find(c => c.criterion === key)
    const v = (c && c.score != null) ? c.score / 10 : 0
    return { x: cx + R * v * Math.cos(sp.a), y: cy + R * v * Math.sin(sp.a), v, key }
  })
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')

  // Grid rings at 2,4,6,8,10
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <svg viewBox="0 0 240 240" style={{ width: '100%', maxWidth: 260, display: 'block', margin: '0 auto' }}>
      {/* Grid rings */}
      {rings.map(r => {
        const rpts = spokes.map(sp => `${cx + R * r * Math.cos(sp.a)},${cy + R * r * Math.sin(sp.a)}`).join(' ')
        return <polygon key={r} points={rpts} fill="none" stroke="rgba(212,206,196,0.1)" strokeWidth="1" />
      })}
      {/* Spokes */}
      {spokes.map((sp, i) => (
        <line key={i} x1={cx} y1={cy} x2={sp.x} y2={sp.y} stroke="rgba(212,206,196,0.12)" strokeWidth="1" />
      ))}
      {/* Data polygon */}
      <polygon points={polyline} fill={tierColor.replace('0.12', '0.25')} stroke={tierColor.replace(/rgba\(([^,]+,[^,]+,[^,]+),.+\)/, 'rgba($1,0.8)')} strokeWidth="1.5" />
      {/* Dots + labels */}
      {spokes.map((sp, i) => {
        const key = `C${i + 1}`
        const c = criteria.find(c => c.criterion === key)
        const isNA = !c || c.score == null
        const v = isNA ? 0 : c.score / 10
        const dotX = cx + R * v * Math.cos(sp.a)
        const dotY = cy + R * v * Math.sin(sp.a)
        // Label positioning
        const lx = cx + (R + 14) * Math.cos(sp.a)
        const ly = cy + (R + 14) * Math.sin(sp.a)
        const anchor = sp.a > -0.2 && sp.a < 0.2 ? 'middle'
          : Math.cos(sp.a) > 0.1 ? 'start'
          : Math.cos(sp.a) < -0.1 ? 'end' : 'middle'
        return (
          <g key={key}>
            <text x={lx} y={ly + 4} textAnchor={anchor} fontSize="8.5" fontFamily="monospace" fill="rgba(212,206,196,0.75)">{key}</text>
            {!isNA && <circle cx={dotX} cy={dotY} r="3.5" fill={SCORE_COLOR(c.score)} />}
          </g>
        )
      })}
      {/* Center */}
      <circle cx={cx} cy={cy} r="2" fill="rgba(212,206,196,0.3)" />
    </svg>
  )
}

// ── Mini political quad compass ───────────────────────────────────────────
function MiniCompass({ econ, auth, quadrant, tierColor }) {
  const W = 180, H = 180, PAD = 20
  const INNER = W - PAD * 2
  const cx = PAD + ((parseFloat(econ) + 5) / 10) * INNER
  const cy = PAD + ((5 - parseFloat(auth)) / 10) * INNER
  const tc = tierColor.replace(/rgba\(([^,]+,[^,]+,[^,]+),.+\)/, 'rgba($1,0.9)')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 200, display: 'block', margin: '0 auto' }}>
      {/* Quadrant fills */}
      <rect x={PAD} y={PAD} width={INNER/2} height={INNER/2} fill="rgba(139,32,32,0.07)" />
      <rect x={PAD+INNER/2} y={PAD} width={INNER/2} height={INNER/2} fill="rgba(120,100,30,0.07)" />
      <rect x={PAD} y={PAD+INNER/2} width={INNER/2} height={INNER/2} fill="rgba(42,107,74,0.06)" />
      <rect x={PAD+INNER/2} y={PAD+INNER/2} width={INNER/2} height={INNER/2} fill="rgba(42,107,74,0.05)" />
      {/* Grid */}
      {[-3,-1,1,3].map(v => {
        const px = PAD + ((v+5)/10)*INNER
        const py = PAD + ((5-v)/10)*INNER
        return <g key={v}>
          <line x1={px} y1={PAD} x2={px} y2={PAD+INNER} stroke="rgba(212,206,196,0.05)" strokeWidth="1" />
          <line x1={PAD} y1={py} x2={PAD+INNER} y2={py} stroke="rgba(212,206,196,0.05)" strokeWidth="1" />
        </g>
      })}
      {/* Axes */}
      <line x1={PAD} y1={W/2} x2={PAD+INNER} y2={W/2} stroke="rgba(212,206,196,0.2)" strokeWidth="1" />
      <line x1={W/2} y1={PAD} x2={W/2} y2={PAD+INNER} stroke="rgba(212,206,196,0.2)" strokeWidth="1" />
      {/* Axis labels */}
      {[[PAD+3,W/2-4,'start','◀ L'],[PAD+INNER-3,W/2-4,'end','R ▶'],[W/2,PAD-4,'middle','▲ Auth'],[W/2,PAD+INNER+11,'middle','▼ Lib']].map(([x,y,a,t]) => (
        <text key={t} x={x} y={y} textAnchor={a} fill="rgba(212,206,196,0.3)" fontSize="7" fontFamily="monospace">{t}</text>
      ))}
      {/* Dot with glow */}
      <circle cx={cx} cy={cy} r={12} fill={tc.replace('0.9)', '0.12)')} />
      <circle cx={cx} cy={cy} r={6} fill={tc} />
      <circle cx={cx} cy={cy} r={2.5} fill="rgba(244,240,232,0.9)" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function OrgPage({ params }) {
  const org = await getOrg(params.slug)
  if (!org) notFound()

  const criteria = [...(org.criterion_scores || [])]
    .sort((a, b) => parseInt(a.criterion.replace('C','')) - parseInt(b.criterion.replace('C','')))

  const ps          = org.political_scores?.[0] ?? null
  const tierColor   = TIER_BG[org.composite_tier]   ?? 'rgba(212,206,196,0.1)'
  const tierText    = TIER_TEXT[org.composite_tier]  ?? 'var(--muted)'
  const lastUpdated = new Date(org.updated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <>
      {/* ── Compact hero ────────────────────────────────────────────── */}
      <section style={{ padding: '2.5rem 0 2rem', borderBottom: '1px solid rgba(212,206,196,0.1)' }}>
        <div className="container--wide">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <Link href="/explore" style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none' }}>
              Dataset Explorer
            </Link>
            <span style={{ color: 'rgba(212,206,196,0.3)', fontFamily: 'var(--mono)', fontSize: '0.6rem' }}>—</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {org.category}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 700, color: 'var(--paper)', marginBottom: '1rem', lineHeight: 1.15 }}>
            {org.name}
          </h1>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.3rem 0.75rem', background: tierColor, color: tierText, border: `1px solid ${tierText}50` }}>
              {org.composite_tier}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.3rem 0.75rem', background: 'rgba(244,240,232,0.06)', color: 'rgba(212,206,196,0.85)', border: '1px solid rgba(212,206,196,0.28)' }}>
              {TRAJ[org.trajectory] ?? org.trajectory}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', padding: '0.3rem 0.75rem', background: 'rgba(244,240,232,0.04)', color: tierText, border: `1px solid ${tierText}30`, fontWeight: 700 }}>
              {parseFloat(org.composite_score).toFixed(0)}%
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', padding: '0.3rem 0.75rem', background: 'rgba(244,240,232,0.06)', color: 'rgba(212,206,196,0.85)', border: '1px solid rgba(212,206,196,0.28)' }}>
              Young's {org.youngs_score}/10 · {org.youngs_band}
            </span>
          </div>
        </div>
      </section>

      <section style={{ padding: '3rem 0' }}>
        <div className="container--wide">
          {/* ── Two-column layout ──────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '4rem', alignItems: 'start' }}>

            {/* ── LEFT: main content ─────────────────────────────────── */}
            <div>

              {/* Summary */}
              {org.summary_text && (
                <div style={{ marginBottom: '3rem' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    Assessment Summary
                    <span style={{ flex: 1, height: 1, background: 'rgba(212,206,196,0.15)' }} />
                  </div>
                  <p style={{ fontSize: '1.05rem', color: '#e8e4dc', lineHeight: 1.8, margin: 0 }}>{org.summary_text}</p>
                </div>
              )}

              {/* Ten Criteria */}
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                Ten Criteria
                <span style={{ flex: 1, height: 1, background: 'rgba(212,206,196,0.15)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '3rem' }}>
                {criteria.map(({ criterion, score, confidence, na_rationale, body_text }) => {
                  const isNA = score === null || score === undefined
                  const sColor = isNA ? 'rgba(212,206,196,0.35)' : SCORE_COLOR(score)
                  return (
                    <div key={criterion} style={{ background: 'rgba(244,240,232,0.025)', border: '1px solid rgba(212,206,196,0.08)', padding: '1.25rem 1.5rem' }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: body_text || na_rationale ? '0.75rem' : 0, gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.12em', color: 'rgba(212,206,196,0.4)', textTransform: 'uppercase' }}>
                            {criterion}
                          </span>
                          <span style={{ fontFamily: 'var(--serif)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--paper)' }}>
                            {CRITERIA[criterion]}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                          {confidence && !isNA && (
                            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(212,206,196,0.4)', padding: '0.15rem 0.45rem', border: '1px solid rgba(212,206,196,0.12)' }}>
                              {confidence}
                            </span>
                          )}
                          {/* Score bar + number */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {!isNA && (
                              <div style={{ width: 48, height: 4, background: 'rgba(212,206,196,0.1)', borderRadius: 2 }}>
                                <div style={{ width: `${(score/10)*100}%`, height: '100%', background: sColor, borderRadius: 2 }} />
                              </div>
                            )}
                            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.95rem', fontWeight: 700, color: sColor, minWidth: '2.8rem', textAlign: 'right' }}>
                              {isNA ? 'N/A' : `${score}/10`}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Body text — much brighter */}
                      {isNA && na_rationale && (
                        <p style={{ fontSize: '0.88rem', color: 'rgba(212,206,196,0.8)', fontStyle: 'italic', margin: 0, lineHeight: 1.75 }}>
                          {na_rationale}
                        </p>
                      )}
                      {body_text && (
                        <p style={{ fontSize: '0.9rem', color: '#d4cec4', margin: 0, lineHeight: 1.8 }}>
                          {body_text}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Political position text row */}
              {ps && (
                <div style={{ marginBottom: '3rem' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    Political Position
                    <span style={{ flex: 1, height: 1, background: 'rgba(212,206,196,0.15)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px' }}>
                    {[
                      { label: 'Economic Axis',  value: ps.economic_axis  > 0 ? `+${ps.economic_axis}` : ps.economic_axis,  sub: ps.economic_axis  > 0 ? 'Right' : ps.economic_axis < 0 ? 'Left' : 'Center' },
                      { label: 'Authority Axis', value: ps.authority_axis > 0 ? `+${ps.authority_axis}` : ps.authority_axis, sub: ps.authority_axis > 0 ? 'Authoritarian' : ps.authority_axis < 0 ? 'Libertarian' : 'Neutral' },
                      { label: 'Quadrant',       value: ps.political_quadrant ?? '—', sub: '' },
                    ].map(({ label, value, sub }) => (
                      <div key={label} style={{ background: 'rgba(244,240,232,0.025)', border: '1px solid rgba(212,206,196,0.08)', padding: '1.25rem', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.35rem' }}>{label}</div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>{value}</div>
                        {sub && <div style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{sub}</div>}
                      </div>
                    ))}
                  </div>
                  {ps.scoring_notes && (
                    <p style={{ fontSize: '0.85rem', color: 'rgba(212,206,196,0.75)', lineHeight: 1.7, marginTop: '0.75rem', marginBottom: 0 }}>
                      {ps.scoring_notes}
                    </p>
                  )}
                </div>
              )}

              {/* Methodology */}
              <div style={{ background: 'rgba(200,168,75,0.05)', border: '1px solid rgba(200,168,75,0.18)', padding: '1.5rem', marginBottom: '2.5rem' }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>
                  Methodology & Provenance
                </p>
                <p style={{ fontSize: '0.87rem', color: 'rgba(212,206,196,0.82)', margin: 0, lineHeight: 1.75 }}>
                  Scored under{' '}
                  <strong style={{ color: 'var(--paper)' }}>{org.methodology_version ?? 'V4.0'}</strong>
                  {' '}of the Cultiness Spectrum dual-metric system. Last revised{' '}
                  <strong style={{ color: 'var(--paper)' }}>{lastUpdated}</strong>.
                  All scores are anchored to publicly documented, verifiable behaviors.
                  Framework criteria derived from Young &amp; Reed,{' '}
                  <a href="https://uncultureyourself.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>
                    <em>The Culting of America</em>
                  </a>{' '}
                  (Otterpine, 2026).{' '}
                  <Link href="/cultiness/methodology" style={{ color: 'var(--gold)' }}>Full methodology →</Link>
                </p>
              </div>

              {/* Citation */}
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'rgba(212,206,196,0.72)', lineHeight: 1.9, padding: '1.25rem 1.5rem', background: 'rgba(244,240,232,0.02)', border: '1px solid rgba(212,206,196,0.08)', marginBottom: '2rem' }}>
                <span style={{ color: 'rgba(212,206,196,0.3)', fontSize: '0.58rem', display: 'block', marginBottom: '0.35rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Cite this assessment</span>
                Mays, Zachary S. &ldquo;{org.name}.&rdquo; <em>Cultiness Spectrum Dataset</em>,
                HWGH-v1, {org.methodology_version ?? 'V4.0'} ({lastUpdated}).
                zacharymays.com/org/{org.slug}.
                Applying Young &amp; Reed, <em>The Culting of America</em> (Otterpine, 2026).
              </div>

              <p style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'rgba(212,206,196,0.3)', lineHeight: 1.7 }}>
                &copy; 2026 Zachary S. Mays. Permitted uses: academic citation, journalism, personal research with attribution.{' '}
                <Link href="/terms" style={{ color: 'rgba(212,206,196,0.35)', textDecoration: 'underline', textDecorationColor: 'rgba(212,206,196,0.2)' }}>
                  Terms of Use →
                </Link>
              </p>
            </div>

            {/* ── RIGHT: sidebar charts ──────────────────────────────── */}
            <div style={{ position: 'sticky', top: '100px' }}>

              {/* Score summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Composite', value: `${parseFloat(org.composite_score).toFixed(0)}%`, sub: org.composite_tier },
                  { label: "Young's",   value: `${org.youngs_score}/10`,                          sub: org.youngs_band },
                ].map(({ label, value, sub }) => (
                  <div key={label} style={{ background: 'rgba(244,240,232,0.03)', border: '1px solid rgba(212,206,196,0.1)', padding: '1rem 0.75rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.52rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(212,206,196,0.65)', marginBottom: '0.3rem' }}>{label}</div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 700, color: tierText, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'rgba(212,206,196,0.65)', marginTop: '0.25rem' }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Radar chart */}
              <div style={{ background: 'rgba(244,240,232,0.02)', border: '1px solid rgba(212,206,196,0.1)', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,206,196,0.65)', marginBottom: '0.75rem', textAlign: 'center' }}>
                  Criteria Profile
                </div>
                <RadarChart criteria={criteria} tierColor={tierColor} />
                {/* Score legend */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginTop: '0.75rem' }}>
                  {criteria.map(({ criterion, score }) => {
                    const isNA = score == null
                    return (
                      <div key={criterion} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.25rem' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isNA ? 'rgba(212,206,196,0.2)' : SCORE_COLOR(score), flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.52rem', color: 'rgba(212,206,196,0.72)', flex: 1 }}>{criterion}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: isNA ? 'rgba(212,206,196,0.3)' : SCORE_COLOR(score), fontWeight: isNA ? 400 : 600 }}>
                          {isNA ? 'N/A' : score}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Mini political compass */}
              {ps && (
                <div style={{ background: 'rgba(244,240,232,0.02)', border: '1px solid rgba(212,206,196,0.1)', padding: '1rem' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.75rem', textAlign: 'center' }}>
                    Political Position
                  </div>
                  <MiniCompass
                    econ={ps.economic_axis}
                    auth={ps.authority_axis}
                    quadrant={ps.political_quadrant}
                    tierColor={tierColor}
                  />
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.6rem' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)' }}>
                      Econ {ps.economic_axis > 0 ? '+' : ''}{ps.economic_axis}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)' }}>
                      Auth {ps.authority_axis > 0 ? '+' : ''}{ps.authority_axis}
                    </span>
                  </div>
                  {ps.political_quadrant && (
                    <div style={{ textAlign: 'center', marginTop: '0.3rem', fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'rgba(212,206,196,0.45)' }}>
                      {ps.political_quadrant}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </section>
    </>
  )
}
