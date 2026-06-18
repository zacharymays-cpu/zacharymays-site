// Vercel cron: find PENDING orgs (promoted by the Layer 1 DB trigger when a proposal
// is APPROVED) and dispatch the cultiness-spectrum "intake-pipeline" GitHub Actions
// workflow for each — one dispatch per org, passing org_id so the orchestrator runs
// Layer 2 mode (run_for_org) rather than the legacy proposal path.
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

  let pending = [];
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from('organizations')
      .select('id, name')
      .eq('scoring_status', 'PENDING')
      .limit(5);
    if (error) throw error;
    pending = data || [];
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }

  const dispatched = [];
  for (const o of pending) {
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
          body: JSON.stringify({ ref: 'main', inputs: { org_id: o.id, dry_run: String(dryRun) } }),
        },
      );
      dispatched.push({ id: o.id, name: o.name, status: res.status });
    } catch (e) {
      dispatched.push({ id: o.id, name: o.name, error: e.message });
    }
  }

  return Response.json({ ok: true, dryRun, count: dispatched.length, pending: pending.length, dispatched });
}
