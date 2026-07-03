# Plan #3 — OCI Rebrand + Name-Scrub + Canonical SEO (Repo B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the OCI repo read as the standalone "Organizational Coercion Index" — finish the name rebrand, remove the personal "Zachary Mays" identity (while preserving Young & Reed attribution), and set canonical SEO so search engines index the dataset under the canonical domain.

**Architecture:** Content + metadata changes only, in Repo B. A real OCI homepage replaces the temporary `/oci` redirect. Root layout metadata is de-personalized and points `metadataBase` at the canonical domain; every dataset page's canonical resolves to the canonical host. `sitemap.js`/`robots.js` advertise the OCI pages under the canonical domain.

**Tech Stack:** Next.js App Router metadata API.

## Global Constraints

- **Masthead brand:** "Organizational Coercion Index" (short mark "OCI"). `cultspectrum` is a redirect handle only — do not brand pages as "Cult Spectrum".
- **Canonical host:** `https://organizationalcoercionindex.org`.
- **Finish the rename:** replace remaining "The Cultiness Spectrum" strings (notably `explore/*` metadata titles) with "Organizational Coercion Index".
- **Name-scrub target = the personal identity only:** remove "Zachary S. Mays" / "Zachary Mays" author masthead/attribution. **PRESERVE every "Young & Reed" / "Young-Reed" / Daniella Mestyanek Young / Amy Reed / uncultureyourself.com reference** — these are framework attribution, not the personal brand.
- **`/terms` must exist on OCI** carrying the Young & Reed IP + non-endorsement disclaimer verbatim (it was removed from Repo B in Plan #2 as an "author page" — re-add an OCI-appropriate terms page with the IP disclaimer preserved). Correct the Plan #2 removal: `/terms` is shared/legal, not author-only.
- Three-register scoring vocabulary already centralized (Plan #1) — do not reintroduce inline tier strings.

## File Structure

- Modify: `src/app/layout.jsx` (metadata de-personalized; footer keeps Young & Reed credit, drops personal name), `src/app/page.jsx` (real OCI homepage), all `src/app/explore/*` metadata titles, `src/app/org/[slug]/page.jsx` + `src/app/oci/dataset/page.jsx` (remove personal name), `src/app/sitemap.js`, `src/app/robots.js`, `src/app/opengraph-image.js`.
- Create: `src/app/terms/page.jsx` (OCI terms with IP disclaimer), `src/lib/site.js` (canonical host constant, single source).

---

## Task 1: Canonical host constant + root metadata

- [ ] **Step 1: Create `src/lib/site.js`**

```javascript
// src/lib/site.js — single source for site-level identity.
const SITE = {
  name: 'Organizational Coercion Index',
  short: 'OCI',
  canonicalUrl: 'https://organizationalcoercionindex.org',
};
module.exports = SITE;
```

- [ ] **Step 2: Rewrite root metadata** in `src/app/layout.jsx`:

```jsx
export const metadata = {
  metadataBase: new URL('https://organizationalcoercionindex.org'),
  title: { default: 'Organizational Coercion Index', template: '%s — Organizational Coercion Index' },
  description: 'An independent, evidence-based index measuring coercive control across organizations. Applies the Young–Reed framework systematically, openly documented.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Organizational Coercion Index',
    title: 'Organizational Coercion Index',
    description: 'A systematic, evenhanded index of coercive control across organizations.',
    url: 'https://organizationalcoercionindex.org',
  },
  twitter: { card: 'summary_large_image', title: 'Organizational Coercion Index', description: 'A systematic index of coercive control across organizations.' },
};
```

- [ ] **Step 3: Footer** in `layout.jsx` — remove any "Zachary S. Mays" personal line; **keep** the "Framework: Young & Reed, uncultureyourself.com" line verbatim.

- [ ] **Step 4: Verify build**

Run: `npx next build`
Expected: Success; page `<title>` defaults to "Organizational Coercion Index".

- [ ] **Step 5: Commit**

```bash
git add src/lib/site.js src/app/layout.jsx
git commit -m "feat(oci): de-personalized root metadata + canonical host; keep Young & Reed credit"
```

## Task 2: Real OCI homepage

- [ ] **Step 1: Replace the temporary redirect** `src/app/page.jsx` with an OCI landing (headline, one-line thesis, the featured-composite/KPI + distribution summary, links into `/explore`, `/oci/methodology`, `/oci/findings`). Use the dual-mode design tokens from Plan #4 if merged; otherwise plain layout now and restyle in Plan #4. Do NOT reference the author or books.

- [ ] **Step 2: Verify** `/` renders the OCI overview, not a redirect.

Run: `npx next build && grep -c "redirect" src/app/page.jsx`
Expected: build success; `0` redirects in the homepage.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.jsx
git commit -m "feat(oci): standalone OCI homepage"
```

## Task 3: Finish the "Cultiness Spectrum" → "OCI" rename

- [ ] **Step 1: Find every remaining occurrence**

Run: `grep -rIn "Cultiness Spectrum" src/app`
Expected: a list dominated by `explore/*` metadata titles (e.g., `'Dataset Explorer — The Cultiness Spectrum'`).

- [ ] **Step 2: Replace each** metadata title suffix `— The Cultiness Spectrum` → `— Organizational Coercion Index`. Do this per file (they are static `metadata` exports). Do NOT touch the phrase "cultiness score" where it names the Young/Cultiness register (that is the correct register term) — only replace the site-name "The Cultiness Spectrum".

- [ ] **Step 3: Re-grep to confirm**

Run: `grep -rIn "The Cultiness Spectrum" src/app`
Expected: no results.

- [ ] **Step 4: Build + commit**

```bash
npx next build
git add src/app/explore
git commit -m "rebrand: finish Cultiness Spectrum -> Organizational Coercion Index"
```

## Task 4: Scrub the personal name (preserve Young & Reed)

- [ ] **Step 1: Enumerate personal-name occurrences**

Run: `grep -rIn -E "Zachary S?\.? ?Mays|zacharymays" src/app`
Expected: hits in `org/[slug]`, `oci/dataset`, and any leftover author references.

- [ ] **Step 2: For each hit, decide:** if it is personal authorship ("by Zachary Mays", author masthead, `zacharymays.com` link), remove or replace with the OCI project identity. If it is adjacent to Young & Reed credit, leave the Young & Reed part intact.

- [ ] **Step 3: Guard — confirm attribution survived**

Run: `grep -rIn -E "Young ?& ?Reed|Young-Reed|Daniella|Amy Reed|uncultureyourself" src/app | wc -l`
Expected: a non-zero count matching pre-scrub (attribution preserved). Compare against `git show HEAD~1` if unsure.

- [ ] **Step 4: Confirm the personal name is gone**

Run: `grep -rIn -E "Zachary S?\.? ?Mays|zacharymays\.com" src/app`
Expected: no results (the OG image and sitemap are handled in Task 5/6).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "scrub: remove personal author identity; preserve Young & Reed attribution"
```

## Task 5: OCI terms page with IP disclaimer

- [ ] **Step 1: Create `src/app/terms/page.jsx`** — an OCI terms page. Port the Young & Reed IP + non-endorsement disclaimer from the original author-site terms verbatim: "The Young & Reed Dual-Metric System is the intellectual property of Daniella Mestyanek Young and Amy Reed… Application of the framework in this dataset does not imply endorsement by Young, Reed, or Otterpine." Set `metadata.title = 'Terms'`.

- [ ] **Step 2: Link it** from the OCI footer in `layout.jsx`.

- [ ] **Step 3: Build + commit**

```bash
npx next build
git add src/app/terms src/app/layout.jsx
git commit -m "feat(oci): terms page carrying Young & Reed IP disclaimer"
```

## Task 6: sitemap, robots, OG image

- [ ] **Step 1: `src/app/sitemap.js`** — emit only OCI routes under `https://organizationalcoercionindex.org`. Remove author routes (about/books/donate). Include org detail pages if currently generated.

- [ ] **Step 2: `src/app/robots.js`** — set `host`/`sitemap` to the canonical domain.

- [ ] **Step 3: `src/app/opengraph-image.js`** — replace the personal-name wordmark with "Organizational Coercion Index" / "OCI". Confirm no `#c8a84b` author-gold branding remains unless intended.

- [ ] **Step 4: Verify**

Run: `npx next build` then check `curl -s https://<preview>/sitemap.xml | grep -c zacharymays`
Expected: `0` (no personal domain in sitemap).

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.js src/app/robots.js src/app/opengraph-image.js
git commit -m "feat(oci): canonical sitemap/robots/OG under organizationalcoercionindex.org"
```

---

## Self-Review Notes

- Finishes the rename (Task 3), de-personalizes identity while preserving Young & Reed everywhere (Tasks 1,4,5), sets canonical SEO (Tasks 1,6) — the part that actually unhooks the name in search.
- Corrects Plan #2's over-broad removal: `/terms` is re-added as a legal page (Task 5).
- Attribution-preservation has an explicit guard step (Task 4 Step 3), because a blind name scrub is the main risk.
- Homepage restyle coordinates with Plan #4 (design system).
