// lib/hooks/useDatasetStats.ts
// Client-side hook — use in Client Components that need live counts.
// For Server Components, import fetchDatasetStats() directly instead.

'use client'

import { useEffect, useState } from 'react'
import type { DatasetStats } from '@/app/api/dataset-stats/route'

interface UseDatasetStatsResult {
  stats: DatasetStats | null
  loading: boolean
  error: string | null
}

export function useDatasetStats(): UseDatasetStatsResult {
  const [stats, setStats] = useState<DatasetStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dataset-stats')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: DatasetStats) => {
        setStats(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[useDatasetStats]', err)
        setError('Could not load dataset statistics')
        setLoading(false)
      })
  }, [])

  return { stats, loading, error }
}

// ─── Server Component helper ───────────────────────────────────────────────
// Use this in async Server Components (e.g. page.tsx) for SSR/ISR.
// The result is pre-rendered and cached at the edge; no client JS required.

export async function fetchDatasetStats(): Promise<DatasetStats | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.zacharymays.com'
    const res = await fetch(`${baseUrl}/api/dataset-stats`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
