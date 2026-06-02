// components/LiveStats.tsx
// Drop-in replacement for any hardcoded count on the site.
// Pulls from the authoritative dataset_stats view via the API route.
//
// Usage (Server Component, preferred):
//   const stats = await fetchDatasetStats()
//   <LiveStats stats={stats} />
//
// Usage (Client Component, for interactive pages):
//   <LiveStatsClient />

import { fetchDatasetStats } from '@/lib/hooks/useDatasetStats'

interface LiveStatsProps {
  stats: {
    active_orgs: number
    calibration_anchors: number
    total_assessed: number
    last_updated_at: string
    current_methodology_version: string
  } | null
  variant?: 'full' | 'inline' | 'scale-block'
}

// ─── Server Component version (use in page.tsx) ──────────────────────────

export async function LiveStats({ variant = 'scale-block' }: { variant?: LiveStatsProps['variant'] }) {
  const stats = await fetchDatasetStats()
  return <LiveStatsDisplay stats={stats} variant={variant} />
}

// ─── Pure display component (accepts pre-fetched stats) ──────────────────

export function LiveStatsDisplay({ stats, variant = 'scale-block' }: LiveStatsProps) {
  const activeOrgs = stats?.active_orgs ?? '—'
  const calibration = stats?.calibration_anchors ?? '—'
  const lastUpdated = stats?.last_updated_at
    ? new Date(stats.last_updated_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '—'
  const version = stats?.current_methodology_version ?? '—'

  if (variant === 'inline') {
    // For use mid-sentence: "370 organizations assessed..."
    return <>{activeOrgs}</>
  }

  if (variant === 'full') {
    // For /cultiness and homepage Spectrum section
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(212,206,196,0.1)', margin: '1.5rem 0 2.5rem' }}>
        <StatCell value={String(activeOrgs)} label="Active organizations assessed" />
        <StatCell value={String(calibration)} label="Calibration anchors" />
        <StatCell value="r=0.703" label="Authority-axis correlation" />
      </div>
    )
  }

  // scale-block: compact version for homepage Spectrum teaser
  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 700, color: 'var(--gold)' }}>
        {activeOrgs}
      </span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        organizations · {version} · updated {lastUpdated}
      </span>
    </div>
  )
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ background: 'var(--ink)', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 700, color: 'var(--gold)', lineHeight: 1, marginBottom: '0.5rem' }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </div>
    </div>
  )
}
