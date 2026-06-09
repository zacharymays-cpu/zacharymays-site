export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://shgdrkrqjnwtlyxcdayp.supabase.co';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

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

  const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-usaspending`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orgLimit: 10,
      awardLimit: 10,
      minAcceptedScore: 0.95,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return Response.json(
      {
        success: false,
        status: response.status,
        payload,
      },
      { status: 502 },
    );
  }

  return Response.json({
    success: true,
    schedule: request.headers.get('x-vercel-cron-schedule'),
    payload,
  });
}
