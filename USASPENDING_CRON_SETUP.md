# USASpending Cron Setup - Configuration Checklist

## ✅ What's Configured

- [x] Supabase Edge Function: `sync-usaspending` (deployed)
- [x] Database Tables: `usaspending_awards`, `usaspending_sync_runs` (created)
- [x] Cron Endpoint: `/api/cron/sync-usaspending` (updated)
- [x] Cron Schedule: Daily at 2 AM UTC (`0 2 * * *`)
- [x] Python Sync Script: `cultiness-spectrum/db/sync_usaspending.py` (created)

## 📋 Required Vercel Environment Variables

Set these in **Vercel Project → Settings → Environment Variables**:

### 1. `SUPABASE_SERVICE_ROLE_KEY` (Required)
- **Value:** Get from Supabase Dashboard → Settings → API → Service Role key
- **Project:** shgdrkrqjnwtlyxcdayp
- **Where to find:**
  1. Go to https://app.supabase.com/projects
  2. Click "cultiness-spectrum" project
  3. Settings → API → Copy "Service Role" key (the longer one)
- **Scope:** Production, Preview

### 2. `CRON_SECRET` (Required)
- **Value:** Any random string (used to secure the cron endpoint)
- **Generate:** `openssl rand -hex 32` or use a password manager
- **Example:** `a7f3k9m2n5x8p1q4r7s0t3u6v9w2z5c8`
- **Scope:** Production, Preview

### 3. `NEXT_PUBLIC_SUPABASE_URL` (Already Set)
- Should be: `https://shgdrkrqjnwtlyxcdayp.supabase.co`
- Verify in Vercel project settings

### 4. `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Already Set)
- Should be set from Supabase (public, safe for browser)
- Verify in Vercel project settings

## 🔧 Setup Steps

### Step 1: Get Supabase Service Role Key
```bash
# Copy from Supabase dashboard:
# Settings → API → Service Role (the long key starting with "sbp_" or similar)
```

### Step 2: Generate Cron Secret
```bash
# Option A: Using openssl
openssl rand -hex 32

# Option B: Using Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Option C: Using Python
python3 -c "import secrets; print(secrets.token_hex(16))"
```

### Step 3: Add to Vercel
1. Go to **https://vercel.com/dashboard** → Select "zacharymays-site" project
2. Click **Settings** → **Environment Variables**
3. Add two new variables:
   - Name: `SUPABASE_SERVICE_ROLE_KEY` → Value: (paste from Step 1)
   - Name: `CRON_SECRET` → Value: (paste from Step 2)
4. Ensure both are set for **Production** and **Preview**
5. Click **Save**

### Step 4: Test the Cron (Optional)
```bash
# Test locally (requires CRON_SECRET to match):
curl -X GET \
  https://zacharymays-site.vercel.app/api/cron/sync-usaspending \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "x-vercel-cron-schedule: 0 2 * * *"

# Should return:
# {
#   "success": true,
#   "sync_run_id": "uuid",
#   "awards_fetched": 1000,
#   "awards_stored": 1000,
#   "message": "Synced 1000 federal awards from USASpending.gov"
# }
```

### Step 5: Deploy
```bash
# Commit and push to trigger Vercel deployment
cd /Users/Zack/zacharymays-site
git add vercel.json src/app/api/cron/sync-usaspending/route.js
git commit -m "Configure USASpending cron sync: daily at 2 AM UTC"
git push origin main
```

Vercel will auto-deploy and activate the cron schedule.

## 📊 Monitoring

### View sync logs in Supabase:
```sql
SELECT
  sync_run_id,
  started_at,
  completed_at,
  status,
  awards_fetched,
  awards_stored,
  error_message
FROM public.usaspending_sync_runs
ORDER BY started_at DESC
LIMIT 20;
```

### View recent awards:
```sql
SELECT
  award_id,
  recipient_name,
  award_amount,
  fiscal_year,
  fetched_at
FROM public.usaspending_awards
ORDER BY fetched_at DESC
LIMIT 10;
```

### Vercel Cron Logs:
- https://vercel.com/dashboard/zacharymays-site → Functions tab → Cron Jobs
- Shows last run time, status, and runtime duration

## 🔍 Troubleshooting

### Cron not running?
- [ ] Check Vercel project has `vercel.json` with cron schedule
- [ ] Verify `CRON_SECRET` is set in Vercel environment variables
- [ ] Check function name is exactly `/api/cron/sync-usaspending`

### Edge function returns 401?
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is correct and not truncated
- [ ] Check it's the **Service Role** key, not the ANON key
- [ ] Verify it's set in Vercel production environment

### No awards stored?
- [ ] Check if USASpending.gov API is responding: `curl https://api.usaspending.gov/api/v2/awards/?page=1&limit=1`
- [ ] Check Supabase tables exist: `SELECT * FROM usaspending_awards LIMIT 1;`
- [ ] Check RLS policies allow service_role: `SELECT * FROM pg_policies WHERE tablename = 'usaspending_awards';`

### Database permission denied?
- [ ] Ensure edge function uses `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- [ ] Verify RLS policies are in place and allow service_role

## 📝 Manual Sync (Testing)

To manually sync without waiting for cron:

```bash
cd /Users/Zack/cultiness-spectrum

# Set env var (get from Vercel)
export SUPABASE_JWT_TOKEN="your-service-role-key"

# Run sync
python3 db/sync_usaspending.py --dry-run  # Test mode
python3 db/sync_usaspending.py             # Full sync
python3 db/sync_usaspending.py --limit 100 # First 100 awards
```

## 🎯 Next Steps

1. **Now:** Set `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` in Vercel
2. **Then:** Deploy (push to main)
3. **After 2 AM UTC:** Check Supabase for synced awards
4. **Monitor:** Watch cron logs in Vercel dashboard

**Schedule:** Daily at 2 AM UTC (configurable in `vercel.json`)

---

Questions? Check:
- Vercel cron docs: https://vercel.com/docs/crons
- Supabase edge functions: https://supabase.com/docs/guides/functions
- USASpending API docs: https://api.usaspending.gov/api/v2/docs/
