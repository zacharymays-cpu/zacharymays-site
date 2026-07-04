# Plan #5 (Revised) — Author Trim + Shared Research-System Package

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. This plan touches the LIVE production author site (zacharymays.com) — verify each build/deploy before moving to the next task.

**Goal:** Trim `zacharymays-site` to an author-only site while (a) keeping the static `/research-system/*` pages on it, (b) adding a prominent OCI link on the homepage, and (c) extracting the research-system content into a shared package so both `zacharymays.com` and `organizationalcoercionindex.org` render the same content and stay in sync as it's updated.

**Architecture:** A new package `@oci/research-system-content` (published as a GitHub-hosted npm package, no registry needed — installed via git URL) exports the eight research-system pages as pure content + a set of presentational React components. Each site keeps a thin route file per page that imports the shared component and renders it inside that site's own layout — so styling stays site-native (author's warm palette on zacharymays.com, OCI's cool tokens on organizationalcoercionindex.org) while prose/data/structure are identical. The author site then has the dataset routes, crons, and Supabase/maplibre dependencies removed (they now live only in the OCI repo), and gets a prominent homepage CTA to OCI.

**Tech Stack:** Next.js App Router (both repos), a plain npm package (git-URL dependency, no build step needed if it ships JSX source through Next's transpilation — see Task 1 for the exact approach), shared via `zacharymays-cpu` GitHub org.

## Global Constraints

- **Scope of "kept in sync" = Research System pages ONLY**: `/research-system`, `/research-system/overview`, `/research-system/evolution-timeline`, `/research-system/v4-anchor-heuristic`, `/research-system/v5-0-evidence-jury`, `/research-system/v5-1-formal-validation`, `/research-system/v5-2-deepseek-case-study`, `/research-system/v6-0-lifton-framework`, `/research-system/v6-1-permanence-aware`. These are confirmed static — zero Supabase/maplibre/scoring-module imports (verified 2026-07-04).
- **Do NOT mirror** `/research/children-of-god-network` or `/research/twelve-tribes-network` — those use Supabase + maplibre + the scoring module and stay OCI-only. They are already correctly OCI-only (removed from the author site during the original extraction, Plan #2).
- **Content is shared; presentation is per-site.** Shared components receive/emit *semantic* class names or accept a minimal set of style props — they must NOT hardcode either site's color tokens. Each site's route file supplies the wrapper/typography via its own CSS.
- **Author-site removals**: dataset routes (`oci`, `explore`, `org`, `compass`, `findings`, `admin`, `auth`, `api/cron/*`, `api/dataset-stats`), dataset-only components (`Correlation`, `CultsOverTimeChart`, `ExploreNav`, `LiveStats`, `OrgCount`), dataset-only lib (`curator*`, `intake*`, `reviewQueue`, `identity/*`, `getDatasetStats`, `getFindingsStats`, `getActiveCultsTimeline`, `hooks/useDatasetStats`, `supabase/*`, `scoring.js`, `auth*`), `vercel.json` crons, Supabase/maplibre from `package.json` and `next.config.js` CSP.
- **KEEP** `/research-system/*` route directories (now thin wrappers around the shared package) and `/research/children-of-god-network` + `/research/twelve-tribes-network` are REMOVED (confirmed OCI-only, not in the shared scope).
- **Homepage OCI link**: replace the quiet nav-only link with a visible homepage section/CTA (e.g., a card or banner: "The Organizational Coercion Index — our dataset project" → `https://organizationalcoercionindex.org`).
- **This plan touches the live author site.** Merge only after each task's build is verified; deploy behind a branch/PR, not directly to `main`, consistent with prior plans in this sequence.
- Package name convention: `@zacharymays-cpu/oci-research-system` (git-installable: `github:zacharymays-cpu/oci-research-system-content#main`) — adjust final name if the user prefers otherwise, but keep it consistent across both repos' `package.json`.

## File Structure

- **New repo** `oci-research-system-content` (or a directory-based git submodule — see Task 1 decision): exports `Overview`, `EvolutionTimeline`, `V4AnchorHeuristic`, `V5EvidenceJury`, `V51FormalValidation`, `V52DeepseekCaseStudy`, `V60LiftonFramework`, `V61PermanenceAware`, `ResearchSystemIndex` components + their shared data/prose.
- **In OCI repo** (`organizational-coercion-index`): `src/app/research-system/*/page.jsx` become thin wrappers importing from the shared package.
- **In author repo** (`zacharymays-site`): same thin-wrapper treatment; dataset routes/components/lib removed; `src/app/page.jsx` gets the new OCI CTA section; `vercel.json`, `next.config.js`, `package.json` cleaned of dataset-only entries.

---

## Task 1: Decide and scaffold the shared package mechanism

**Files:**
- Create: new repo `oci-research-system-content` (git-installable package) OR a `packages/research-system-content` directory if a monorepo/submodule approach is chosen instead.
- Modify: none yet (scaffolding only).

- [ ] **Step 1: Read the current research-system page source** in one of the two repos (they should be near-identical right now, both freshly cloned from the same origin before Plan #4 diverged): `src/app/research-system/*/page.jsx` in `/Users/Zack/organizational-coercion-index` — this is the CURRENT canonical version (author site's copy predates OCI's design-token sweep, so OCI's copy is the one to extract from, since it's the most recently touched — but content/prose must match the author's original; diff the two before choosing a source).

- [ ] **Step 2: Diff the two repos' research-system content** to confirm no prose drift already occurred:

```bash
diff -rq /Users/Zack/zacharymays-site/src/app/research-system /Users/Zack/organizational-coercion-index/src/app/research-system
```
Expected: differences are limited to color/token literals (from the Plan #4 sweep), not prose/structure. If there IS a prose difference, STOP and ask the user which version is canonical before proceeding — do not silently pick one.

- [ ] **Step 3: Create the shared package repo**

```bash
cd /Users/Zack
gh repo create oci-research-system-content --private --description "Shared Research System methodology content for zacharymays.com and organizationalcoercionindex.org"
mkdir oci-research-system-content && cd oci-research-system-content
git init -q
npm init -y
```

Edit `package.json` to set `"name": "@zacharymays-cpu/oci-research-system"`, `"main": "index.js"`, and add `react` as a peer dependency (the consuming Next.js app supplies React):

```json
{
  "name": "@zacharymays-cpu/oci-research-system",
  "version": "0.1.0",
  "private": true,
  "main": "index.js",
  "peerDependencies": { "react": "^18 || ^19" }
}
```

- [ ] **Step 4: Extract each page's content into a presentational component.** For `overview/page.jsx` as the first example: split the file into (a) a plain-JS content export (headings/prose/data arrays — no styling) and (b) a component that renders that content using semantic wrapper elements only (`<article>`, `<h1>`, `<h2>`, `<p>`, `<section>`) with **class names, not inline hex/rgba colors** — e.g. `className="rs-eyebrow"`, `className="rs-heading"`. Do NOT import `'use client'` unless the original did. Repeat for all 8 pages + the index page.

- [ ] **Step 5: Define the semantic class-name contract** in a short `CLASSNAMES.md` in the package: list every class name the components emit (e.g. `rs-eyebrow`, `rs-heading`, `rs-body`, `rs-card`, `rs-rule`, `rs-timeline-node`, `rs-timeline-line`) so each site's CSS can target them. This is the interface between shared content and per-site style.

- [ ] **Step 6: Push the package repo**

```bash
git add -A && git commit -m "feat: initial extraction of Research System content components"
git remote add origin https://github.com/zacharymays-cpu/oci-research-system-content.git
git push -u origin main
```

---

## Task 2: Consume the shared package in the OCI repo

**Files:**
- Modify: `organizational-coercion-index/package.json` (add dependency)
- Modify: `organizational-coercion-index/src/app/research-system/*/page.jsx` (thin wrappers)
- Modify: `organizational-coercion-index/src/app/globals.css` (add `.rs-*` class rules mapped to OCI tokens)

- [ ] **Step 1: Add the dependency**

```bash
cd /Users/Zack/organizational-coercion-index
npm install "github:zacharymays-cpu/oci-research-system-content#main"
```

- [ ] **Step 2: Add `.rs-*` CSS rules to `globals.css`** mapping each semantic class from `CLASSNAMES.md` to OCI's existing tokens (`var(--text-1)`, `var(--rule)`, `var(--accent)`, etc.) — e.g.:

```css
.rs-eyebrow { font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); }
.rs-heading { font-family: var(--serif); font-weight: 700; color: var(--bright); }
.rs-body { font-family: var(--body); color: var(--text-2); line-height: 1.8; }
/* ...one rule per class in CLASSNAMES.md */
```

- [ ] **Step 3: Rewrite each `src/app/research-system/*/page.jsx`** as a thin wrapper, e.g. for `overview/page.jsx`:

```jsx
import { Overview } from '@zacharymays-cpu/oci-research-system';

export const metadata = { title: 'Overview — Research System' };

export default function OverviewPage() {
  return (
    <main className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      <Overview />
    </main>
  );
}
```
Repeat for all 8 sub-pages + `research-system/page.jsx`.

- [ ] **Step 4: Verify**

Run: `npx next build`
Expected: success; all `/research-system/*` routes present.
Run `npm run dev`, visually check `/research-system/overview` renders with OCI's dark/light tokens correctly in both modes.

- [ ] **Step 5: Commit + push**

```bash
git add -A && git commit -m "refactor: consume shared research-system package; OCI-themed .rs-* styles"
git push origin main
```
(This deploys to production OCI — verify the live site after.)

---

## Task 3: Trim the author repo (remove dataset, keep research-system, add OCI CTA)

**Files:**
- Modify: `zacharymays-site/package.json` (add shared-package dep, remove Supabase/maplibre)
- Modify: `zacharymays-site/src/app/globals.css` (add `.rs-*` rules mapped to the AUTHOR's warm tokens)
- Modify: `zacharymays-site/src/app/research-system/*/page.jsx` (thin wrappers, same pattern as Task 2)
- Modify: `zacharymays-site/src/app/page.jsx` (add prominent OCI CTA)
- Modify: `zacharymays-site/src/components/Nav.jsx` (drop dataset nav groups, keep Research System)
- Remove: `oci`, `explore`, `org`, `compass`, `findings`, `admin`, `auth`, `research/children-of-god-network`, `research/twelve-tribes-network`, `api/cron/*`, `api/dataset-stats`
- Remove: dataset-only components/lib (see Global Constraints)
- Modify: `vercel.json` (drop crons), `next.config.js` (drop Supabase from CSP)

- [ ] **Step 1: Create a branch**

```bash
cd /Users/Zack/zacharymays-site
git checkout -b author-trim-research-system-shared
```

- [ ] **Step 2: Add the shared package**

```bash
npm install "github:zacharymays-cpu/oci-research-system-content#main"
```

- [ ] **Step 3: Add `.rs-*` CSS rules to `globals.css`** mapping the SAME semantic classes to the author's existing warm tokens:

```css
.rs-eyebrow { font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); }
.rs-heading { font-family: var(--serif); font-weight: 700; color: var(--paper); }
.rs-body { font-family: var(--body); color: rgba(244,240,232,0.8); line-height: 1.8; }
/* ...one rule per class in CLASSNAMES.md, using author tokens (--gold/--paper/--ink/--accent) */
```

- [ ] **Step 4: Rewrite `src/app/research-system/*/page.jsx`** as thin wrappers (same pattern as Task 2 Step 3), importing from `@zacharymays-cpu/oci-research-system`.

- [ ] **Step 5: Remove the dataset routes and components**

```bash
git rm -r src/app/oci src/app/explore src/app/org src/app/compass src/app/findings src/app/admin src/app/auth src/app/api
git rm -r src/app/research/children-of-god-network src/app/research/twelve-tribes-network
git rm src/components/Correlation.jsx src/components/CultsOverTimeChart.jsx src/components/ExploreNav.jsx src/components/LiveStats.jsx src/components/OrgCount.jsx
git rm -r src/lib/curatorLifecycle.js src/lib/curatorQueue.js src/lib/curatorSignals.js src/lib/getActiveCultsTimeline.js src/lib/getDatasetStats.js src/lib/getFindingsStats.js src/lib/intakeDedup.js src/lib/intakeProposals.js src/lib/reviewQueue.js src/lib/scoring.js src/lib/supabase.js src/lib/authCore.js src/lib/auth.ts src/lib/identity
git rm -r test tests
```
(If any of these paths no longer exist because they were already removed in an earlier session, skip that `git rm` — do not error out.)

- [ ] **Step 6: `vercel.json`** — remove the `"crons"` array entirely (all 3 pointed at now-deleted `/api/cron/*`).

- [ ] **Step 7: `next.config.js`** — remove the `SUPABASE_HOST`/`SUPABASE_FUNCTIONS_HOST` consts and drop them from the CSP `connect-src`; remove MapTiler/Carto CSP entries if no remaining page uses a map (verify: research-system pages have no maps).

- [ ] **Step 8: Drop now-unused dependencies**

```bash
npm uninstall @supabase/supabase-js @supabase/ssr maplibre-gl
```
(Only if nothing remaining imports them — verify with `grep -rIn "supabase\|maplibre" src` first; expect zero hits after Step 5.)

- [ ] **Step 9: Trim `src/components/Nav.jsx`** — remove the "Organizational Coercion Index" and "Methodology" nav groups (those pointed at now-removed routes); KEEP the "Research System" group (now pointing at the shared-content pages) and the Books/About/Support items.

- [ ] **Step 10: Add the prominent OCI CTA to `src/app/page.jsx`.** Replace the quiet nav-only link with a visible section, e.g. right after the hero:

```jsx
<section style={{ margin: '4rem 0', padding: '2rem', border: '1px solid rgba(212,206,196,0.15)', borderRadius: 4 }}>
  <p style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.75rem' }}>
    Research project
  </p>
  <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>
    The Organizational Coercion Index
  </h2>
  <p style={{ marginBottom: '1.25rem', color: 'rgba(244,240,232,0.8)', lineHeight: 1.7 }}>
    A systematic, evidence-based index measuring coercive control across hundreds of American organizations.
  </p>
  <a href="https://organizationalcoercionindex.org" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
    Explore the index →
  </a>
</section>
```
(Exact copy/placement is a judgment call — keep it visually prominent, not buried below the fold.)

- [ ] **Step 11: `sitemap.js` / `robots.js` / `opengraph-image.js`** — confirm they list author + research-system routes only (no dataset routes).

- [ ] **Step 12: Verify**

Run: `npx next build`
Expected: success. Confirm `grep -rIn "supabase\|maplibre" src` returns nothing.
Run `npm run dev`; spot-check `/`, `/about`, `/research-system/overview`, and confirm `/explore` now 404s.

- [ ] **Step 13: Commit + push as a PR (do not merge to main directly — this is production)**

```bash
git add -A
git commit -m "refactor: trim author site to author+research-system; shared research-system package; prominent OCI CTA"
git push -u origin author-trim-research-system-shared
gh pr create --title "Trim author site; share Research System content with OCI" --body "See docs/superpowers/plans/2026-07-04-05-author-trim-shared-research-system.md"
```

- [ ] **Step 14: Review the Vercel preview for the PR**, confirm the homepage CTA, nav, and research-system pages render correctly with the author's warm theme, THEN merge.

---

## Task 4: Verify sync mechanism end-to-end

- [ ] **Step 1: Make a small content edit** in the shared package repo (e.g. a typo fix in one page's prose), commit, push to `main`.

- [ ] **Step 2: Update the dependency in both consuming repos**

```bash
cd /Users/Zack/organizational-coercion-index && npm install "github:zacharymays-cpu/oci-research-system-content#main" && npx next build && git add package*.json && git commit -m "chore: bump shared research-system content" && git push
cd /Users/Zack/zacharymays-site && npm install "github:zacharymays-cpu/oci-research-system-content#main" && npx next build && git add package*.json && git commit -m "chore: bump shared research-system content" && git push
```

- [ ] **Step 2: Verify the edit appears on BOTH live sites** after their respective deploys finish — confirms the sync mechanism works end-to-end.

- [ ] **Step 3: Document the update workflow** in a short note in both repos' READMEs (or the package's own README): "To update Research System content: edit `oci-research-system-content`, push, then `npm install github:zacharymays-cpu/oci-research-system-content#main` + redeploy in both `organizational-coercion-index` and `zacharymays-site`."

---

## Self-Review Notes

- **Spec coverage**: keeps research-system on author site (user requirement 1), adds prominent OCI CTA (requirement 2), syncs via shared package (requirement 3, user's chosen mechanism over copy-sync/manual).
- **Risk called out explicitly**: Task 1 Step 2 requires diffing the two repos' current research-system content before extraction, to avoid silently picking a stale/wrong version as canonical — this is a real risk since the two repos have now diverged (OCI got the Plan #4 token sweep).
- **Production safety**: Task 3 (author-site changes) goes through a PR + preview review before merging, matching the pattern used for OCI's own design-system rollout.
- **Sync mechanism has a manual step** (`npm install` + rebuild in both repos after any content edit) — this is a deliberate tradeoff of "shared package" over full CI automation; Task 4 documents the workflow so it isn't forgotten. If this manual step proves to be a recurring pain point, a follow-up could add a GitHub Action that bumps the dependency in both repos automatically on a push to the content repo.
