# Phase 4 Deployment Checklist

**Status:** Phase 4 (Integration & Deployment) - READY FOR TESTING

Complete this checklist before promoting to production.

## Overview

Phase 4 integrates 4 major components:
1. **4.1 Server Actions** — TypeScript actions for photos, network, audit (in `src/app/actions/`)
2. **4.2 Vercel Cron Jobs** — Scheduled network refresh (nightly at 04:00 UTC)
3. **4.3 Integration Tests** — Full workflow tests (in `tests/integration/`)
4. **4.4 Environment Setup** — Secrets & deployment docs

## Completed Components

### ✅ 4.1: Server Actions Implemented

| Action | Location | Status |
|--------|----------|--------|
| `uploadPhoto` | `src/app/actions/photos.ts` | Ready |
| `suggestPhotoAssociations` | `src/app/actions/photos.ts` | Ready |
| `tagPhotoPerson` | `src/app/actions/photos.ts` | Ready |
| `validatePhotoAssociation` | `src/app/actions/photos.ts` | Ready |
| `getNetworkGraph` | `src/app/actions/network.ts` | Ready |
| `detectClusters` | `src/app/actions/network.ts` | Ready |
| `getLocationHubs` | `src/app/actions/network.ts` | Ready |
| `refreshNetworkStats` | `src/app/actions/network.ts` | Ready |
| `getAuditLog` | `src/app/actions/audit.ts` | Ready |
| `getAuditDetail` | `src/app/actions/audit.ts` | Ready |
| `revertChange` | `src/app/actions/audit.ts` | Ready |
| `getAuditStats` | `src/app/actions/audit.ts` | Ready |

**Features:**
- All actions require admin auth + AAL2 (two-factor)
- Input validation on all parameters
- Error handling with user-friendly messages
- Immutable audit trail maintained
- Revalidate paths after mutations

### ✅ 4.2: Vercel Cron Configured

**New Cron Job:**
- **Path:** `/api/cron/refresh-network-stats`
- **Schedule:** `0 4 * * *` (04:00 UTC daily)
- **Duration:** Max 300 seconds (5 minutes)
- **Organizations:** Children of God + Twelve Tribes
- **Actions:** Refresh materialized views, recalculate person degrees

**Configuration in `vercel.json`:**
```json
{
  "path": "/api/cron/refresh-network-stats",
  "schedule": "0 4 * * *"
}
```

### ✅ 4.3: Integration Tests Added

| Test Suite | Location | Tests | Status |
|-----------|----------|-------|--------|
| Photo-Personnel Workflow | `tests/integration/photoPersonnelWorkflow.test.ts` | 10 | Ready |
| Network Refresh Cron | `tests/integration/networkRefreshCron.test.ts` | 10 | Ready |

**Test Coverage:**
- Photo upload & metadata
- Person suggestion algorithms
- Confidence validation (0.5-1.0 range)
- Association status transitions (pending→confirmed/disputed/rejected)
- Network graph structure & stats
- Cluster detection (connected components)
- Location hub ranking
- Authorization checks (admin-only)
- Cron authentication (CRON_SECRET)
- Partial failure handling (206 responses)

### ✅ 4.4: Environment Configuration

**Updated `.env.example`:**
- Public vars (SUPABASE_URL, ANON_KEY, MAPTILER_KEY)
- Server secrets (SUPABASE_SERVICE_ROLE_KEY, GH_DISPATCH_TOKEN, CRON_SECRET)
- Admin config (ADMIN_EMAILS)
- Intake pipeline flag (INTAKE_LIVE)
- Comprehensive deployment checklist in comments

## Pre-Deployment Testing Checklist

### Phase 1: Local Development

- [ ] Run `npm install` (verify no missing dependencies)
- [ ] Run `npm run build` (ensure TypeScript compiles)
- [ ] Copy `.env.example` to `.env.local` and fill in test values
- [ ] Start dev server: `npm run dev`
- [ ] Verify server actions can be imported in pages:
  - [ ] `import { uploadPhoto } from '@/app/actions/photos'`
  - [ ] `import { getNetworkGraph } from '@/app/actions/network'`
  - [ ] `import { getAuditLog } from '@/app/actions/audit'`
- [ ] Run integration tests (if harness supports): `npm test`

### Phase 2: Staging Environment (Vercel Preview)

- [ ] Deploy branch to Vercel preview URL
- [ ] Verify all environment variables are set in Vercel (Project Settings)
- [ ] Test admin pages load (auth-gated):
  - [ ] `/admin/curator` — curator dashboard
  - [ ] `/admin/intake` — intake form
  - [ ] `/admin/review` — score editor
