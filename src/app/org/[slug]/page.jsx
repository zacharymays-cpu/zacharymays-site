// src/app/org/[slug]/page.jsx
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase/config'

export const revalidate = 300

// URL comes from the shared config so this page can never read a different
// project than the rest of the site. The service key (RLS bypass) keeps
// inactive/historical orgs linked from the lineage graph reachable; falls
// back to the anon key if it isn't configured.
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY)
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
      founding_year, defunct_year,
      membership_count, membership_count_year,
      revenue_usd, revenue_year,
      size_tier, size_notes,
      founding_year_source_url, location_source_url, defunct_year_source_url,
      methodology_version, updated_at, active,
      political_scores ( economic_axis, authority_axis, political_quadrant, scoring_notes ),
      criterion_scores ( criterion, score, confidence, na_rationale, body_text,
        evidence_sources ( source_type, title, author, publication, year, url, doi, factual_tier ) ),
      organization_research_narratives ( id, narrative_type, title, content, summary, confidence_level, sources, created_at )
    `)
    .eq('slug', slug)
    .single()
  if (error || !org) return null

  // Check if org appears in lineage (source or target)
  const { data: inLineage } = await supabase
    .from('org_lineage')
    .select('id', { count: 'exact', head: true })
    .or(`source_slug.eq.${slug},target_slug.eq.${slug}`)
  org.in_lineage = (inLineage && inLineage.length > 0)

  return org
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const org = await getOrg(slug)
  if (!org) return { title: 'Organization Not Found' }
  const scored = !Number.isNaN(parseFloat(org.composite_score))
  return {
    title: `${org.name} — Cultiness Spectrum`,
    description: scored
      ? `${org.name} scored ${parseFloat(org.composite_score).toFixed(0)}% (${lbl(org.composite_tier)}). Young's Score: ${org.youngs_score}/10.`
      : `${org.name} — assessment pending in the Cultiness Spectrum dataset.`,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
const TIER_TEXT = {
  'Super Culty': '#dc322f',
  'Kinda Culty': '#b58900',
  'Not Culty':   '#859900',
}
const TIER_BG = {
  'Super Culty': 'rgba(220,50,47,0.12)',
  'Kinda Culty': 'rgba(181,137,0,0.12)',
  'Not Culty':   'rgba(133,153,0,0.12)',
}
// Softer reader-facing labels for the DB tier enum (keys are unchanged).
const TIER_LABELS = { 'Super Culty':'High-Control','Kinda Culty':'Moderate-Control','Not Culty':'Low-Control' }
const lbl = (t) => TIER_LABELS[t] || t

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

const SIZE_TIER_LABELS = {
  micro: 'Micro scale (<1K)',
  small: 'Small scale (1K-50K)',
  medium: 'Medium scale (50K-1M)',
  large: 'Large scale (1M-10M)',
  mass: 'Mass scale (>10M)',
}

function formatWholeNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function formatUsd(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(n >= 10_000_000_000 ? 0 : 1)}B`
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function ScoreboardMetric({ label, value, sub }) {
  if (!value) return null
  return (
    <>
      <div style={{ width: 1, background: 'rgba(212,206,196,0.15)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem', minWidth: '6.5rem' }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>{value}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}{sub ? ` · ${sub}` : ''}</span>
      </div>
    </>
  )
}

// Small superscript source link for a sourced provenance fact (founding year,
// location, defunct year). Renders nothing when no URL is recorded.
function SourceCite({ url, label = 'source' }) {
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={`Source: ${url}`}
      style={{ color: 'var(--gold)', textDecoration: 'none', fontSize: '0.72em', verticalAlign: 'super', marginLeft: '0.15em' }}>
      ↗<span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{label}</span>
    </a>
  )
}

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
  // Inset the plottable range by the dot radius so extreme values (±5) keep the
  // whole marker inside the grid instead of straddling the corner.
  const DOT_R = 7
  const PLOT = INNER - DOT_R * 2
  const cx = PAD + DOT_R + ((parseFloat(econ) + 5) / 10) * PLOT
  const cy = PAD + DOT_R + ((5 - parseFloat(auth)) / 10) * PLOT
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
  const { slug } = await params
  const org = await getOrg(slug)
  if (!org) notFound()

  // C1–C10 are the behavioral "Ten Criteria"; C11 (Lifton psychological totalism)
  // is a separate track surfaced as its own scoreboard card, not in the list.
  const criteria = [...(org.criterion_scores || [])]
    .filter(c => c.criterion !== 'C11')
    .sort((a, b) => parseInt(a.criterion.replace('C','')) - parseInt(b.criterion.replace('C','')))
  const liftonRow   = (org.criterion_scores || []).find(c => c.criterion === 'C11')
  const liftonScore = liftonRow && liftonRow.score != null ? parseFloat(liftonRow.score) : null
  const liftonTier  = liftonScore == null ? null
    : liftonScore >= 6 ? 'Psychologically Totalizing'
    : liftonScore >= 3 ? 'Moderately Totalizing'
    : 'Non-Totalizing'
  // C11 totalism narrative (the jury's own rationale). Suppress legacy label-only
  // stubs (e.g. "Lifton psychological totalism (C11): Psychologically Totalizing").
  const liftonBody = (liftonRow?.body_text && liftonRow.body_text.trim().length > 120
    && !/^Lifton psychological totalism \(C11\)/i.test(liftonRow.body_text.trim()))
    ? liftonRow.body_text.trim() : null

  // De-duplicate evidence sources across all criteria (each source is attached
  // per-criterion, so the same reference recurs). Best factual tier first, then newest.
  const sources = []
  const seenSrc = new Set()
  for (const cs of (org.criterion_scores || [])) {
    for (const s of (cs.evidence_sources || [])) {
      const key = (s.url || '') + '|' + (s.title || '') + '|' + (s.author || '')
      if (seenSrc.has(key)) continue
      seenSrc.add(key)
      sources.push(s)
    }
  }
  sources.sort((a, b) => (a.factual_tier ?? 9) - (b.factual_tier ?? 9) || (b.year ?? 0) - (a.year ?? 0))

  // political_scores can embed as an array (to-many) or a single object (to-one,
  // e.g. when a unique constraint on org_id exists). Handle both.
  const ps          = Array.isArray(org.political_scores) ? (org.political_scores[0] ?? null) : (org.political_scores ?? null)
  const isUnscored  = Number.isNaN(parseFloat(org.composite_score))
  const compositePct = isUnscored ? 'Pending' : `${parseFloat(org.composite_score).toFixed(0)}%`
  const tierColor   = TIER_BG[org.composite_tier]   ?? 'rgba(212,206,196,0.1)'
  const tierText    = TIER_TEXT[org.composite_tier]  ?? 'var(--muted)'
  const lastUpdated = new Date(org.updated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const membershipCount = formatWholeNumber(org.membership_count)
  const revenueUsd = formatUsd(org.revenue_usd)
  const sizeTier = org.size_tier ? (SIZE_TIER_LABELS[org.size_tier] ?? org.size_tier) : null
  const hasScaleData = Boolean(membershipCount || revenueUsd || sizeTier || org.size_notes)

  return (
    <>
      {/* ── Compact hero ────────────────────────────────────────────── */}
      <section style={{ padding: '2.5rem 0 2rem', borderTop: `3px solid ${tierText}`, borderBottom: '1px solid rgba(212,206,196,0.1)' }}>
        <div className="container--wide">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <Link href="/explore" style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none' }}>
              Dataset Explorer
            </Link>
            <span style={{ color: 'rgba(212,206,196,0.3)', fontFamily: 'var(--mono)', fontSize: '0.6rem' }}>—</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {org.category}
            </span>
            {org.founding_year && (
              <>
                <span style={{ color: 'rgba(212,206,196,0.3)', fontFamily: 'var(--mono)', fontSize: '0.6rem' }}>—</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Founded {org.founding_year}<SourceCite url={org.founding_year_source_url} label="founding year source" />
                </span>
              </>
            )}
            {org.defunct_year && (
              <>
                <span style={{ color: 'rgba(212,206,196,0.3)', fontFamily: 'var(--mono)', fontSize: '0.6rem' }}>—</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Defunct {org.defunct_year}<SourceCite url={org.defunct_year_source_url} label="defunct year source" />
                </span>
              </>
            )}
            {org.location_source_url && (
              <>
                <span style={{ color: 'rgba(212,206,196,0.3)', fontFamily: 'var(--mono)', fontSize: '0.6rem' }}>—</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Location<SourceCite url={org.location_source_url} label="location source" />
                </span>
              </>
            )}
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 700, color: 'var(--paper)', marginBottom: '1rem', lineHeight: 1.15 }}>
            {org.name}
          </h1>
          {!org.active && (
            <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: '4px' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                ⚠ Historical organization — no longer active
              </span>
            </div>
          )}
          {/* Scoreboard — composite as focal point */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.6rem,7vw,3.6rem)', fontWeight: 700, color: tierText, lineHeight: 0.9 }}>{compositePct}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', background: tierColor, color: tierText, border: `1px solid ${tierText}55`, alignSelf: 'flex-start' }}>
                  {org.composite_tier ? lbl(org.composite_tier) : 'Not Yet Scored'}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>Group Dynamics Score</span>
              </div>
            </div>

            {!isUnscored && (
              <>
                <div style={{ width: 1, background: 'rgba(212,206,196,0.15)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem' }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>
                    {org.youngs_score}<span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>/10</span>
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Young's{org.youngs_band ? ` · ${org.youngs_band}` : ''}</span>
                </div>
              </>
            )}

            {liftonScore != null && (
              <>
                <div style={{ width: 1, background: 'rgba(212,206,196,0.15)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem' }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: '#a06cd5', lineHeight: 1 }}>
                    {liftonScore}<span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>/10</span>
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Lifton{liftonTier ? ` · ${liftonTier}` : ''}</span>
                </div>
              </>
            )}

            <div style={{ width: 1, background: 'rgba(212,206,196,0.15)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>{TRAJ[org.trajectory] ?? org.trajectory ?? '—'}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Trajectory</span>
            </div>

            <ScoreboardMetric
              label="Membership / reach"
              value={membershipCount}
              sub={org.membership_count_year}
            />
            <ScoreboardMetric
              label="Revenue"
              value={revenueUsd}
              sub={org.revenue_year}
            />
            <ScoreboardMetric
              label="Size"
              value={sizeTier}
            />
          </div>
          {org.size_notes && hasScaleData && (
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'rgba(212,206,196,0.55)', lineHeight: 1.6, marginTop: '0.9rem', maxWidth: 860 }}>
              {org.size_notes}
            </p>
          )}
        </div>
      </section>

      <section style={{ padding: '3rem 0' }}>
        <div className="container--wide">
          {/* ── Stacked: charts row under the header, then full-width content ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

            {/* ── Main content (capped reading measure, below the charts) ─ */}
            <div style={{ order: 2, width: '100%', maxWidth: 860, alignSelf: 'center' }}>

              {/* Political position text row — kept adjacent to the compass in the charts row above */}
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

              {/* Research Narratives (Movement Patterns, etc.) */}
              {org.organization_research_narratives && org.organization_research_narratives.length > 0 && (
                <>
                  {org.organization_research_narratives.map((narrative) => (
                    <div key={narrative.id} style={{ marginBottom: '3rem' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {narrative.title}
                        <span style={{ flex: 1, height: 1, background: 'rgba(212,206,196,0.15)' }} />
                      </div>
                      {narrative.summary && (
                        <p style={{ fontSize: '0.95rem', color: '#d4cec4', lineHeight: 1.8, marginBottom: '1rem' }}>
                          {narrative.summary}
                        </p>
                      )}
                      <div style={{ fontSize: '0.92rem', color: '#d4cec4', lineHeight: 1.85, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '1.5rem' }}>
                        {narrative.content.split('\n\n').map((para, i) => (
                          <p key={i} style={{ marginBottom: '1rem', margin: 0 }}>
                            {para}
                          </p>
                        ))}
                      </div>
                      {narrative.sources && narrative.sources.length > 0 && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '1.5rem', padding: '1rem', background: 'rgba(244,240,232,0.02)', border: '1px solid rgba(212,206,196,0.08)', borderRadius: '3px' }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--gold)' }}>
                            Sources
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                            {narrative.sources.map((source, i) => (
                              <li key={i} style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>
                                {source.source} {source.confidence && <span style={{ color: 'rgba(212,206,196,0.6)' }}>· {source.confidence}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </>
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
                    <div key={criterion} style={{ background: 'rgba(244,240,232,0.025)', border: '1px solid rgba(212,206,196,0.08)', borderLeft: `3px solid ${sColor}`, padding: '1.25rem 1.25rem 1.25rem 1.5rem' }}>
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

              {/* Psychological Totalism (C11) — separate Lifton track, shown as its own card */}
              {liftonScore != null && (
                <>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a06cd5', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    Psychological Totalism · Lifton (C11)
                    <span style={{ flex: 1, height: 1, background: 'rgba(212,206,196,0.15)' }} />
                  </div>
                  <div style={{ background: 'rgba(160,108,213,0.05)', border: '1px solid rgba(160,108,213,0.2)', borderLeft: '3px solid #a06cd5', padding: '1.25rem 1.25rem 1.25rem 1.5rem', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: liftonBody ? '0.75rem' : 0, gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--paper)' }}>
                        {liftonTier}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <div style={{ width: 48, height: 4, background: 'rgba(212,206,196,0.1)', borderRadius: 2 }}>
                          <div style={{ width: `${(liftonScore/10)*100}%`, height: '100%', background: '#a06cd5', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.95rem', fontWeight: 700, color: '#a06cd5', minWidth: '2.8rem', textAlign: 'right' }}>
                          {liftonScore}/10
                        </span>
                      </div>
                    </div>
                    {liftonBody && (
                      <p style={{ fontSize: '0.9rem', color: '#d4cec4', margin: 0, lineHeight: 1.8 }}>
                        {liftonBody}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Lineage cross-link */}
              {org.in_lineage && (
                <div style={{ marginBottom: '3rem', padding: '1.25rem', background: 'rgba(181,137,0,0.08)', border: '1px solid rgba(181,137,0,0.2)', borderRadius: '4px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>
                    Organizational Lineage
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#d4cec4', margin: 0, lineHeight: 1.6 }}>
                    This organization is part of a documented lineage chain. <Link href="/explore/lineage" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>Explore the lineage →</Link>
                  </p>
                </div>
              )}

              {/* Sources & Evidence */}
              {sources.length > 0 && (
                <div style={{ marginBottom: '3rem' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    Sources &amp; Evidence
                    <span style={{ flex: 1, height: 1, background: 'rgba(212,206,196,0.15)' }} />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                    {sources.length} documented {sources.length === 1 ? 'source' : 'sources'} underpinning this assessment, ordered by factual reliability.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {sources.map((s, i) => {
                      const meta = [s.author, s.publication, s.year].filter(Boolean).join(' · ')
                      return (
                        <div key={i} style={{ background: 'rgba(244,240,232,0.025)', border: '1px solid rgba(212,206,196,0.08)', padding: '0.9rem 1.1rem', display: 'flex', gap: '1rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0, minWidth: '8.5rem' }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', padding: '0.18rem 0.45rem', border: '1px solid rgba(200,168,75,0.3)', whiteSpace: 'nowrap' }}>
                              {(s.source_type || 'source').replace(/_/g, ' ')}
                            </span>
                            {s.factual_tier != null && (
                              <span title="Factual reliability tier (1 = highest)" style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'rgba(212,206,196,0.5)' }}>T{s.factual_tier}</span>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: '14rem' }}>
                            <div style={{ fontFamily: 'var(--serif)', fontSize: '0.92rem', color: 'var(--paper)', lineHeight: 1.4 }}>
                              {s.url ? (
                                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--paper)', textDecoration: 'none', borderBottom: '1px solid rgba(200,168,75,0.3)' }}>
                                  {s.title || s.url}<span style={{ color: 'var(--gold)', fontSize: '0.7rem' }}> ↗</span>
                                </a>
                              ) : (s.title || '—')}
                            </div>
                            {meta && (
                              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--muted)', marginTop: '0.3rem' }}>{meta}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
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
                  <Link href="/oci/methodology" style={{ color: 'var(--gold)' }}>Full methodology →</Link>
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

            {/* ── Charts row: two evened panels under the header ───────── */}
            <div style={{ order: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>

              {/* Political compass — always shown */}
              <div style={{ background: 'rgba(244,240,232,0.02)', border: '1px solid rgba(212,206,196,0.12)', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,206,196,0.65)', marginBottom: '0.75rem', textAlign: 'center' }}>
                  Political Compass
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {ps ? (
                    <>
                      <MiniCompass
                        econ={ps.economic_axis}
                        auth={ps.authority_axis}
                        quadrant={ps.political_quadrant}
                        tierColor={tierColor}
                      />
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '0.65rem' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'rgba(212,206,196,0.75)' }}>
                          Econ {parseFloat(ps.economic_axis) > 0 ? '+' : ''}{ps.economic_axis}
                        </span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'rgba(212,206,196,0.75)' }}>
                          Auth {parseFloat(ps.authority_axis) > 0 ? '+' : ''}{ps.authority_axis}
                        </span>
                      </div>
                      {ps.political_quadrant && (
                        <div style={{ textAlign: 'center', marginTop: '0.3rem', fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'rgba(212,206,196,0.75)', letterSpacing: '0.06em' }}>
                          {ps.political_quadrant}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'rgba(212,206,196,0.3)' }}>
                      Political position not yet scored
                    </div>
                  )}
                </div>
              </div>

              {/* Radar chart */}
              <div style={{ background: 'rgba(244,240,232,0.02)', border: '1px solid rgba(212,206,196,0.12)', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,206,196,0.65)', marginBottom: '0.75rem', textAlign: 'center' }}>
                  Criteria Profile
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  )
}
