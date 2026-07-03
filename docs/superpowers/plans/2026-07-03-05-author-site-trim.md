# Plan #5 — Author-Site Trim (Repo A: zacharymays-site)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Reduce `zacharymays-site` to the author site — remove the dataset app now living in Repo B, make metadata author-first, replace live dataset widgets with a quiet "Research →" link, and drop the Supabase dependency and dataset crons.

**Architecture:** Deletions + metadata edits in the existing repo. After this, `zacharymays.com` serves only the homepage, About, the two books, Donate, and Terms. The dataset (OCI) is reached only via one quiet outbound link.

**Tech Stack:** Next.js App Router.

## Global Constraints

- **Keep only:** `/`, `/about`, `/how-we-got-here`, `/assholes-in-history`, `/donate`, `/terms`.
- **Remove (now in Repo B):** `src/app/oci`, `src/app/explore`, `src/app/org`, `src/app/research`, `src/app/research-system`, `src/app/compass`, `src/app/findings`, `src/app/admin`, `src/app/auth`, `src/app/api`.
- **Cross-plan ordering:** do NOT merge this until Repo B (Plans #2–#4) is deployed and serving the dataset, so nothing is lost. Removing `api/cron` here is what prevents cron double-runs (Plan #2 Task 5).
- **Author metadata is author-first** — remove "The Cultiness Spectrum" from the site title/description; the dataset is not the headline.
- **Quiet cross-link only** — one "Research →" link (nav or footer) to `https://organizationalcoercionindex.org`. Not a featured homepage block.
- **Keep** the author's existing warm design system (`globals.css`) unchanged — it stays with the author site.
- The author site should end with **no Supabase dependency** once the live widgets are removed.

## File Structure

- Delete: the dataset route/API directories listed above, plus dataset-only components (`Correlation.jsx`, `CultsOverTimeChart.jsx`, `ExploreNav.jsx`, `LiveStats.jsx`, `OrgCount.jsx`) and dataset-only lib (`curator*`, `intake*`, `reviewQueue`, `identity/*`, `getDatasetStats`, `getFindingsStats`, `getActiveCultsTimeline`, `hooks/useDatasetStats`, `supabase/*`, `scoring.js`, `auth*`).
- Modify: `src/app/layout.jsx` (author-first metadata; nav; footer), `src/app/page.jsx` (remove live widgets; add quiet link), `src/components/Nav.jsx` (author items only), `vercel.json` (drop crons), `next.config.js` (drop Supabase from CSP), `src/app/sitemap.js` / `robots.js` / `opengraph-image.js` (author only).

---

## Task 1: Remove the dataset routes and APIs

- [ ] **Step 1: Delete**

```bash
cd /Users/Zack/zacharymays-site
git rm -r src/app/oci src/app/explore src/app/org src/app/research src/app/research-system src/app/compass src/app/findings src/app/admin src/app/auth src/app/api
```

- [ ] **Step 2: Delete dataset crons** — in `vercel.json`, remove the entire `"crons"` array (all three point at the now-deleted `/api/cron/*`).

- [ ] **Step 3: Build to find dangling references**

Run: `npx next build`
Expected: fails listing imports of deleted modules — expected; fixed in Tasks 2–3.

## Task 2: De-widget the homepage; author-first metadata

- [ ] **Step 1: `src/app/page.jsx`** — remove the `OrgCount` and `Correlation` live dataset widgets. Where the dataset was featured, add a single quiet link: `<a href="https://organizationalcoercionindex.org">Research → The Organizational Coercion Index</a>`. Keep the author/book content.

- [ ] **Step 2: `src/app/layout.jsx`** — author-first metadata:

```jsx
export const metadata = {
  metadataBase: new URL('https://www.zacharymays.com'),
  title: { default: 'Zachary S. Mays', template: '%s — Zachary S. Mays' },
  description: 'Author and researcher. How We Got Here. Assholes in History.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: 'Zachary S. Mays', title: 'Zachary S. Mays', description: 'Author and researcher.', url: 'https://www.zacharymays.com' },
  twitter: { card: 'summary_large_image', title: 'Zachary S. Mays', description: 'Author and researcher.' },
};
```

Keep the footer's Young & Reed credit line only if the author pages still reference the dataset (they do, on `/about` and `/donate`) — it is attribution, keep it.

- [ ] **Step 3: `src/components/Nav.jsx`** — reduce `NAV_ITEMS` to author entries: Books (the two titles), About, Support, and a single "Research" link out to the OCI domain. Remove the OCI / Methodology / Research System groups.

- [ ] **Step 4: Build**

Run: `npx next build`
Expected: success once all deleted-module imports are gone.

## Task 3: Remove dataset components + lib + Supabase dep

- [ ] **Step 1: Delete dataset-only components and lib**

```bash
git rm src/components/Correlation.jsx src/components/CultsOverTimeChart.jsx src/components/ExploreNav.jsx src/components/LiveStats.jsx src/components/OrgCount.jsx
git rm -r src/lib/supabase src/lib/identity
git rm src/lib/curatorLifecycle.js src/lib/curatorQueue.js src/lib/curatorSignals.js src/lib/getActiveCultsTimeline.js src/lib/getDatasetStats.js src/lib/getFindingsStats.js src/lib/intakeDedup.js src/lib/intakeProposals.js src/lib/reviewQueue.js src/lib/scoring.js src/lib/supabase.js src/lib/authCore.js src/lib/auth.ts
```

- [ ] **Step 2: Remove their tests**

```bash
git rm -r test tests
```
(Author site has no remaining unit-tested logic; if any test targets a kept file, keep that one.)

- [ ] **Step 3: `next.config.js`** — remove the Supabase hosts from the CSP `connect-src` and the `SUPABASE_*_HOST` consts (the author site no longer calls Supabase). Keep MapTiler/Carto only if a kept page uses a map (it does not — remove those too if unused).

- [ ] **Step 4: Drop the dependency** — if `package.json` lists `@supabase/supabase-js` and nothing kept imports it, remove it: `npm uninstall @supabase/supabase-js`.

- [ ] **Step 5: Confirm no Supabase references remain**

Run: `grep -rInE "supabase|SUPABASE" src next.config.js`
Expected: no results.

- [ ] **Step 6: Build + commit**

```bash
npx next build
git add -A
git commit -m "refactor: trim to author site; remove dataset app, Supabase dep, crons"
```

## Task 4: Author sitemap/robots/OG + env cleanup

- [ ] **Step 1: `sitemap.js` / `robots.js`** — author routes only, under `https://www.zacharymays.com`.

- [ ] **Step 2: `opengraph-image.js`** — keep the author identity (this one stays personal).

- [ ] **Step 3 [USER]: Remove now-unused env vars** from the `zacharymays-site` Vercel project (`SUPABASE_*`, `GH_DISPATCH_TOKEN`, `INTAKE_LIVE`, `MAPTILER` if map removed).

- [ ] **Step 4: Deploy preview; verify** `zacharymays.com` preview shows only author pages; `/explore` etc. now 404; homepage has the quiet Research link; no Supabase network calls in the console.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: author-only sitemap/robots; env cleanup"
```

---

## Self-Review Notes

- Ordering guard: merge only after Repo B is live (else content loss). Cron removal here resolves the double-run risk from Plan #2.
- Author site ends Supabase-free, author-first, with a single quiet outbound link — matches "soft, not the headline."
- Author's warm design system is intentionally left untouched.
