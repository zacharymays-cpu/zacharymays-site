'use client'
import { useEffect, useState } from 'react'

export async function fetchDatasetStats() {
  const res = await fetch('/api/dataset-stats', { next: { revalidate: 300 } })
  if (!res.ok) return null
  return res.json()
}

export function useDatasetStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDatasetStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}