- [ ] Manually trigger cron via curl (staging only):
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" \
    https://preview-url.vercel.app/api/cron/refresh-network-stats
  ```
- [ ] Verify response: `{ "ok": true, "results": [...] }`
- [ ] Check Vercel function logs for any errors
- [ ] Verify network_degree values updated in Supabase
- [ ] Test a short audit log query: `/admin/review` audit tab (if wired)

### Phase 3: Production Deployment

**Before promoting to main:**

1. **Code Review:**
   - [ ] All 12 server actions reviewed for security
   - [ ] No secrets hardcoded
   - [ ] Input validation complete
   - [ ] Error messages don't leak sensitive info

2. **Secrets Configured in Vercel (Production):**
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` — set & verified
   - [ ] `GH_DISPATCH_TOKEN` — set (requires cultiness-spectrum push access)
   - [ ] `CRON_SECRET` — set to strong random value (32+ chars)
   - [ ] `INTAKE_LIVE` — set to `false` (dry-run mode)
   - [ ] `ADMIN_EMAILS` — set to production analyst list
   - [ ] All `NEXT_PUBLIC_*` vars set correctly

3. **cultiness-spectrum Secrets (for CI/CD Workflows):**
   - [ ] `SUPABASE_SERVICE_KEY` — matches zacharymays-site's SUPABASE_SERVICE_ROLE_KEY
   - [ ] `ANTHROPIC_API_KEY` — scorer API key
   - [ ] `OPENAI_API_KEY` — scorer API key
   - [ ] `GEMINI_API_KEY` — scorer API key
   - [ ] `OPENROUTER_API_KEY` — scorer fallback

4. **Cron Schedule Verified:**
   - [ ] `/api/cron/sync-usaspending` at 02:00 UTC
   - [ ] `/api/cron/run-intake` at 03:00 UTC (dispatches GitHub Actions workflow)
   - [ ] `/api/cron/refresh-network-stats` at 04:00 UTC (new)
   - [ ] All 3 crons have CRON_SECRET protection

5. **Dry-Run Validation:**
   - [ ] Intake pipeline set to `INTAKE_LIVE=false` initially
   - [ ] Test cron triggers dry-run: `curl ... /api/cron/run-intake`
   - [ ] Verify no paid API calls made (check API usage dashboards)
   - [ ] Verify proposal status unchanged after dry-run
   - [ ] Monitor for 24 hours, no issues

6. **Production Go-Live:**
   - [ ] Only when satisfied with dry-run results
   - [ ] Set `INTAKE_LIVE=true` in Vercel production env
   - [ ] Document decision & timestamp
   - [ ] Set up alerts for cron failures (optional: Datadog, Sentry, etc.)

## Integration Points

### Photos Server Actions

Currently **not wired to any UI page yet** — planned for Phase 5:
- `/admin/photos` (new page to manage uploaded photos)
- Person-photo tagging UI
- Validation review UI

**To wire when building Phase 5:**
```jsx
import { uploadPhoto, tagPhotoPerson, suggestPhotoAssociations } from '@/app/actions/photos';

async function handleUpload(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sourceType', 'user_upload');
  formData.append('orgId', orgId);
  
  const result = await uploadPhoto(formData);
  if (result.ok) {
    toast.success('Photo uploaded');
    refreshPhotos();
  } else {
    toast.error(result.error);
  }
}
```

### Network Server Actions

Used by existing network visualization pages:
- `/research/children-of-god-network` — calls `getNetworkGraph()`
- `/research/twelve-tribes-network` — calls `getNetworkGraph()`

**Already integrated in ChildrenOfGodClient.jsx / TwelveTribesClient.jsx:**
- Fetch network data on mount
- Detect clusters for filtering
- Query location hubs for sidebar

**Cron refresh updates these pages:**
- Nightly at 04:00 UTC, `refreshNetworkStats()` recalculates degrees
- Pages will show fresh data on next load (due to `revalidatePath()`)

### Audit Server Actions

Used by existing audit UI:
- `/admin/review` audit tab — calls `getAuditLog()`, `getAuditDetail()`
- Future: `/admin/audit-dashboard` for comprehensive audit review

**Currently wired in:**
- Score history filtering (existing)
- Criterion change audit trail (existing)

## Monitoring Post-Deployment

### Health Checks (First 48 Hours)

