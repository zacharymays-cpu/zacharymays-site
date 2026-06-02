'use client'
import { useDatasetStats } from '@/lib/hooks/useDatasetStats'

export default function LiveStats({ variant = 'inline', field = 'active_orgs' }) {
  const { stats, loading } = useDatasetStats()

  if (loading) {
    return <span style={{ opacity: 0.4 }}>…</span>
  }
  if (!stats) return null

  const value = stats[field] ?? stats.active_orgs

  if (variant === 'inline') {
    return <span>{Number(value).toLocaleString()}</span>
  }

  if (variant === 'scale-block') {
    return (
      <div style={{ display: 'inline-block', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
          {Number(value).toLocaleString()}
        </div>
      </div>
    )
  }

  return <span>{Number(value).toLocaleString()}</span>
}
