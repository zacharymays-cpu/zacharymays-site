export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EDGE_FUNCTION_URL =
  process.env.EDGE_FUNCTION_URL ||
  'https://shgdrkrqjnwtlyxcdayp.functions.supabase.co/sync-usaspending';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Verify Vercel cron secret
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return Response.json(
      { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 300000, // 5 minutes
    });

    let payload;
    try {
      payload = await response.json();
    } catch (parseError) {
      console.error('JSON parse error from edge function:', response.status, parseError);
      return Response.json(
        {
          success: false,
          status: response.status,
          error: 'Edge function returned invalid JSON',
        },
        { status: 502 },
      );
    }

    if (!response.ok) {
      console.error('Edge function error:', response.status, payload);
      return Response.json(
        {
          success: false,
          status: response.status,
          error: payload.error || 'Edge function failed',
        },
        { status: 502 },
      );
    }

    console.info('USASpending sync completed:', payload);

    return Response.json({
      success: true,
      schedule: request.headers.get('x-vercel-cron-schedule'),
      runId: payload.runId,
      organizationsChecked: payload.organizationsChecked,
      matchedOrgCount: payload.matchedOrgCount,
      awardCount: payload.awardCount,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
