// app/api/dataset-stats/route.ts
// Authoritative dataset statistics endpoint.
// All website count references should call this — never hardcode numbers.
//
// Returns live counts from the dataset_stats view in Supabase.
// Cached at the CDN edge for 5 minutes (revalidate: 300).

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 300 // 5-minute ISR cache

export interface DatasetStats {
  active_orgs: number
  recent_defunct: number
  analytics_dataset: number       // active + defunct (what statistical work runs on)
  calibration_anchors: number
  domestic_calibration: number
  international_calibration: number
  total_assessed: number          // analytics_dataset + calibration_anchors
  last_updated_at: string         // ISO timestamp of most recent org update
  current_methodology_version: string
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!   // service role for server-side read
  )

  const { data, error } = await supabase
    .from('dataset_stats')
    .select('*')
    .single()

  if (error || !data) {
    console.error('[dataset-stats] Supabase error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dataset statistics' },
      { status: 500 }
    )
  }

  return NextResponse.json(data as DatasetStats, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  })
}