1. **Cron Execution:**
   - Open Vercel Dashboard → Project → Functions → Recent invocations
   - [ ] 02:00 UTC: sync-usaspending runs (existing, baseline)
   - [ ] 03:00 UTC: run-intake dispatches workflow (existing, baseline)
   - [ ] 04:00 UTC: refresh-network-stats completes (new)
   - All should show status: `200` or `206`

2. **Intake Pipeline (if enabled):**
   - [ ] GitHub Actions: cultiness-spectrum → Actions → intake-pipeline
   - [ ] Check last 3 runs (should be dry-run if INTAKE_LIVE=false)
   - [ ] Verify no paid API call charges in Anthropic/OpenAI consoles

3. **Database Health:**
   - [ ] Supabase → Logs tab: no cascading errors
   - [ ] Supabase → Extensions: materialized views `network_connections` exist
   - [ ] Query: `SELECT COUNT(*) FROM network_connections WHERE org_id = '...'`
     - Should return same or increasing count (fresh data)
   - [ ] Query: `SELECT MIN(network_degree), MAX(network_degree) FROM persons WHERE org_id = '...'`
     - Should show non-zero max degree (refresh working)

4. **Admin Pages:**
   - [ ] `/admin/curator` loads & shows ACCEPTED orgs
   - [ ] `/admin/intake` form works (can submit a test proposal)
   - [ ] `/admin/review` score editor functions
   - [ ] Network graphs on research pages render without errors

### Alerts & Error Monitoring

**Set up alerts (optional but recommended):**
- Vercel Cron timeout failures
- Supabase RPC errors (if using refresh_network_connections RPC)
- Admin auth failures (sudden AAL2 issues)
- Intake workflow dispatch failures

**Logging Points:**
- All Server Actions log errors to console
- Cron responses include success/failure for each org
- Audit trail records all mutations

## Rollback Plan

If issues arise in first 48 hours:

1. **Disable new cron (temporary):**
   - Remove `/api/cron/refresh-network-stats` from `vercel.json`
   - Re-deploy: `git push` (Vercel auto-deploys)
   - Existing crons (sync-usaspending, run-intake) continue

2. **Disable new Server Actions (if broken):**
   - Don't remove files, just don't wire them into any UI
   - Existing pages continue to work (they don't call new actions)

3. **Revert Intake Pipeline (if broken):**
   - Set `INTAKE_LIVE=false` (already default)
   - Dry-run continues but no paid calls made

4. **Full Rollback:**
   - Revert commit before Phase 4
   - Cherry-pick only stable Phase 3 commits

## Success Criteria

Phase 4 is **COMPLETE** when:

- ✅ All 12 server actions compile & can be imported
- ✅ Vercel cron configured & fires at correct times (04:00 UTC)
- ✅ Cron responses show success for both orgs (Children of God, Twelve Tribes)
- ✅ `network_degree` values update nightly in Supabase
- ✅ No paid API charges during dry-run testing
- ✅ Admin pages load without auth errors
- ✅ Integration tests pass (or marked as "integration test framework pending")
- ✅ `.env.example` complete with deployment docs
- ✅ No TypeScript compilation errors
- ✅ No security issues (secrets not hardcoded)

## Known Limitations

1. **Photo upload UI not wired yet:**
   - Server actions exist but no `/admin/photos` page yet (Phase 5)
   - Can still test via direct API calls if needed

2. **ML-based photo suggestions placeholder:**
   - `suggestPhotoAssociations` uses heuristic matching
   - Real vision model integration planned for Phase 5+

3. **Materialized view refresh RPC:**
   - Cron has fallback if `refresh_network_connections` RPC doesn't exist
   - Safe to deploy (won't crash if RPC missing)

4. **Audit revert limited to UPDATE:**
   - Only UPDATE operations can be reverted (safest)
   - INSERT/DELETE reversals require manual RPC (future)

## Questions & Support

- **Questions about Phase 4?** Check the memory notes: `phase-j-intake-review-pipeline.md`, `phase-i-curator-dashboard.md`
- **Need to extend cron?** Add new org IDs to `src/app/api/cron/refresh-network-stats/route.ts`
- **Issues with auth?** Verify ADMIN_EMAILS & AAL2 in Supabase
- **API errors?** Check cultiness-spectrum `.env` for missing keys (ANTHROPIC_API_KEY, etc.)

---

**Last Updated:** 2026-06-18
**Phase 4 Status:** READY FOR TESTING
**Next Phase:** Phase 5 (UI wiring & advanced features)
