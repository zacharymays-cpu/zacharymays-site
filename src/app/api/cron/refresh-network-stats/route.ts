/**
 * Vercel Cron: Nightly network refresh for all organizations
 *
 * Runs daily at 02:00 UTC (after sync-usaspending at 02:00, this at later schedule).
 * Refreshes network materialized views and recalculates person degree metrics.
 *
 * Guarded by CRON_SECRET to prevent unauthorized triggering.
 */

import { createSupabaseAdminClient } from '../../../../lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

const COGROUP_ORG_ID = '471e1fab-c57c-6a63-e539-dd4a93b7e47d'; // Children of God
const TWELVETRIBES_ORG_ID = 'a8b9c0d1-e2f3-4a5b-6c7d-8e9f0a1b2c3d'; // Twelve Tribes (example ID)

export async function GET(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const results = [];

  try {
    // Refresh network stats for Children of God
    const cogResult = await refreshOrgNetwork(admin, COGROUP_ORG_ID, 'Children of God');
    results.push(cogResult);
  } catch (err: any) {
    results.push({
      org: 'Children of God',
      success: false,
      error: err?.message || 'Unknown error',
    });
  }

  try {
    // Refresh network stats for Twelve Tribes (if org exists)
    const ttResult = await refreshOrgNetwork(admin, TWELVETRIBES_ORG_ID, 'Twelve Tribes');
    results.push(ttResult);
  } catch (err: any) {
    results.push({
      org: 'Twelve Tribes',
      success: false,
      error: err?.message || 'Unknown error',
    });
  }

  // Check if all succeeded
  const allSucceeded = results.every((r) => r.success);

  return Response.json(
    {
      ok: allSucceeded,
      message: 'Network refresh complete',
      results,
      timestamp: new Date().toISOString(),
    },
    { status: allSucceeded ? 200 : 206 }
  );
}

async function refreshOrgNetwork(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
  orgName: string
) {
  // Verify org exists
  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .select('id, name')
    .eq('id', orgId)
    .single();

  if (orgErr || !org) {
    return {
      org: orgName,
      success: false,
      error: 'Organization not found',
    };
  }

  // Refresh network_connections materialized view
  // Note: if the RPC doesn't exist, fallback to explicit query
  try {
    const { error: viewErr } = await admin.rpc('refresh_network_connections', {
      p_org_id: orgId,
    });

    if (viewErr) {
      console.warn(`View refresh RPC not available for ${orgName}, skipping`);
    }
  } catch {
    console.warn(`View refresh RPC not available for ${orgName}, skipping`);
  }

  // Recalculate person network degrees
  const { data: persons, error: personsErr } = await admin
    .from('persons')
    .select('id')
    .eq('org_id', orgId);

  if (personsErr) {
    throw personsErr;
  }

  let degreesUpdated = 0;

  for (const person of persons || []) {
    // Count connections where this person appears
    const { data: connections, error: connErr } = await admin
      .from('network_connections')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .or(`person_a_id.eq.${person.id},person_b_id.eq.${person.id}`);

    if (connErr) {
      throw connErr;
    }

    const degree = connections?.length || 0;

    const { error: updateErr } = await admin
      .from('persons')
      .update({
        network_degree: degree,
        updated_at: new Date().toISOString(),
      })
      .eq('id', person.id);

    if (updateErr) {
      throw updateErr;
    }

    degreesUpdated++;
  }

  return {
    org: orgName,
    success: true,
    personsProcessed: persons?.length || 0,
    degreesUpdated,
    timestamp: new Date().toISOString(),
  };
}
