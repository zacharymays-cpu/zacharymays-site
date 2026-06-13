# USASpending Cron Job Verification

**Date Verified:** June 12, 2026  
**CRON_SECRET Set:** June 8, 2026  
**Status:** ✅ **READY TO RUN**

---

## Configuration Checklist

### ✅ Vercel Cron Schedule
- **File:** `vercel.json`
- **Endpoint:** `/api/cron/sync-usaspending`
- **Schedule:** `0 2 * * *` (Daily at 2 AM UTC)
- **Status:** Configured ✓

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-usaspending",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### ✅ Cron Endpoint Handler
- **File:** `src/app/api/cron/sync-usaspending/route.js`
- **Runtime:** Node.js
- **Dynamic:** force-dynamic
- **Authentication:** CRON_SECRET (Bearer token)
- **Status:** Configured ✓

**Auth Flow:**
```
Vercel Cron (automatic)
  ↓
Sends: Authorization: Bearer ${CRON_SECRET}
  ↓
Endpoint validates: authHeader === `Bearer ${cronSecret}`
  ↓
If valid, calls Supabase edge function
  ↓
Edge function requires SUPABASE_SERVICE_ROLE_KEY
```

### ✅ Environment Variables (Vercel)
Verified set on June 8, 2026:

| Variable | Status | Used By |
|----------|--------|---------|
| `CRON_SECRET` | ✅ Set | Endpoint auth (verifies Vercel is calling) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set | Edge function auth (calls Supabase API) |

**Scope:** Production + Preview ✓

### ✅ Supabase Edge Function
- **Name:** `sync-usaspending-awards`
- **URL:** `https://shgdrkrqjnwtlyxcdayp.functions.supabase.co/sync-usaspending-awards`
- **Version:** 2 (updated June 12, 2026)
- **Status:** ACTIVE ✓
- **JWT Required:** Yes (service_role)

**What it does:**
1. Validates Bearer token (SUPABASE_SERVICE_ROLE_KEY)
2. Queries USASpending.gov API (paginated, 1000 records/run)
3. Upserts records into `usaspending_awards` table
4. Returns success/error with counts

### ✅ Database Tables
Both tables exist with correct schema:

#### `usaspending_awards` (22 columns)
```
id (UUID, PK)
org_id (FK to organizations)
award_id (TEXT, unique)
recipient_name (TEXT)
award_amount (NUMERIC)
fiscal_year (SMALLINT)
awarding_agency (TEXT)
...and 14 more fields
```

**RLS Policy:** service_role access only ✓

#### `usaspending_sync_runs` (9 columns)
```
id (UUID, PK)
started_at (TIMESTAMP)
completed_at (TIMESTAMP)
status (TEXT: in_progress|completed|failed)
requested_org_limit (INT)
matched_org_count (INT)
award_count (INT)
error_message (TEXT)
metadata (JSONB)
```

**RLS Policy:** service_role access only ✓

---

## How It Works (Step-by-Step)

### **Every Day at 2 AM UTC:**

1. **Vercel Cron Trigger** (automatic)
   - Vercel sends HTTP GET to `/api/cron/sync-usaspending`
   - Includes: `Authorization: Bearer ${CRON_SECRET}` header

2. **Endpoint Authentication** (route.js)
   - Reads `CRON_SECRET` from process.env
   - Compares request header to expected value
   - **If no match → 401 Unauthorized (fails safely)**
   - If match → continues

3. **Fetch Service Role Key** (route.js)
   - Reads `SUPABASE_SERVICE_ROLE_KEY` from process.env
   - **If missing → 500 error (fails safely)**
   - If present → continues

