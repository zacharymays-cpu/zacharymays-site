# Plan #2 — OCI Repo Extraction + Vercel Project + Domains

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. This plan is ops/config-heavy; "tests" here are build/deploy/curl checks, not unit tests.

**Goal:** Stand up the standalone OCI dataset site as its own repo and Vercel project on the canonical domain, deploying the dataset half of the current app, before any content rebrand.

**Architecture:** Repo B is created as a copy of the current `zacharymays-site` (which contains the full app), then the author-only pages are removed so it deploys as the dataset site. It reuses the shared Supabase project (same env vars). Domains are bought and wired via Vercel Domains; the four alias domains 301-redirect to the canonical. The content rebrand (name-scrub, OCI branding, canonical SEO) is Plan #3 — this plan only gets the dataset app live on its own infra.

**Tech Stack:** Next.js App Router, Vercel, Vercel Domains, shared Supabase.

## Global Constraints

- **Canonical domain:** `organizationalcoercionindex.org`. Aliases (301 → canonical): `coercionindex.org`, `organizationalcoercionindex.com`, `cultspectrum.com`, `cultspectrum.org`.
- **Shared Supabase** project `shgdrkrqjnwtlyxcdayp` — same env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). No DB changes.
- **Prerequisite:** Plan #1 (scoring module) merged first, so Repo B inherits it.
- **Author-only routes to REMOVE from Repo B:** `/` (home) is replaced later (Plan #3) — for now keep a placeholder; remove `/about`, `/how-we-got-here`, `/assholes-in-history`, `/donate`, `/terms`. Everything else (oci, explore, org, research, research-system, compass, findings, admin, api) stays.
- **Crons stay** in Repo B's `vercel.json` (they are dataset crons). They must NOT also run in Repo A.
- The user executes anything requiring payment or account access (domain purchase, Vercel project creation, env-var entry). The plan marks these **[USER]**.

## File Structure

- New repo `organizational-coercion-index` (working name), created from a copy of `zacharymays-site` at the post-Plan-1 commit.
- Removed in Repo B: `src/app/about/`, `src/app/how-we-got-here/`, `src/app/assholes-in-history/`, `src/app/donate/`, `src/app/terms/`.
- Modified in Repo B: `src/components/Nav.jsx` (drop author items), `src/app/page.jsx` (temporary redirect to `/oci`), `README.md`, `package.json` (`name`).

---

## Task 1: Create Repo B from the current repo

- [ ] **Step 1 [USER]: Create the empty GitHub repo** under a neutral owner (a new org or account, NOT `zacharymays-cpu`). Name: `organizational-coercion-index`. Do not initialize with README.

- [ ] **Step 2: Copy the working tree** (preserves full history):

```bash
cd /Users/Zack
git clone zacharymays-site organizational-coercion-index
cd organizational-coercion-index
git remote remove origin
git remote add origin <new-repo-ssh-url>
```

- [ ] **Step 3: Confirm Plan #1 is present**

Run: `test -f src/lib/scoring.js && echo OK`
Expected: `OK`. If missing, merge Plan #1 into `zacharymays-site` first and re-clone.

- [ ] **Step 4: Set the package name**

In `package.json`, change `"name": "zachary-mays-site"` → `"name": "organizational-coercion-index"`.

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore: initialize OCI repo from zacharymays-site"
```

## Task 2: Remove author-only pages from Repo B

- [ ] **Step 1: Delete the author route directories**

```bash
git rm -r src/app/about src/app/how-we-got-here src/app/assholes-in-history src/app/donate src/app/terms
```

- [ ] **Step 2: Temporary root redirect** — replace `src/app/page.jsx` with a redirect to the dataset overview (the real OCI homepage is built in Plan #3):

```jsx
// src/app/page.jsx
import { redirect } from 'next/navigation';
export default function Home() { redirect('/oci'); }
```

- [ ] **Step 3: Trim the Nav** — in `src/components/Nav.jsx`, remove the `Books`, `About`, and `Support` entries from `NAV_ITEMS` (they are author-only). Keep the `Organizational Coercion Index`, `Methodology`, and `Research System` groups. (Full OCI nav polish is Plan #3.)

- [ ] **Step 4: Verify the build has no dangling imports**

Run: `npx next build`
Expected: Success. If any removed page was imported elsewhere, the build names it — remove that reference.

- [ ] **Step 5: Grep for links to removed routes**

Run: `grep -rInE "/about|/donate|/how-we-got-here|/assholes-in-history|/terms" src/app src/components`
Expected: no internal `<Link>`/`href` to the deleted pages. Fix any (they belong on the author site now).

- [ ] **Step 6: Commit + push**

```bash
git add -A
git commit -m "feat: strip author-only pages; OCI dataset app only"
git push -u origin main
```

## Task 3: Create the Vercel project

- [ ] **Step 1 [USER]: Import the new repo** into Vercel as a new project (Framework preset: Next.js).

- [ ] **Step 2 [USER]: Add environment variables** (copy from the existing project): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus any others the current project uses (`NEXT_PUBLIC_MAPTILER_KEY`, `GH_DISPATCH_TOKEN`, `INTAKE_LIVE`, etc. — mirror the source project's env list).

- [ ] **Step 3: Trigger a preview deploy** (push or Vercel dashboard). Confirm the preview URL loads `/oci`, `/explore` (with live Supabase data), and `/explore/map` (MapTiler).

- [ ] **Step 4: Verify no author routes 404-leak** — visit `/about` on the preview; it should 404 (expected — those live only on the author site now).

## Task 4: Buy and wire the domains

- [ ] **Step 1 [USER]: Purchase the five domains** via Vercel Domains (Project → Domains, or vercel.com/domains): `organizationalcoercionindex.org`, `coercionindex.org`, `organizationalcoercionindex.com`, `cultspectrum.com`, `cultspectrum.org`.

- [ ] **Step 2 [USER]: Assign the canonical** — add `organizationalcoercionindex.org` to the OCI project as the primary domain. Vercel auto-provisions DNS + SSL.

- [ ] **Step 3 [USER]: Set the four aliases to redirect** — add each alias domain to the project and configure "Redirect to `organizationalcoercionindex.org`" (301). 

- [ ] **Step 4: Verify redirects**

Run (after DNS propagates):
```bash
for d in coercionindex.org organizationalcoercionindex.com cultspectrum.com cultspectrum.org; do
  echo "== $d =="; curl -sI "https://$d" | grep -iE "HTTP/|location";
done
```
Expected: each returns `301` (or `308`) with `location: https://organizationalcoercionindex.org/...`.

- [ ] **Step 5: Verify canonical serves the app**

Run: `curl -sI https://organizationalcoercionindex.org | grep -iE "HTTP/"`
Expected: `200`.

## Task 5: Disable the crons on the author repo (avoid double-runs)

- [ ] **Step 1:** This is done in Plan #5 (author trim), which removes `vercel.json` crons + the `api/cron` routes from Repo A. Note here as a cross-plan dependency so the crons don't run in both projects simultaneously. **Do not** enable production cutover (Plan #6) until Repo A's crons are removed.

---

## Self-Review Notes

- Deploys the dataset app on its own repo + project + canonical domain with working redirects — no content rebrand yet (Plan #3).
- Supabase shared, unchanged.
- Cron double-run risk explicitly flagged and tied to Plan #5.
- Payment/account steps marked [USER]; agent cannot execute them.
- Git history preserved via clone (a later `git filter-repo` to excise author-only history is optional and NOT required for soft separation).
