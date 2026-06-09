import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase/config'

export const revalidate = 300

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.from('dataset_stats').select('*').single()
  if (error || !data) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
  return NextResponse.json(data)
}
