// Vercel cron: find APPROVED intake proposals and dispatch the cultiness-spectrum
// "intake-pipeline" GitHub Actions workflow for each (Vercel can't run the Python
// directly — same shape as the sync-usaspending cron that proxies to an edge fn).
// Guarded by CRON_SECRET. Runs DRY by default — set INTAKE_LIVE=true to allow real
// (paid) pipeline runs.
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GH_OWNER = 'zacharymays-cpu';
const GH_REPO = 'cultiness-spectrum';
const WORKFLOW = 'intake-pipeline.yml';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = process.env.GH_DISPATCH_TOKEN;
  if (!token) {
    return Response.json({ ok: false, error: 'GH_DISPATCH_TOKEN is not configured' }, { status: 500 });
  }

  const dryRun = process.env.INTAKE_LIVE !== 'true';

  let approved = [];
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from('org_intake_proposals')
      .select('id, name')
      .eq('status', 'APPROVED')
      .limit(5);
    if (error) throw error;
    approved = data || [];
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }

  const dispatched = [];
  for (const p of approved) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/${WORKFLOW}/dispatches`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({ ref: 'main', inputs: { proposal_id: p.id, dry_run: String(dryRun) } }),
        },
      );
      dispatched.push({ id: p.id, name: p.name, status: res.status });
    } catch (e) {
      dispatched.push({ id: p.id, name: p.name, error: e.message });
    }
  }

  return Response.json({ ok: true, dryRun, count: dispatched.length, dispatched });
}
