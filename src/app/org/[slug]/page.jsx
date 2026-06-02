// src/app/org/[slug]/page.jsx
// Individual organization assessment page.
// Opens in a new tab from the explorer (target="_blank" on explorer rows).
// Data is fetched live from Supabase on each request with 5-min ISR cache.

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 300

// ── Supabase client (server-side) ─────────────────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// ── Data fetcher ──────────────────────────────────────────────────────────
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

// ── Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const org = await getOrg(params.slug)
  if (!org) return { title: 'Organization Not Found' }
  return {
    title: `${org.name} — Cultiness Spectrum`,
    description: `${org.name} scored ${org.composite_score}% (${org.composite_tier}) on the Cultiness Spectrum. Young's Score: ${org.youngs_score}/10 (${org.youngs_band}).`,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
const TIER_COLORS = {
  'Cult':          'rgba(220,50,47,0.15)',
  'Cult Dynamics': 'rgba(203,75,22,0.15)',
  'High Control':  'rgba(181,137,0,0.15)',
  'Concerning':    'rgba(108,113,196,0.15)',
  'Mildly Culty':  'rgba(42,161,152,0.15)',
  'Healthy Group': 'rgba(133,153,0,0.15)',
}

const TIER_TEXT_COLORS = {
  'Cult':          '#dc322f',
  'Cult Dynamics': '#cb4b16',
  'High Control':  '#b58900',
  'Concerning':    '#6c71c4',
  'Mildly Culty':  '#2aa198',
  'Healthy Group': '#859900',
}

const SCORE_COLOR = (score) => {
  if (score === null || score === undefined) return 'var(--muted)'
  if (score >= 9) return '#dc322f'
  if (score >= 7) return '#cb4b16'
  if (score >= 5) return '#b58900'
  if (score >= 3) return '#859900'
  return '#2aa198'
}

const CRITERIA_LABELS = {
  C1:  'Charismatic Leadership',
  C2:  'Sacred Assumptions',
  C3:  'Transcendent Mission',
  C4:  'Identity Sublimation',
  C5:  'Information Isolation',
  C6:  'Private Vernacular',
  C7:  'Us-vs-Them Dynamics',
  C8:  'Labor Exploitation',
  C9:  'Exit Costs',
  C10: 'Ends Justify Means',
}

const TRAJECTORY_LABELS = {
  Escalating: '↑ Escalating',
  Stable:     '→ Stable',
  Declining:  '↓ Declining',
  Defunct:    '— Defunct',
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function OrgPage({ params }) {
  const org = await getOrg(params.slug)
  if (!org) notFound()

  const criteria = [...(org.criterion_scores || [])]
    .sort((a, b) => {
      const n = x => parseInt(x.replace('C', ''))
      return n(a.criterion) - n(b.criterion)
    })

  const ps = org.political_scores?.[0] ?? null
  const tierColor     = TIER_COLORS[org.composite_tier]      ?? 'rgba(212,206,196,0.1)'
  const tierTextColor = TIER_TEXT_COLORS[org.composite_tier] ?? 'var(--muted)'
  const lastUpdated   = new Date(org.updated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="hero" style={{ paddingBottom: '3rem' }}>
        <div className="container--narrow">
          <span className="hero__eyebrow animate-up">
            <Link href="/explore" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
              Dataset Explorer
            </Link>
            {' '}—{' '}{org.category}
          </span>
          <h1 className="hero__title animate-up-2">{org.name}</h1>
          <div className="animate-up-3" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '0.35rem 0.8rem',
              background: tierColor, color: tierTextColor,
              border: `1px solid ${tierTextColor}40`,
            }}>
              {org.composite_tier}
            </span>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '0.35rem 0.8rem',
              background: 'rgba(244,240,232,0.04)', color: 'var(--muted)',
              border: '1px solid rgba(212,206,196,0.15)',
            }}>
              {TRAJECTORY_LABELS[org.trajectory] ?? org.trajectory}
            </span>
            {!org.active && (
              <span style={{
                fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '0.35rem 0.8rem',
                background: 'rgba(220,50,47,0.08)', color: '#dc322f',
                border: '1px solid rgba(220,50,47,0.2)',
              }}>
                Defunct
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container--narrow">

          {/* ── Score summary ────────────────────────────────────────── */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px',
            background: 'rgba(212,206,196,0.1)', marginBottom: '3rem',
          }}>
            {[
              { label: 'Composite Score',  value: `${parseFloat(org.composite_score).toFixed(0)}%`, sub: org.composite_tier },
              { label: "Young's Score",    value: `${org.youngs_score}/10`,                          sub: org.youngs_band },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ background: 'var(--ink)', padding: '2rem', textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem',
                }}>
                  {label}
                </div>
                <div style={{
                  fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  fontWeight: 700, color: tierTextColor, lineHeight: 1,
                }}>
                  {value}
                </div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--muted)', marginTop: '0.4rem',
                }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>

          {/* ── Summary ──────────────────────────────────────────────── */}
          {org.summary_text && (
            <>
              <div className="section__label">Assessment Summary</div>
              <p>{org.summary_text}</p>
              <hr className="rule" />
            </>
          )}

          {/* ── Ten Criteria ─────────────────────────────────────────── */}
          <div className="section__label">Ten Criteria</div>
          <div style={{ display: 'grid', gap: '1px', background: 'rgba(212,206,196,0.1)', marginBottom: '3rem' }}>
            {criteria.map(({ criterion, score, confidence, na_rationale, body_text }) => {
              const isNA = score === null || score === undefined
              return (
                <div key={criterion} style={{ background: 'var(--ink)', padding: '1.5rem 2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginRight: '0.75rem' }}>
                        {criterion}
                      </span>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--paper)' }}>
                        {CRITERIA_LABELS[criterion]}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      {confidence && !isNA && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', padding: '0.2rem 0.5rem', border: '1px solid rgba(212,206,196,0.15)' }}>
                          {confidence}
                        </span>
                      )}
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: '1rem', fontWeight: 700,
                        color: isNA ? 'var(--muted)' : SCORE_COLOR(score),
                        minWidth: '2.5rem', textAlign: 'right',
                      }}>
                        {isNA ? 'N/A' : `${score}/10`}
                      </span>
                    </div>
                  </div>
                  {isNA && na_rationale && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0, lineHeight: 1.65 }}>
                      {na_rationale}
                    </p>
                  )}
                  {body_text && (
                    <p style={{ fontSize: '0.88rem', color: 'var(--muted)', margin: 0, lineHeight: 1.75 }}>
                      {body_text}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Political Compass ────────────────────────────────────── */}
          {ps && (
            <>
              <div className="section__label">Political Position</div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px',
                background: 'rgba(212,206,196,0.1)', marginBottom: '3rem',
              }}>
                {[
                  { label: 'Economic Axis',   value: ps.economic_axis  > 0 ? `+${ps.economic_axis}` : ps.economic_axis,  sub: ps.economic_axis  > 0 ? 'Right' : ps.economic_axis < 0 ? 'Left' : 'Center' },
                  { label: 'Authority Axis',  value: ps.authority_axis > 0 ? `+${ps.authority_axis}` : ps.authority_axis, sub: ps.authority_axis > 0 ? 'Authoritarian' : ps.authority_axis < 0 ? 'Libertarian' : 'Neutral' },
                  { label: 'Quadrant',        value: ps.political_quadrant ?? '—', sub: '' },
                ].map(({ label, value, sub }) => (
                  <div key={label} style={{ background: 'var(--ink)', padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                      {label}
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--paper)', lineHeight: 1 }}>
                      {value}
                    </div>
                    {sub && (
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '0.3rem' }}>
                        {sub}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Methodology & provenance ─────────────────────────────── */}
          <div style={{
            background: 'rgba(200,168,75,0.06)', border: '1px solid rgba(200,168,75,0.2)',
            padding: '1.5rem 2rem', marginBottom: '3rem',
          }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.6rem' }}>
              Methodology & Provenance
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0, lineHeight: 1.75 }}>
              Scored under{' '}
              <strong style={{ color: 'var(--paper)' }}>{org.methodology_version ?? 'V4.0'}</strong>
              {' '}of the Cultiness Spectrum dual-metric system. Last revised{' '}
              <strong style={{ color: 'var(--paper)' }}>{lastUpdated}</strong>.
              All scores are anchored to publicly documented, verifiable behaviors —
              court records, regulatory findings, investigative journalism, academic
              scholarship, institutional self-documentation. Framework criteria derived
              from Young &amp; Reed,{' '}
              <a href="https://uncultureyourself.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>
                <em>The Culting of America</em>
              </a>{' '}
              (Otterpine, 2026).{' '}
              <Link href="/cultiness/methodology" style={{ color: 'var(--gold)' }}>
                Full methodology →
              </Link>
            </p>
          </div>

          {/* ── Citation ─────────────────────────────────────────────── */}
          <div className="section__label">Cite This Assessment</div>
          <div style={{
            background: 'rgba(244,240,232,0.03)', border: '1px solid rgba(212,206,196,0.1)',
            padding: '1.5rem 2rem', fontFamily: 'var(--mono)', fontSize: '0.78rem',
            color: 'var(--muted)', lineHeight: 1.8, marginBottom: '3rem',
          }}>
            Mays, Zachary S. &ldquo;{org.name}.&rdquo; <em>Cultiness Spectrum Dataset</em>,
            HWGH-v1, {org.methodology_version ?? 'V4.0'} ({lastUpdated}).
            zacharymays.com/org/{org.slug}.
            Applying the framework of Young, Daniella Mestyanek and Amy Reed,{' '}
            <em>The Culting of America</em> (Otterpine, 2026).
          </div>

          {/* ── Terms notice ─────────────────────────────────────────── */}
          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--muted)', lineHeight: 1.7 }}>
            This assessment is an original analytical work. &copy; 2026 Zachary S. Mays.
            Permitted uses include academic citation, journalism, and personal research with attribution.{' '}
            <Link href="/terms" style={{ color: 'var(--muted)', textDecoration: 'underline', textDecorationColor: 'rgba(212,206,196,0.3)' }}>
              Terms of Use →
            </Link>
          </p>

        </div>
      </section>
    </>
  )
}