4. **Call Edge Function** (route.js)
   - POST to `https://shgdrkrqjnwtlyxcdayp.functions.supabase.co/sync-usaspending-awards`
   - Headers: `Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
   - Timeout: 300 seconds (5 minutes)

5. **Edge Function Runs** (Supabase)
   - Validates JWT token
   - **If invalid → 401 Unauthorized**
   - If valid → queries USASpending.gov API
   - Pages through results (up to 1000 records)
   - Upserts into `usaspending_awards` table
   - Returns: `{ success: true, awards_fetched: N, awards_stored: M }`

6. **Endpoint Logs Response** (route.js)
   - Logs sync stats to Vercel
   - Returns: `{ success: true, sync_run_id, awards_fetched, awards_stored }`

---

## Testing the Cron

### **Test 1: Endpoint is reachable (requires CRON_SECRET)**

```bash
# Only works if you have the actual CRON_SECRET value
# Vercel will inject it automatically, but manual testing requires it

# If you have the secret:
curl -X GET \
  https://zacharymays-site.vercel.app/api/cron/sync-usaspending \
  -H "Authorization: Bearer YOUR_ACTUAL_CRON_SECRET" \
  -H "x-vercel-cron-schedule: 0 2 * * *"

# Expected response (200):
# {
#   "success": true,
#   "schedule": "0 2 * * *",
#   "sync_run_id": "abc123...",
#   "awards_fetched": 1000,
#   "awards_stored": 1000,
#   "message": "Synced 1000 federal awards from USASpending.gov"
# }
```

### **Test 2: Check Vercel cron logs**

1. Go to https://vercel.com/dashboard
2. Click **zacharymays-site** project
3. Go to **Functions** tab → **Cron Jobs**
4. Check last run time, status, and duration

### **Test 3: Check Supabase data**

Query the sync runs:
```sql
SELECT 
  id,
  started_at,
  status,
  award_count,
  error_message
FROM public.usaspending_sync_runs
ORDER BY started_at DESC
LIMIT 10;
```

Check awards stored:
```sql
SELECT 
  COUNT(*) as total_awards,
  MAX(last_seen_at) as most_recent,
  COUNT(DISTINCT awarding_agency) as agencies
FROM public.usaspending_awards;
```

---

## Potential Failure Points & Recovery

| Failure Point | Symptom | Recovery |
|---|---|---|
| **CRON_SECRET not set** | Endpoint returns 401 | Verify in Vercel: Settings → Environment Variables |
| **SUPABASE_SERVICE_ROLE_KEY not set** | Endpoint returns 500 | Verify in Vercel: Settings → Environment Variables |
| **Service role key is wrong/expired** | Edge function returns 401 | Re-copy from Supabase: Settings → API → Service Role |
| **USASpending API is down** | Edge function returns 5xx | Wait for API recovery; check https://api.usaspending.gov/api/v2/ |
| **Supabase tables missing RLS policy** | Upsert fails with permission error | Re-run migration: `mcp__claude_ai_Supabase__apply_migration` |
| **Network timeout** | Request takes >5 min | Reduce page limit from 10 → 5 in edge function |

---

## Monitoring

### **Daily Checks (2 AM UTC + 1 hour)**

1. **Vercel Dashboard:** Cron ran? No errors?
2. **Supabase:** New awards in `usaspending_awards`?
3. **Logs:** No error_message entries in `usaspending_sync_runs`?

### **Weekly Summary**

```sql
SELECT 
  DATE(started_at) as sync_date,
  COUNT(*) as runs,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
  SUM(award_count) as total_awards_synced
FROM public.usaspending_sync_runs
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY sync_date DESC;
```

---

## Summary

✅ **Cron job is fully configured and ready to execute.**

**What will happen at 2 AM UTC every day:**
1. Vercel triggers `/api/cron/sync-usaspending` with Bearer token
2. Endpoint validates token + service role key
3. Calls Supabase edge function with JWT
4. Edge function fetches 1000 awards from USASpending.gov
5. Upserts into database
6. Logs results to Supabase audit table

**Last validation:** June 12, 2026  
**CRON_SECRET set:** June 8, 2026  
**All components:** ✅ Ready

**If cron doesn't run:**
- Check Vercel Functions dashboard for errors
- Verify environment variables in Vercel Settings
- Check Supabase logs for 401/permission errors
- Confirm USASpending API is online

---

**Questions?** See `USASPENDING_CRON_SETUP.md` for setup details or `ARCHITECTURE.md` for system overview.
